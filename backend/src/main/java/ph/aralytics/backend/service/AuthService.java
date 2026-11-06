package ph.aralytics.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.jsonwebtoken.Claims;
import ph.aralytics.backend.config.AralyticsProperties;
import ph.aralytics.backend.domain.ClassEntity;
import ph.aralytics.backend.domain.Enrollment;
import ph.aralytics.backend.domain.Role;
import ph.aralytics.backend.domain.School;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.BadRequestException;
import ph.aralytics.backend.exception.ConflictException;
import ph.aralytics.backend.exception.InvalidCredentialsException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.ClassRepository;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.SchoolRepository;
import ph.aralytics.backend.repository.UserRepository;
import ph.aralytics.backend.security.JwtDenylist;
import ph.aralytics.backend.security.JwtService;
import ph.aralytics.backend.web.dto.AuthDtos;

@Service
public class AuthService {

    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtDenylist jwtDenylist;
    private final ActivationTokenStore activationTokenStore;
    private final AuthenticationManager authenticationManager;
    private final AralyticsProperties properties;
    private final DtoMapper dtoMapper;

    public AuthService(SchoolRepository schoolRepository, UserRepository userRepository,
            ClassRepository classRepository, EnrollmentRepository enrollmentRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService, JwtDenylist jwtDenylist,
            ActivationTokenStore activationTokenStore, AuthenticationManager authenticationManager,
            AralyticsProperties properties, DtoMapper dtoMapper) {
        this.schoolRepository = schoolRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtDenylist = jwtDenylist;
        this.activationTokenStore = activationTokenStore;
        this.authenticationManager = authenticationManager;
        this.properties = properties;
        this.dtoMapper = dtoMapper;
    }

    /**
     * No public self-signup: a valid institution code plus an issued access key is required.
     * Errors stay deliberately generic so callers cannot enumerate schools or keys.
     */
    public AuthDtos.VerifyKeyResponse verifyKey(AuthDtos.VerifyKeyRequest request) {
        Role role = parseRole(request.role());
        School school = schoolRepository.findByInstitutionCodeIgnoreCase(request.institutionCode().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid institution code or access key."));

        String expectedKey = role == Role.STUDENT
                ? properties.activation().studentKey()
                : properties.activation().teacherKey();
        if (!constantTimeEquals(expectedKey, request.accessKey())) {
            throw new InvalidCredentialsException("Invalid institution code or access key.");
        }

        ActivationTokenStore.PendingActivation pending = activationTokenStore.issue(school.getId(), role);
        return new AuthDtos.VerifyKeyResponse(
                pending.token(),
                OffsetDateTime.ofInstant(pending.expiresAt(), ZoneOffset.UTC),
                role.name(),
                school.getName(),
                school.getInstitutionCode());
    }

    @Transactional
    public AuthDtos.AuthResponse activate(AuthDtos.ActivateRequest request) {
        ActivationTokenStore.PendingActivation pending = activationTokenStore.consume(request.activationToken())
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Activation token is invalid, expired, or has already been used."));

        School school = schoolRepository.findById(pending.schoolId())
                .orElseThrow(() -> new ResourceNotFoundException("School not found for this activation token."));

        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(uniqueUsername(request.username(), email));
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setSchool(school);
        user.setRole(pending.role());
        user.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        user = userRepository.save(user);
        final User activated = user;

        if (pending.role() == Role.STUDENT) {
            ClassEntity clazz = classRepository.findAllBySchoolIdOrderByIdAsc(school.getId()).stream()
                    .findFirst()
                    .orElseGet(() -> {
                        ClassEntity created = new ClassEntity();
                        created.setName("General Section");
                        created.setSchool(school);
                        return classRepository.save(created);
                    });
            Enrollment enrollment = new Enrollment();
            enrollment.setStudent(user);
            enrollment.setClazz(clazz);
            enrollmentRepository.save(enrollment);
        } else {
            ClassEntity clazz = classRepository
                    .findFirstBySchoolIdAndTeacherIsNullOrderByIdAsc(school.getId())
                    .orElseGet(() -> {
                        ClassEntity created = new ClassEntity();
                        created.setName("CS Section - " + activated.getFullName());
                        created.setSchool(school);
                        return created;
                    });
            clazz.setTeacher(user);
            classRepository.save(clazz);
        }

        return authResponse(user);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.identifier().trim(), request.password()));
        } catch (AuthenticationException exception) {
            throw new InvalidCredentialsException("Invalid email/username or password.");
        }

        User user = userRepository.findByEmailIgnoreCaseOrUsername(
                request.identifier().trim(), request.identifier().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email/username or password."));
        user.setLastLogin(OffsetDateTime.now(ZoneOffset.UTC));
        return authResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.MeResponse currentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        return new AuthDtos.MeResponse(dtoMapper.toUserSummary(user), classesFor(user));
    }

    public void logout(String bearerToken) {
        if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
            return;
        }
        try {
            Claims claims = jwtService.parse(bearerToken.substring(7).trim());
            jwtDenylist.revoke(claims.getId(), jwtService.expirationOf(claims));
        } catch (Exception ignored) {
            // Logout is idempotent: an invalid or already-expired token needs no revocation.
        }
    }

    private AuthDtos.AuthResponse authResponse(User user) {
        String token = jwtService.generateToken(user);
        Claims claims = jwtService.parse(token);
        return new AuthDtos.AuthResponse(
                token,
                "Bearer",
                jwtService.expirationDateTime(claims),
                dtoMapper.toUserSummary(user),
                classesFor(user));
    }

    private List<AuthDtos.ClassSummary> classesFor(User user) {
        List<ClassEntity> classes = user.getRole() == Role.TEACHER
                ? classRepository.findAllByTeacherIdOrderByIdAsc(user.getId())
                : enrollmentRepository.findAllByStudentId(user.getId()).stream()
                        .map(Enrollment::getClazz)
                        .toList();
        return classes.stream().map(dtoMapper::toClassSummary).toList();
    }

    private String uniqueUsername(String requested, String email) {
        String base = requested == null || requested.isBlank() ? email : requested.trim();
        base = base.length() > 64 ? base.substring(0, 64) : base;
        if (!userRepository.existsByUsername(base)) {
            return base;
        }
        int suffix = 2;
        String candidate = base;
        while (userRepository.existsByUsername(candidate)) {
            String suffixText = "-" + suffix++;
            candidate = base.substring(0, Math.min(base.length(), 64 - suffixText.length())) + suffixText;
        }
        return candidate;
    }

    private Role parseRole(String rawRole) {
        if (rawRole == null) {
            throw new BadRequestException("Role is required.");
        }
        return switch (rawRole.trim().toUpperCase()) {
            case "STUDENT" -> Role.STUDENT;
            case "TEACHER", "EDUCATOR" -> Role.TEACHER;
            default -> throw new BadRequestException("Role must be STUDENT or TEACHER.");
        };
    }

    private boolean constantTimeEquals(String expected, String provided) {
        if (expected == null || provided == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8));
    }
}
