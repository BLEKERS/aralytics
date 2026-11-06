package ph.aralytics.backend.it;

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
class AuthorizationIT extends AbstractApiIT {

    @Test
    void unauthenticatedRequestReturnsProblemJson401() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/student/dashboard"))
                .andExpect(status().isUnauthorized())
                .andReturn();
        assertThat(result.getResponse().getContentType())
                .contains(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    }

    @Test
    void roleBoundariesAreEnforced() throws Exception {
        String studentToken = login("miguel@school.edu.ph", "student123");
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");

        mockMvc.perform(get("/api/teacher/dashboard")
                .header(HttpHeaders.AUTHORIZATION, bearer(studentToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/student/dashboard")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void teacherCannotEditAnotherTeachersActivity() throws Exception {
        String teacherAToken = login("maria.santos@university.edu.ph", "teacher123");
        JsonNode teacherB = activateAccount("TEACHER", uniqueEmail("teacher-b"),
                "Teacher B", "Teacher123");
        String teacherBToken = teacherB.path("token").asText();
        long teacherBClassId = teacherB.path("classes").get(0).path("id").asLong();

        long activityOwnedByB = createActivity(teacherBToken,
                "Owned by B " + java.util.UUID.randomUUID(), teacherBClassId, "Loops");

        mockMvc.perform(patch("/api/teacher/activities/" + activityOwnedByB)
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherAToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("title", "Hijacked"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/teacher/activities/" + activityOwnedByB + "/publish")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherAToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentCannotReadAnotherStudentsFeedback() throws Exception {
        String teacherToken = login("maria.santos@university.edu.ph", "teacher123");
        long activityId = Long.parseLong(createPublishedActivity(teacherToken,
                "Ownership " + java.util.UUID.randomUUID(), 1, "Loops"));

        JsonNode otherStudent = activateAccount("STUDENT", uniqueEmail("other-student"),
                "Other Student", "Student123");
        String otherStudentToken = otherStudent.path("token").asText();

        JsonNode quiz = body(mockMvc.perform(get("/api/student/quiz/" + activityId)
                .header(HttpHeaders.AUTHORIZATION, bearer(otherStudentToken)))
                .andExpect(status().isOk())
                .andReturn());
        long questionId = quiz.path("questions").get(0).path("id").asLong();

        JsonNode submission = body(mockMvc.perform(post(
                        "/api/student/quiz/" + activityId + "/submit")
                .header(HttpHeaders.AUTHORIZATION, bearer(otherStudentToken))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("answers", List.of(
                        Map.of("questionId", questionId, "selectedOption", "A"))))))
                .andExpect(status().isOk())
                .andReturn());

        String seedStudentToken = login("miguel@school.edu.ph", "student123");
        mockMvc.perform(get("/api/student/feedback/" + submission.path("submissionId").asLong())
                .header(HttpHeaders.AUTHORIZATION, bearer(seedStudentToken)))
                .andExpect(status().isForbidden());
    }

    @Test
    void teacherCannotViewStudentOutsideOwnClasses() throws Exception {
        JsonNode teacherB = activateAccount("TEACHER", uniqueEmail("teacher-c"),
                "Teacher C", "Teacher123");
        String teacherBToken = teacherB.path("token").asText();

        mockMvc.perform(get("/api/teacher/students/2")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherBToken)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/teacher/students/2/diagnostic")
                .header(HttpHeaders.AUTHORIZATION, bearer(teacherBToken)))
                .andExpect(status().isForbidden());
    }
}
