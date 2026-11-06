package ph.aralytics.backend.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Application configuration. Secrets are supplied through environment variables in
 * application.yml (JWT_SECRET, ACTIVATION_STUDENT_KEY, ACTIVATION_TEACHER_KEY, ...).
 */
@ConfigurationProperties(prefix = "aralytics")
public record AralyticsProperties(
        Jwt jwt,
        Activation activation,
        Intervention intervention,
        Cors cors) {

    public record Jwt(String secret, long expirationMinutes) {
    }

    public record Activation(String studentKey, String teacherKey, long tokenTtlMinutes) {
    }

    public record Intervention(int threshold) {
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
