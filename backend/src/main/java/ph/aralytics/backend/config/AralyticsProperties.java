package ph.aralytics.backend.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Application configuration. Secrets are supplied through environment variables in
 * application.yml (JWT_SECRET, ...); activation keys are stored per school in the database.
 */
@ConfigurationProperties(prefix = "aralytics")
public record AralyticsProperties(
        Jwt jwt,
        Activation activation,
        Intervention intervention,
        Cors cors) {

    public record Jwt(String secret, long expirationMinutes) {
    }

    public record Activation(long tokenTtlMinutes) {
    }

    public record Intervention(int threshold) {
    }

    public record Cors(List<String> allowedOrigins) {
    }
}
