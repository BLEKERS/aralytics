package ph.aralytics.backend.it;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;

import ph.aralytics.backend.support.AbstractApiIT;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class QuizLifecycleIT extends AbstractApiIT {

    @Test
    void teacherAuthorsPublishesAndStudentCompletesActivity() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        String title = "Lifecycle " + java.util.UUID.randomUUID().toString().substring(0, 6);

        MvcResult created = mockMvc.perform(post("/api/teacher/activities")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "title", title,
                        "description", "Loop check",
                        "classId", 1,
                        "dueDate", java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC)
                                .plusDays(5).toString(),
                        "questions", List.of(Map.of(
                                "text", "How many iterations does range(3) produce?",
                                "options", List.of(
                                        Map.of("key", "A", "text", "Three iterations"),
                                        Map.of("key", "B", "text", "Two iterations")),
                                "correctAnswer", "A",
                                "points", 2,
                                "concepts", List.of("Loops")))))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode createdBody = body(created);
        long activityId = createdBody.path("id").asLong();
        assertThat(createdBody.path("status").asText()).isEqualTo("DRAFT");
        assertThat(createdBody.path("totalPoints").asInt()).isEqualTo(2);

        mockMvc.perform(patch("/api/teacher/activities/" + activityId)
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("title", title + " (revised)"))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/teacher/activities/" + activityId + "/publish")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherToken)))
                .andExpect(status().isOk());

        String studentToken = login("miguel@school.edu.ph", "student123");

        MvcResult activitiesResult = mockMvc.perform(get("/api/student/activities")
                .param("category", "all")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode activities = body(activitiesResult);
        boolean listed = false;
        for (JsonNode activity : activities) {
            if (activity.path("id").asLong() == activityId) {
                listed = true;
                assertThat(activity.path("status").asText()).isEqualTo("ASSIGNED");
            }
        }
        assertThat(listed).isTrue();

        MvcResult quizResult = mockMvc.perform(get("/api/student/quiz/" + activityId)
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isOk())
                .andReturn();
        String quizJson = quizResult.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(quizJson).doesNotContain("correctAnswer");
        JsonNode quiz = objectMapper.readTree(quizJson);
        long questionId = quiz.path("questions").get(0).path("id").asLong();
        assertThat(quiz.path("totalPoints").asInt()).isEqualTo(2);
        assertThat(quiz.path("submitted").asBoolean()).isFalse();

        mockMvc.perform(patch("/api/student/quiz/" + activityId + "/answer")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("questionId", questionId, "selectedOption", "A"))))
                .andExpect(status().isOk());

        MvcResult draftReload = mockMvc.perform(get("/api/student/quiz/" + activityId)
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(draftReload).path("questions").get(0).path("savedAnswer").asText())
                .isEqualTo("A");

        MvcResult submitResult = mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", questionId, "selectedOption", "A"))))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode submitted = body(submitResult);
        assertThat(submitted.path("score").decimalValue()).isEqualByComparingTo("100.00");
        assertThat(submitted.path("feedbackStatus").asText()).isEqualTo("READY");
        assertThat(submitted.path("feedback").path("content").asText()).isNotBlank();
        assertThat(submitted.path("feedback").path("content").asText())
                .doesNotContain("Three iterations");
        long submissionId = submitted.path("submissionId").asLong();

        mockMvc.perform(get("/api/student/feedback/" + submissionId)
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers
                        .jsonPath("$.status").value("READY"));

        MvcResult dashboard = mockMvc.perform(get("/api/student/dashboard")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(dashboard).path("completedCount").asInt()).isGreaterThanOrEqualTo(1);

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", questionId, "selectedOption", "A"))))))
                .andExpect(status().isConflict());
    }

    @Test
    void draftActivityIsInvisibleToStudents() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        long draftId = createActivity(teacherToken, "Draft " + java.util.UUID.randomUUID(), 1, "Loops");

        String studentToken = login("miguel@school.edu.ph", "student123");
        mockMvc.perform(get("/api/student/quiz/" + draftId)
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isNotFound());
    }
}
