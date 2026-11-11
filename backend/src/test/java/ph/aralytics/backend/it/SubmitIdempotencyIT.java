package ph.aralytics.backend.it;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MvcResult;

import com.fasterxml.jackson.databind.JsonNode;

import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.repository.QuizRepository;
import ph.aralytics.backend.support.AbstractApiIT;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class SubmitIdempotencyIT extends AbstractApiIT {

    @Autowired
    private QuizRepository quizRepository;

    @Test
    void secondSubmissionReturnsConflict() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        String studentToken = login("miguel@school.edu.ph", "student123");
        long activityId = Long.parseLong(createPublishedActivity(teacherToken,
                "Idempotency " + java.util.UUID.randomUUID(), 1, "Loops"));
        long questionId = questionIdOf(studentToken, activityId);

        String payload = json(Map.of("answers", List.of(
                Map.of("questionId", questionId, "selectedOption", "A"))));

        MvcResult first = mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(body(first).path("score").decimalValue()).isEqualByComparingTo("100.00");

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    void duplicateQuestionEntriesAreRejected() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        String studentToken = login("miguel@school.edu.ph", "student123");
        long activityId = Long.parseLong(createPublishedActivity(teacherToken,
                "Duplicate answers " + java.util.UUID.randomUUID(), 1, "Loops"));
        long questionId = questionIdOf(studentToken, activityId);

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", questionId, "selectedOption", "A"),
                        Map.of("questionId", questionId, "selectedOption", "B"))))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void emptyAndForeignAnswerSetsAreRejected() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        String studentToken = login("miguel@school.edu.ph", "student123");
        long activityId = Long.parseLong(createPublishedActivity(teacherToken,
                "Validation " + java.util.UUID.randomUUID(), 1, "Loops"));

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of()))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", 999999, "selectedOption", "A"))))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unpublishedActivityCannotBeSubmitted() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        String studentToken = login("miguel@school.edu.ph", "student123");
        long draftId = createActivity(teacherToken, "Draft submit " + java.util.UUID.randomUUID(), 1, "Loops");

        mockMvc.perform(post("/api/student/quiz/" + draftId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", 1, "selectedOption", "A"))))))
                .andExpect(status().isNotFound());
    }

    @Test
    void studentOutsideClassCannotSubmit() throws Exception {
        String studentToken = login("miguel@school.edu.ph", "student123");
        JsonNode teacherB = activateAccount("TEACHER", uniqueEmail("teacher-isolation"),
                "Isolated Teacher", "Teacher123");
        String teacherBToken = teacherB.path("token").asText();
        long teacherBClassId = teacherB.path("classes").get(0).path("id").asLong();
        long activityId = Long.parseLong(createPublishedActivity(teacherBToken,
                "Other class " + java.util.UUID.randomUUID(), teacherBClassId, "Loops"));

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", 1, "selectedOption", "A"))))))
                .andExpect(status().isForbidden());
    }

    @Test
    void submissionAfterDueDateIsRejected() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        String studentToken = login("miguel@school.edu.ph", "student123");
        long activityId = Long.parseLong(createPublishedActivity(teacherToken,
                "Closed " + java.util.UUID.randomUUID(), 1, "Loops"));
        long questionId = questionIdOf(studentToken, activityId);

        Quiz quiz = quizRepository.findById(activityId).orElseThrow();
        quiz.setDueDate(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1));
        quizRepository.saveAndFlush(quiz);

        mockMvc.perform(post("/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", questionId, "selectedOption", "A"))))))
                .andExpect(status().isBadRequest());
    }

    private long questionIdOf(String studentToken, long activityId) throws Exception {
        JsonNode quiz = body(mockMvc.perform(get("/api/student/quiz/" + activityId)
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isOk())
                .andReturn());
        return quiz.path("questions").get(0).path("id").asLong();
    }
}
