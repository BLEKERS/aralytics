package ph.aralytics.backend.service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

import ph.aralytics.backend.config.AralyticsProperties;
import ph.aralytics.backend.domain.Role;

/**
 * Short-lived, single-use activation tokens. Kept in memory for the 40% milestone; in a
 * multi-instance production deployment this belongs in Redis or a dedicated table with a
 * TTL. The issued access key itself is never stored in the token.
 */
@Component
public class ActivationTokenStore {

    public record PendingActivation(String token, Long schoolId, Role role, Instant expiresAt) {
    }

    private final Map<String, PendingActivation> tokens = new ConcurrentHashMap<>();
    private final AralyticsProperties properties;

    public ActivationTokenStore(AralyticsProperties properties) {
        this.properties = properties;
    }

    public PendingActivation issue(Long schoolId, Role role) {
        Instant expiresAt = Instant.now().plusSeconds(properties.activation().tokenTtlMinutes() * 60);
        PendingActivation pending = new PendingActivation(UUID.randomUUID().toString(), schoolId, role, expiresAt);
        tokens.put(pending.token(), pending);
        return pending;
    }

    public Optional<PendingActivation> consume(String token) {
        PendingActivation pending = tokens.remove(token);
        if (pending == null) {
            return Optional.empty();
        }
        if (pending.expiresAt().isBefore(Instant.now())) {
            return Optional.empty();
        }
        return Optional.of(pending);
    }
}
