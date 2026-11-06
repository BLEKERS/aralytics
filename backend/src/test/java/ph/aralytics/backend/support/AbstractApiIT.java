package ph.aralytics.backend.support;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Shared MockMvc helpers for the functional integration tests. Each subclass dirties the
 * context before it runs so the H2 schema/data is recreated deterministically.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractApiIT {

    protected static final String STUDENT_KEY = "KEY-8821-PY";
    protected static final String TEACHER_KEY = "FAC-2025-DEPED";
    protected static final String SCHOOL_CODE = "STJUDE-MNL-2025";

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    protected JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }

    protected String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@example.test";
    }

    protected String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("identifier", identifier, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return body(result).path("token").asText();
    }

    /**
     * Runs verify-key + activate and returns the full AuthResponse JSON.
     */
    protected JsonNode activateAccount(String role, String email, String fullName, String password)
            throws Exception {
        String accessKey = "TEACHER".equalsIgnoreCase(role) ? TEACHER_KEY : STUDENT_KEY;
        MvcResult verify = mockMvc.perform(post("/api/auth/verify-key")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "institutionCode", SCHOOL_CODE,
                        "accessKey", accessKey,
                        "role", role))))
                .andExpect(status().isOk())
                .andReturn();
        String activationToken = body(verify).path("activationToken").asText();

        MvcResult activate = mockMvc.perform(post("/api/auth/activate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "activationToken", activationToken,
                        "fullName", fullName,
                        "email", email,
                        "password", password))))
                .andExpect(status().isCreated())
                .andReturn();
        return body(activate);
    }

    protected long createActivity(String teacherToken, String title, long classId, String concept)
            throws Exception {
        Map<String, Object> question = Map.of(
                "text", "What does range(3) produce in a for loop?",
                "options", List.of(
                        Map.of("key", "A", "text", "Three iterations"),
                        Map.of("key", "B", "text", "Two iterations")),
                "correctAnswer", "A",
                "points", 2,
                "concepts", List.of(concept));

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("description", "Integration-test activity");
        request.put("classId", classId);
        request.put("dueDate", OffsetDateTime.now(ZoneOffset.UTC).plusDays(7).toString());
        request.put("questions", List.of(question));

        MvcResult result = mockMvc.perform(post("/api/teacher/activities")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(request)))
                .andExpect(status().isCreated())
                .andReturn();
        return body(result).path("id").asLong();
    }

    protected void publishActivity(String teacherToken, long activityId) throws Exception {
        mockMvc.perform(post("/api/teacher/activities/" + activityId + "/publish")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherToken)))
                .andExpect(status().isOk());
    }

    protected String createPublishedActivity(String teacherToken, String title, long classId,
            String concept) throws Exception {
        long id = createActivity(teacherToken, title, classId, concept);
        publishActivity(teacherToken, id);
        return String.valueOf(id);
    }
}
