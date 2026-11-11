package ph.aralytics.backend.web.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public final class TeacherDtos {

    private TeacherDtos() {
    }

    public record QuizQuestionRequest(
            @NotBlank(message = "Question text is required") String text,
            @NotEmpty(message = "Each question needs at least two options")
            @Valid List<StudentDtos.QuestionOptionRequest> options,
            @NotBlank(message = "correctAnswer is required") String correctAnswer,
            @Min(value = 1, message = "points must be at least 1") int points,
            @Valid List<@NotBlank(message = "Concept names cannot be blank") String> concepts) {
    }

    public record CreateQuizRequest(
            @NotBlank(message = "Title is required") String title,
            String description,
            @NotNull(message = "classId is required") Long classId,
            OffsetDateTime dueDate,
            @NotEmpty(message = "At least one question is required")
            @Valid List<QuizQuestionRequest> questions) {
    }

    public record UpdateQuizRequest(
            String title,
            String description,
            Long classId,
            OffsetDateTime dueDate,
            @Valid List<QuizQuestionRequest> questions) {
    }

    public record QuizSummary(
            Long id,
            String title,
            String description,
            Long classId,
            String className,
            String status,
            OffsetDateTime dueDate,
            int questionCount,
            int totalPoints,
            List<String> concepts) {
    }

    public record PublishResponse(
            Long id,
            String status,
            OffsetDateTime dueDate) {
    }

    public record StudentPerformance(
            Long studentId,
            String fullName,
            String email,
            BigDecimal averageScore,
            int completedCount,
            List<CommonDtos.ConceptMastery> mastery) {
    }

    public record TeacherDashboardResponse(
            String section,
            String concept,
            int studentCount,
            BigDecimal classAverage,
            BigDecimal completionRate,
            int belowThresholdCount,
            int threshold,
            int highMasteryCount,
            int practiceCount,
            int strugglingCount,
            int onTrackCount,
            int needsNudgeCount,
            int activeStudentCount,
            List<StudentPerformance> belowThreshold,
            List<CommonDtos.ConceptMastery> classConceptMastery) {
    }

    public record RosterItem(
            Long studentId,
            String fullName,
            String email,
            String username,
            BigDecimal averageScore,
            int completedCount,
            boolean belowThreshold,
            List<CommonDtos.ConceptMastery> mastery) {
    }

    public record StudentDiagnosticResponse(
            Long studentId,
            String fullName,
            BigDecimal averageScore,
            List<CommonDtos.ConceptMastery> mastery,
            List<StudentDtos.FeedbackView> feedback) {
    }

    public record TeacherSettingsResponse(
            int interventionThreshold,
            String feedbackTone) {
    }

    public record UpdateTeacherSettingsRequest(
            @NotNull(message = "interventionThreshold is required")
            @Min(value = 0, message = "interventionThreshold must be between 0 and 100")
            @Max(value = 100, message = "interventionThreshold must be between 0 and 100")
            Integer interventionThreshold,
            @NotBlank(message = "feedbackTone is required") String feedbackTone) {
    }
}
