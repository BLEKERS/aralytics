package ph.aralytics.backend.security;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * In-memory JWT denylist used by logout. This keeps the service stateless with respect to
 * sessions but is process-local: restarting the app forgets revocations, and multi-instance
 * deployments do not share them. Production should use Redis with TTL equal to the token
 * lifetime (documented in backend/README.md).
 */
@Component
public class JwtDenylist {

    private final Map<String, Instant> revokedTokens = new ConcurrentHashMap<>();

    public void revoke(String jti, Instant expiresAt) {
        if (jti != null && expiresAt != null) {
            revokedTokens.put(jti, expiresAt);
        }
    }

    public boolean isRevoked(String jti) {
        if (jti == null) {
            return false;
        }
        Instant expiresAt = revokedTokens.get(jti);
        if (expiresAt == null) {
            return false;
        }
        if (expiresAt.isBefore(Instant.now())) {
            revokedTokens.remove(jti);
            return false;
        }
        return true;
    }
}
