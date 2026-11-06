package ph.aralytics.backend.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class StudentDtos {

    private StudentDtos() {
    }

    public record OptionView(String key, String text) {
    }

    public record ActivitySummary(
            Long id,
            String title,
            String description,
            String topic,
            Long classId,
            String className,
            OffsetDateTime dueDate,
            String status,
            BigDecimal score,
            Long submissionId,
            int questionCount) {
    }

    public record QuizQuestion(
            Long id,
            String text,
            List<OptionView> options,
            int points,
            List<String> concepts,
            String savedAnswer) {
    }

    public record QuizDetail(
            Long id,
            String title,
            String description,
            Long classId,
            String className,
            OffsetDateTime dueDate,
            String status,
            int totalPoints,
            boolean submitted,
            Long submissionId,
            BigDecimal score,
            String feedbackStatus,
            List<QuizQuestion> questions) {
    }

    public record SaveAnswerRequest(
            @NotNull(message = "questionId is required") Long questionId,
            String selectedOption) {
    }

    public record SaveAnswerResponse(
            Long quizId,
            Long questionId,
            String selectedOption,
            OffsetDateTime savedAt) {
    }

    public record SubmitAnswer(
            @NotNull(message = "questionId is required") Long questionId,
            String selectedOption) {
    }

    public record SubmitRequest(
            @Valid @NotEmpty(message = "answers is required") List<SubmitAnswer> answers) {
    }

    public record SubmitResponse(
            Long submissionId,
            BigDecimal score,
            int totalPoints,
            String feedbackStatus,
            FeedbackView feedback) {
    }

    public record FeedbackView(
            Long feedbackId,
            Long submissionId,
            Long quizId,
            String quizTitle,
            String status,
            String content,
            OffsetDateTime generatedAt,
            List<CommonDtos.ConceptMastery> concepts) {
    }

    public record RecentScore(
            Long submissionId,
            Long quizId,
            String quizTitle,
            BigDecimal score,
            OffsetDateTime submittedAt) {
    }

    public record StreakSummary(
            int activeDaysLast7,
            List<LocalDate> activeDates) {
    }

    public record DashboardResponse(
            String studentName,
            int assignedCount,
            int completedCount,
            List<RecentScore> recentScores,
            StreakSummary streak,
            List<CommonDtos.ConceptMastery> conceptMastery) {
    }

    public record ProgressResponse(
            Long studentId,
            String fullName,
            List<CommonDtos.ConceptMastery> concepts) {
    }

    public record QuestionOptionRequest(
            @NotBlank(message = "Option key is required") @Size(max = 16) String key,
            @NotBlank(message = "Option text is required") String text) {
    }
}
