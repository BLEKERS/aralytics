package ph.aralytics.backend.ai;

import java.math.BigDecimal;
import java.util.List;

/**
 * Adapter boundary for diagnostic feedback. The engine never computes the score: the
 * server scores deterministically against QUESTION.correctAnswer and passes the result in.
 */
public interface DiagnosticEngine {

    FeedbackResult generate(DiagnosticRequest request);

    record DiagnosticRequest(
            Long submissionId,
            Long studentId,
            String studentName,
            Long quizId,
            String quizTitle,
            BigDecimal scorePercentage,
            int earnedPoints,
            int totalPoints,
            List<QuestionDiagnostic> questions) {
    }

    record QuestionDiagnostic(
            Long questionId,
            String questionText,
            String selectedOption,
            String selectedOptionText,
            String correctOption,
            String correctOptionText,
            boolean correct,
            int points,
            List<String> concepts) {
    }

    record ConceptAssessment(String concept, int masteryLevel) {
    }

    record FeedbackResult(String content, List<ConceptAssessment> concepts) {
    }
}
