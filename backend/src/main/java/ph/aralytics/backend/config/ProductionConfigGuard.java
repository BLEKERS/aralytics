package ph.aralytics.backend.config;

import java.nio.charset.StandardCharsets;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/**
 * Refuses to start a production deployment with development defaults. Without this, the
 * `prod` profile silently signs tokens with the public example secret used in the repo.
 */
@Component
public class ProductionConfigGuard implements ApplicationRunner {

    private static final String DEFAULT_JWT_SECRET =
            "dev-only-secret-change-me-in-production-please-0123456789";

    private final Environment environment;
    private final AralyticsProperties properties;

    public ProductionConfigGuard(Environment environment, AralyticsProperties properties) {
        this.environment = environment;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!environment.acceptsProfiles(Profiles.of("prod"))) {
            return;
        }
        if (environment.acceptsProfiles(Profiles.of("seed"))) {
            throw new IllegalStateException("The seed profile must not run with the prod profile.");
        }
        String secret = properties.jwt() == null ? null : properties.jwt().secret();
        if (secret == null || secret.isBlank() || secret.equals(DEFAULT_JWT_SECRET)
                || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "Refusing to start with the default JWT_SECRET. Set a unique secret of at least 32 bytes.");
        }
    }
}
