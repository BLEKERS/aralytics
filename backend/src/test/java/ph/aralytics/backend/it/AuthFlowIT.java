package ph.aralytics.backend.it;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;

import ph.aralytics.backend.support.AbstractApiIT;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class AuthFlowIT extends AbstractApiIT {

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
