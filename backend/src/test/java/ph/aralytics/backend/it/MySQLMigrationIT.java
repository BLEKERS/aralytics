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
import org.testcontainers.containers.MySQLContainer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that the MySQL migrations (and the dev seed) apply cleanly on a real MySQL 8
 * instance. Docker is not available in every environment, so the class is disabled when no
 * Docker daemon is reachable. The container is started in a static initializer so its JDBC
 * URL exists before Spring reads {@link DynamicPropertySource} values.
 */
@EnabledIf("dockerAvailable")
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class MySQLMigrationIT {

    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("aralytics")
            .withUsername("test")
            .withPassword("test");

    static {
        if (dockerAvailable()) {
            MYSQL.start();
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
        if (MYSQL.isRunning()) {
            MYSQL.stop();
        }
    }

    @DynamicPropertySource
    static void mysqlProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.flyway.locations",
                () -> "classpath:db/migration,classpath:db/seed");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
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
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
                String.class);
        List<String> normalized = tableNames.stream()
                .map(name -> name.toLowerCase(Locale.ROOT))
                .toList();

        assertThat(normalized).contains(
                "subscription", "school", "user", "class", "enrollment", "quiz", "question",
                "concept", "question_concept", "submission", "answer", "feedback",
                "feedback_concept", "progress_record", "notification");

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM `USER`", Integer.class))
                .isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM `QUIZ`", Integer.class))
                .isEqualTo(3);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT institutionCode FROM `SCHOOL` WHERE id = 1", String.class))
                .isEqualTo("STJUDE-MNL-2025");
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

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + body.path("token").asText()))
                .andExpect(status().isOk());
    }
}
