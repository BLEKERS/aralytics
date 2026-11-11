package ph.aralytics.backend.web.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import ph.aralytics.backend.security.AuthRateLimiter;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.AuthService;
import ph.aralytics.backend.service.PasswordResetService;
import ph.aralytics.backend.web.dto.AuthDtos;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth", description = "Fixed system access: issued-key verification, activation, login, and profile")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final AuthRateLimiter authRateLimiter;

    public AuthController(AuthService authService, PasswordResetService passwordResetService,
            AuthRateLimiter authRateLimiter) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.authRateLimiter = authRateLimiter;
    }

    @PostMapping("/verify-key")
    @Operation(summary = "Validate an institution code and issued access key",
            description = "Returns a short-lived, single-use activation token. No account is created yet.")
    public AuthDtos.VerifyKeyResponse verifyKey(@Valid @RequestBody AuthDtos.VerifyKeyRequest request) {
        return authService.verifyKey(request);
    }

    @PostMapping("/activate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Consume an activation token, set a password, and sign in",
            description = "Creates the USER record and the class/enrollment linkage, then returns a session JWT.")
    public AuthDtos.AuthResponse activate(@Valid @RequestBody AuthDtos.ActivateRequest request) {
        return authService.activate(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email/username and password")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Email a 15-minute password reset link",
            description = "Always returns 204 so callers cannot tell whether the email is registered.")
    public void forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        authRateLimiter.check(request.email());
        authRateLimiter.recordFailure(request.email());
        passwordResetService.requestReset(request.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Set a new password using a reset token")
    public void resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        // Brute force varies the token, so bucket reset attempts per IP instead of per token.
        authRateLimiter.check("reset-password");
        authRateLimiter.recordFailure("reset-password");
        passwordResetService.resetPassword(request.token(), request.newPassword());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Revoke the current JWT (in-memory denylist for the 40% milestone)")
    public void logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.logout(authorization);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Return the current user, role, school, and linked classes")
    public AuthDtos.MeResponse me(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return authService.currentUser(principal.userId());
    }

    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Return the current user's profile details")
    public AuthDtos.MeResponse profile(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return authService.currentUser(principal.userId());
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update the current user's name and username")
    public AuthDtos.MeResponse updateProfile(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody AuthDtos.ProfileUpdateRequest request) {
        return authService.updateProfile(principal.userId(), request);
    }

    @PutMapping("/profile/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change the current user's password")
    public void changePassword(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody AuthDtos.ProfileUpdateRequest request) {
        authService.changePassword(principal.userId(), request);
    }
}
