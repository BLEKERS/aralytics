package ph.aralytics.backend.service;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.domain.PasswordResetToken;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.BadRequestException;
import ph.aralytics.backend.repository.PasswordResetTokenRepository;
import ph.aralytics.backend.repository.UserRepository;

/**
 * Emails a single-use reset link and applies the new password. Unknown emails return
 * the same empty response so the endpoint cannot be used to enumerate accounts.
 */
@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final String fromAddress;
    private final String frontendBaseUrl;
    private final long ttlMinutes;

    public PasswordResetService(UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            ObjectProvider<JavaMailSender> mailSender,
            @Value("${spring.mail.username:}") String fromAddress,
            @Value("${aralytics.password-reset.frontend-base-url:http://localhost:3000}") String frontendBaseUrl,
            @Value("${aralytics.password-reset.token-ttl-minutes:15}") long ttlMinutes) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.frontendBaseUrl = frontendBaseUrl.replaceAll("/+$", "");
        this.ttlMinutes = ttlMinutes;
    }

    @Transactional
    public void requestReset(String email) {
        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            tokenRepository.deleteByUserId(user.getId());
            PasswordResetToken reset = new PasswordResetToken();
            reset.setUser(user);
            reset.setToken(randomToken());
            reset.setExpiryDate(OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(ttlMinutes));
            tokenRepository.save(reset);
            sendEmail(user, reset.getToken());
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken reset = tokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("This reset link is invalid or has expired."));
        if (reset.getExpiryDate().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            tokenRepository.delete(reset);
            throw new BadRequestException("This reset link is invalid or has expired.");
        }

        User user = reset.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(reset);
    }

    private void sendEmail(User user, String token) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || fromAddress.isBlank()) {
            log.warn("Password reset email not sent: spring.mail is not configured.");
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(user.getEmail());
        message.setSubject("Reset your Aralytics password");
        message.setText("Hi " + user.getFullName() + ",\n\n"
                + "Use this link to set a new password. It expires in " + ttlMinutes + " minutes:\n"
                + frontendBaseUrl + "/reset-password?token=" + token + "\n\n"
                + "If you did not request this, you can ignore this email.");
        try {
            sender.send(message);
        } catch (Exception exception) {
            // A mail failure must not reveal whether the account exists.
            log.warn("Password reset email failed: {}", exception.getMessage());
        }
    }

    private String randomToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
