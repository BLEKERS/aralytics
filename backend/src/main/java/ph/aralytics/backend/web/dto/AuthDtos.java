package ph.aralytics.backend.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record VerifyKeyRequest(
            @NotBlank(message = "Institution code is required") String institutionCode,
            @NotBlank(message = "Access key is required") String accessKey,
            @NotBlank(message = "Role is required") String role) {
    }

    public record VerifyKeyResponse(
            String activationToken,
            OffsetDateTime expiresAt,
            String role,
            String schoolName,
            String institutionCode) {
    }

    public record ActivateRequest(
            @NotBlank(message = "Activation token is required") String activationToken,
            @NotBlank(message = "Full name is required")
            @Size(max = 160, message = "Full name must be at most 160 characters") String fullName,
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 160, message = "Email must be at most 160 characters") String email,
            @Size(max = 64, message = "Username must be at most 64 characters") String username,
            @NotBlank(message = "Password is required")
            @Pattern(regexp = "^(?=.*\\d).{8,72}$",
                    message = "Password must be 8-72 characters and contain at least one number")
            String password) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email, username, or student ID is required") String identifier,
            @NotBlank(message = "Password is required") String password) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Email must be valid")
            @Size(max = 160, message = "Email must be at most 160 characters") String email) {
    }

    public record ResetPasswordRequest(
            @NotBlank(message = "Reset token is required") String token,
            @NotBlank(message = "Password is required")
            @Pattern(regexp = "^(?=.*\\d).{8,72}$",
                    message = "Password must be 8-72 characters and contain at least one number")
            String newPassword) {
    }

    public record UserSummary(
            Long id,
            String username,
            String fullName,
            String email,
            String role,
            Long schoolId,
            String schoolName,
            OffsetDateTime createdAt,
            OffsetDateTime lastLogin) {
    }

    public record ClassSummary(
            Long id,
            String name,
            Long schoolId,
            String schoolName,
            Long teacherId,
            String teacherName) {
    }

    public record MeResponse(
            UserSummary user,
            List<ClassSummary> classes) {
    }

    /** Shared body for profile edits and password changes; unused fields are ignored. */
    public record ProfileUpdateRequest(
            @Size(max = 160, message = "Full name must be at most 160 characters") String fullName,
            @Size(max = 64, message = "Username must be at most 64 characters") String username,
            String currentPassword,
            String newPassword) {
    }

    public record AuthResponse(
            String token,
            String tokenType,
            OffsetDateTime expiresAt,
            UserSummary user,
            List<ClassSummary> classes) {
    }
}
