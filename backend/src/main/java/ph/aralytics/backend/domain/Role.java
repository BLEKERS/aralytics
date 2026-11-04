package ph.aralytics.backend.domain;

/**
 * Application roles. ADMIN is intentionally out of scope for the 40% milestone:
 * school administrators are a provisioning/buyer stakeholder, not an in-product role
 * (PRD section 3.3).
 */
public enum Role {
    STUDENT,
    TEACHER
}
