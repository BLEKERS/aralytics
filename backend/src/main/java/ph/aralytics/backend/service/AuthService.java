package ph.aralytics.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.jsonwebtoken.Claims;
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
import ph.aralytics.backend.security.AuthRateLimiter;
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
    private final DtoMapper dtoMapper;
    private final AuthRateLimiter authRateLimiter;

    public AuthService(SchoolRepository schoolRepository, UserRepository userRepository,
            ClassRepository classRepository, EnrollmentRepository enrollmentRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService, JwtDenylist jwtDenylist,
            ActivationTokenStore activationTokenStore, AuthenticationManager authenticationManager,
            DtoMapper dtoMapper, AuthRateLimiter authRateLimiter) {
        this.schoolRepository = schoolRepository;
        this.userRepository = userRepository;
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtDenylist = jwtDenylist;
        this.activationTokenStore = activationTokenStore;
        this.authenticationManager = authenticationManager;
        this.dtoMapper = dtoMapper;
        this.authRateLimiter = authRateLimiter;
    }

    /**
     * No public self-signup: a valid institution code plus an issued access key is required.
     * Errors stay deliberately generic so callers cannot enumerate schools or keys.
     */
    public AuthDtos.VerifyKeyResponse verifyKey(AuthDtos.VerifyKeyRequest request) {
        authRateLimiter.check(request.institutionCode());
        Role role = parseRole(request.role());
        School school = schoolRepository.findByInstitutionCodeIgnoreCase(request.institutionCode().trim())
                .orElseThrow(() -> {
                    authRateLimiter.recordFailure(request.institutionCode());
                    return new InvalidCredentialsException("Invalid institution code or access key.");
                });

        String expectedHash = role == Role.STUDENT
                ? school.getStudentActivationKeyHash()
                : school.getTeacherActivationKeyHash();
        if (!keyMatches(request.accessKey(), expectedHash)) {
            authRateLimiter.recordFailure(request.institutionCode());
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
        ActivationTokenStore.PendingActivation pending = activationTokenStore.peek(request.activationToken())
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

        // Consume only after every validation above passes; a rejected attempt keeps the token.
        if (activationTokenStore.consume(request.activationToken()).isEmpty()) {
            throw new InvalidCredentialsException(
                    "Activation token is invalid, expired, or has already been used.");
        }
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
        authRateLimiter.check(request.identifier());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.identifier().trim(), request.password()));
        } catch (AuthenticationException exception) {
            authRateLimiter.recordFailure(request.identifier());
            throw new InvalidCredentialsException("Invalid email/username or password.");
        }

        User user = userRepository.findByEmailIgnoreCaseOrUsername(
                request.identifier().trim(), request.identifier().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email/username or password."));
        user.setLastLogin(OffsetDateTime.now(ZoneOffset.UTC));
        return authResponse(user);
    }

    @Transactional
    public AuthDtos.MeResponse updateProfile(Long userId, AuthDtos.ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String fullName = request.fullName() == null ? "" : request.fullName().trim();
        if (fullName.isEmpty()) {
            throw new BadRequestException("Full name is required.");
        }
        String username = request.username() == null ? "" : request.username().trim();
        if (username.isEmpty()) {
            throw new BadRequestException("Username is required.");
        }
        userRepository.findByUsername(username)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new ConflictException("That username is already taken.");
                });

        user.setFullName(fullName);
        user.setUsername(username);
        userRepository.save(user);
        return new AuthDtos.MeResponse(dtoMapper.toUserSummary(user), classesFor(user));
    }

    @Transactional
    public void changePassword(Long userId, AuthDtos.ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (request.currentPassword() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        String newPassword = request.newPassword();
        if (newPassword == null || !newPassword.matches("^(?=.*\\d).{8,72}$")) {
            throw new BadRequestException("New password must be 8-72 characters and contain at least one number.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
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

    private boolean keyMatches(String provided, String storedHash) {
        if (provided == null || storedHash == null) {
            return false;
        }
        return MessageDigest.isEqual(
                sha256Hex(provided).getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8));
    }

    // Activation keys are high-entropy secrets; a fast hash is enough and keeps verify-key cheap.
    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
