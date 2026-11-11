package ph.aralytics.backend.it;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;

import ph.aralytics.backend.domain.PasswordResetToken;
import ph.aralytics.backend.repository.PasswordResetTokenRepository;
import ph.aralytics.backend.repository.UserRepository;
import ph.aralytics.backend.support.AbstractApiIT;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class AuthFlowIT extends AbstractApiIT {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Test
    void forgotPasswordIssuesTokenAndResetChangesPassword() throws Exception {
        String email = uniqueEmail("reset");
        activateAccount("STUDENT", email, "Reset Student", "Student123");
        Long userId = userRepository.findByEmailIgnoreCase(email).orElseThrow().getId();

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email))))
                .andExpect(status().isNoContent());

        PasswordResetToken reset = passwordResetTokenRepository.findByUserId(userId).orElseThrow();
        assertThat(reset.getExpiryDate()).isAfter(OffsetDateTime.now(ZoneOffset.UTC));

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("token", reset.getToken(), "newPassword", "Newpass123"))))
                .andExpect(status().isNoContent());

        assertThat(passwordResetTokenRepository.findByToken(reset.getToken())).isEmpty();
        assertThat(login(email, "Newpass123")).isNotBlank();
    }

    @Test
    void forgotPasswordIsRateLimitedPerEmailAndIp() throws Exception {
        String email = uniqueEmail("rate-limit");

        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json(Map.of("email", email))))
                    .andExpect(status().isNoContent());
        }

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email))))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void activationProfileLoginAndLogoutFlow() throws Exception {
        String email = uniqueEmail("new-student");

        MvcResult verify = mockMvc.perform(post("/api/auth/verify-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "institutionCode", SCHOOL_CODE,
                        "accessKey", STUDENT_KEY,
                        "role", "STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andReturn();
        JsonNode verifyBody = body(verify);
        assertThat(verifyBody.path("role").asText()).isEqualTo("STUDENT");
        assertThat(verifyBody.path("activationToken").asText()).isNotBlank();
        assertThat(verifyBody.path("schoolName").asText()).isEqualTo("St. Jude Academy Manila");

        MvcResult activate = mockMvc.perform(post("/api/auth/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "activationToken", verifyBody.path("activationToken").asText(),
                        "fullName", "Test Student",
                        "email", email,
                        "password", "Student123"))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode activated = body(activate);
        String token = activated.path("token").asText();
        assertThat(token).isNotBlank();
        assertThat(activated.path("user").path("email").asText()).isEqualTo(email);
        assertThat(activated.path("user").path("role").asText()).isEqualTo("STUDENT");
        assertThat(activated.path("classes")).isNotEmpty();

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString(email)));

        String loginToken = login(email, "Student123");
        assertThat(loginToken).isNotBlank();

        mockMvc.perform(post("/api/auth/logout")
                .header(HttpHeaders.AUTHORIZATION, bearer(loginToken)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, bearer(loginToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void profileUpdateAndPasswordChangeFlow() throws Exception {
        String email = uniqueEmail("profile");
        JsonNode activated = activateAccount("STUDENT", email, "Profile Student", "Student123");
        String token = activated.path("token").asText();

        MvcResult current = mockMvc.perform(get("/api/auth/profile")
                .header(HttpHeaders.AUTHORIZATION, bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(current.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .contains(email);
        assertThat(body(current).path("user").path("username").asText()).isNotBlank();

        String newUsername = "profile-" + java.util.UUID.randomUUID().toString().substring(0, 8);
        MvcResult updated = mockMvc.perform(put("/api/auth/profile")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "fullName", "Renamed Student",
                        "username", newUsername))))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(updated).path("user").path("fullName").asText())
                .isEqualTo("Renamed Student");
        assertThat(body(updated).path("user").path("username").asText())
                .isEqualTo(newUsername);

        // Another user's username stays off-limits.
        mockMvc.perform(put("/api/auth/profile")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "fullName", "Renamed Student",
                        "username", "s2024-9102"))))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/auth/profile/password")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "currentPassword", "wrong-password",
                        "newPassword", "NewPass123"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/auth/profile/password")
                .header(HttpHeaders.AUTHORIZATION, bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "currentPassword", "Student123",
                        "newPassword", "NewPass123"))))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "identifier", newUsername,
                        "password", "Student123"))))
                .andExpect(status().isUnauthorized());

        assertThat(login(newUsername, "NewPass123")).isNotBlank();
    }

    @Test
    void teacherActivationCreatesAnOwnedClass() throws Exception {
        JsonNode activated = activateAccount("TEACHER", uniqueEmail("new-teacher"),
                "New Teacher", "Teacher123");

        assertThat(activated.path("user").path("role").asText()).isEqualTo("TEACHER");
        assertThat(activated.path("classes")).hasSize(1);
        assertThat(activated.path("classes").get(0).path("teacherId").asLong())
                .isEqualTo(activated.path("user").path("id").asLong());
    }

    @Test
    void invalidKeyAndReusedActivationTokenAreRejected() throws Exception {
        mockMvc.perform(post("/api/auth/verify-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "institutionCode", SCHOOL_CODE,
                        "accessKey", "WRONG-KEY",
                        "role", "STUDENT"))))
                .andExpect(status().isUnauthorized());

        MvcResult verify = mockMvc.perform(post("/api/auth/verify-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "institutionCode", SCHOOL_CODE,
                        "accessKey", STUDENT_KEY,
                        "role", "STUDENT"))))
                .andExpect(status().isOk())
                .andReturn();
        String activationToken = body(verify).path("activationToken").asText();

        String request = json(java.util.Map.of(
                "activationToken", activationToken,
                "fullName", "Reuse Tester",
                "email", uniqueEmail("reuse"),
                "password", "Student123"));

        mockMvc.perform(post("/api/auth/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "activationToken", activationToken,
                        "fullName", "Reuse Tester",
                        "email", uniqueEmail("reuse-two"),
                        "password", "Student123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void failedActivationValidationKeepsTokenUsable() throws Exception {
        MvcResult verify = mockMvc.perform(post("/api/auth/verify-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "institutionCode", SCHOOL_CODE,
                        "accessKey", STUDENT_KEY,
                        "role", "STUDENT"))))
                .andExpect(status().isOk())
                .andReturn();
        String activationToken = body(verify).path("activationToken").asText();

        // Duplicate email must not consume the single-use token.
        mockMvc.perform(post("/api/auth/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "activationToken", activationToken,
                        "fullName", "Duplicate Email",
                        "email", "miguel@school.edu.ph",
                        "password", "Student123"))))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "activationToken", activationToken,
                        "fullName", "Retry Student",
                        "email", uniqueEmail("after-failure"),
                        "password", "Student123"))))
                .andExpect(status().isCreated());
    }

    @Test
    void loginRejectsWrongPasswordWithProblemJson() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(java.util.Map.of(
                        "identifier", "miguel@school.edu.ph",
                        "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andReturn();

        assertThat(result.getResponse().getContentType())
                .contains(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        assertThat(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .contains("Invalid email/username or password");
    }
}
