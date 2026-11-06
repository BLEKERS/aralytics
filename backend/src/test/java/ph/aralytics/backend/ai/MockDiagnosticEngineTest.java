package ph.aralytics.backend.ai;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import ph.aralytics.backend.ai.DiagnosticEngine.ConceptAssessment;
import ph.aralytics.backend.ai.DiagnosticEngine.DiagnosticRequest;
import ph.aralytics.backend.ai.DiagnosticEngine.FeedbackResult;
import ph.aralytics.backend.ai.DiagnosticEngine.QuestionDiagnostic;

import static org.assertj.core.api.Assertions.assertThat;

class MockDiagnosticEngineTest {

    private final MockDiagnosticEngine engine = new MockDiagnosticEngine();

    @Test
    void producesSupportiveFeedbackWithConceptAssessments() {
        FeedbackResult result = engine.generate(request(
                List.of(question(true, "Loops", "Option A text"), question(false, "Loops", "Secret correct text"))));

        assertThat(result.content()).isNotBlank();
        assertThat(result.concepts()).hasSize(1);
        ConceptAssessment loops = result.concepts().get(0);
        assertThat(loops.concept()).isEqualTo("Loops");
        assertThat(loops.masteryLevel()).isEqualTo(50);
    }

    @Test
    void feedbackUsesTwoToFourSentencesAndNeverLeaksAnswers() {
        FeedbackResult result = engine.generate(request(
                List.of(question(true, "Loops", "Option A text"), question(false, "Loops", "Secret correct text"))));

        long sentences = Arrays.stream(result.content().split("(?<=[.!?])\\s+"))
                .filter(sentence -> !sentence.isBlank())
                .count();
        assertThat(sentences).isBetween(2L, 4L);
        assertThat(result.content()).doesNotContain("Option A text");
        assertThat(result.content()).doesNotContain("Secret correct text");
    }

    @Test
    void capsConceptAssessmentsAtThree() {
        FeedbackResult result = engine.generate(request(List.of(
                question(true, "Variables", "x"),
                question(true, "Data Types", "x"),
                question(true, "Loops", "x"),
                question(true, "Functions", "x"))));

        assertThat(result.concepts()).hasSize(3);
    }

    @Test
    void fallsBackToPythonFundamentalsWhenQuestionsHaveNoConcepts() {
        FeedbackResult result = engine.generate(request(List.of(question(true, null, "x"))));

        assertThat(result.concepts()).hasSize(1);
        assertThat(result.concepts().get(0).concept()).isEqualTo("Python fundamentals");
    }

    private DiagnosticRequest request(List<QuestionDiagnostic> questions) {
        int total = questions.stream().mapToInt(QuestionDiagnostic::points).sum();
        int earned = questions.stream()
                .filter(QuestionDiagnostic::correct)
                .mapToInt(QuestionDiagnostic::points)
                .sum();
        BigDecimal score = total == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(earned * 100.0 / total);
        return new DiagnosticRequest(1L, 2L, "Miguel Reyes", 10L, "Debugging Loops",
                score, earned, total, questions);
    }

    private QuestionDiagnostic question(boolean correct, String concept, String correctOptionText) {
        return new QuestionDiagnostic(
                1L,
                "How many iterations does range(3) produce?",
                correct ? "A" : "B",
                correct ? "Three iterations" : "Two iterations",
                "A",
                correctOptionText,
                correct,
                1,
                concept == null ? List.of() : List.of(concept));
    }
}
