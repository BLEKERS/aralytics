package ph.aralytics.backend.security;

import ph.aralytics.backend.domain.Role;

/**
 * Lightweight principal reconstructed from JWT claims on every request. No database
 * lookup is performed in the filter (stateless JWT); authorization-sensitive services
 * still re-load entities and verify ownership.
 */
public record AuthenticatedPrincipal(Long userId, String username, String email, Role role, Long schoolId) {
}
