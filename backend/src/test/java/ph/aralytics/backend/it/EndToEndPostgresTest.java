package ph.aralytics.backend.it;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the PostgreSQL baseline migration + dev seed on a real PostgreSQL 16
 * instance, then exercises login, quiz submission and feedback retrieval through the API.
 * Docker is not available in every environment, so the class is disabled without a daemon.
 */
@EnabledIf("dockerAvailable")
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class EndToEndPostgresTest {

    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("aralytics")
            .withUsername("test")
            .withPassword("test");

    static {
        if (dockerAvailable()) {
            POSTGRES.start();
        }
    }

    static boolean dockerAvailable() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable throwable) {
            return false;
        }
    }

    @AfterAll
    static void stopContainer() {
        if (POSTGRES.isRunning()) {
            POSTGRES.stop();
        }
    }

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.flyway.locations", () -> "classpath:db/migration,classpath:db/seed");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.sql.init.mode", () -> "never");
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void flywayAppliesEveryErdTableAndTheDevSeed() {
        List<String> tableNames = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
                String.class);
        List<String> normalized = tableNames.stream()
                .map(name -> name.toLowerCase(Locale.ROOT))
                .toList();

        assertThat(normalized).contains(
                "subscription", "school", "app_user", "class", "enrollment", "quiz", "question",
                "concept", "question_concept", "submission", "answer", "feedback",
                "feedback_concept", "progress_record", "notification",
                "teacher_settings", "password_reset_tokens", "quiz_draft", "pilot_inquiry");

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM app_user", Integer.class))
                .isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM quiz", Integer.class))
                .isEqualTo(3);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT institutionCode FROM school WHERE id = 1", String.class))
                .isEqualTo("STJUDE-MNL-2025");
    }

    @Test
    void seededStudentCanLoginSubmitAndFetchFeedback() throws Exception {
        String token = login("miguel@school.edu.ph", "student123");

        MvcResult submit = mockMvc.perform(post("/api/student/quiz/1/submit")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("answers", List.of(
                        Map.of("questionId", 1, "selectedOption", "A"),
                        Map.of("questionId", 2, "selectedOption", "A"),
                        Map.of("questionId", 3, "selectedOption", "A"))))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode submitBody = objectMapper.readTree(
                submit.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(submitBody.path("score").asText()).isEqualTo("66.67");
        assertThat(submitBody.path("feedbackStatus").asText()).isEqualTo("READY");

        mockMvc.perform(get("/api/student/feedback/" + submitBody.path("submissionId").asLong())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void numberedOptionKeysCanBeCreatedPublishedAndSubmitted() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        Map<String, Object> request = Map.of(
                "title", "Numbered option keys",
                "classId", 1,
                "questions", List.of(Map.of(
                        "text", "Pick the first option",
                        "options", List.of(
                                Map.of("key", "1", "text", "One"),
                                Map.of("key", "2", "text", "Two"),
                                Map.of("key", "3", "text", "Three"),
                                Map.of("key", "4", "text", "Four"))),
                        "correctAnswer", "1",
                        "points", 1,
                        "concepts", List.of("Variables")));

        MvcResult created = mockMvc.perform(post("/api/teacher/activities")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
        long quizId = objectMapper.readTree(
                created.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("id").asLong();

        mockMvc.perform(post("/api/teacher/activities/" + quizId + "/publish")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken))
                .andExpect(status().isOk());

        long questionId = jdbcTemplate.queryForObject(
                "SELECT id FROM question WHERE quizId = ? ORDER BY id LIMIT 1", Long.class, quizId);
        String studentToken = login("miguel@school.edu.ph", "student123");
        MvcResult submit = mockMvc.perform(post("/api/student/quiz/" + quizId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + studentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("answers", List.of(
                        Map.of("questionId", questionId, "selectedOption", "1"))))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(
                submit.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(body.path("score").asText()).isEqualTo("100.00");
    }

    @Test
    void seededTeacherCanLogInThroughTheApi() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "identifier", "maria.santos@university.edu.ph",
                        "password", "teacher123"))))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = objectMapper.readTree(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertThat(body.path("token").asText()).isNotBlank();
        assertThat(body.path("user").path("role").asText()).isEqualTo("TEACHER");

        mockMvc.perform(get("/api/auth/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + body.path("token").asText()))
                .andExpect(status().isOk());
    }

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                        "identifier", identifier,
                        "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .path("token").asText();
    }
}
