package ph.aralytics.backend.ai;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Deterministic, offline diagnostic engine for the 40% milestone. It derives 1-3 concept
 * tags from question metadata and emits supportive English next-step guidance without
 * revealing the correct answers or code.
 */
@Component
@Profile("!ai")
public class MockDiagnosticEngine implements DiagnosticEngine {

    private static final String FALLBACK_CONCEPT = "Python fundamentals";
    private static final int MAX_CONCEPTS = 3;
    private static final int MASTERY_TARGET = 70;

    @Override
    public FeedbackResult generate(DiagnosticRequest request) {
        Map<String, int[]> conceptPoints = new LinkedHashMap<>();
        for (QuestionDiagnostic question : request.questions()) {
            for (String concept : question.concepts()) {
                if (concept == null || concept.isBlank()) {
                    continue;
                }
                int[] points = conceptPoints.computeIfAbsent(concept.trim(), key -> new int[2]);
                points[0] += question.correct() ? question.points() : 0;
                points[1] += question.points();
            }
        }

        List<ConceptAssessment> assessments = conceptPoints.entrySet().stream()
                .map(entry -> new ConceptAssessment(entry.getKey(), mastery(entry.getValue())))
                .sorted(Comparator.comparingInt(ConceptAssessment::masteryLevel))
                .limit(MAX_CONCEPTS)
                .toList();

        List<ConceptAssessment> concepts = new ArrayList<>(assessments);
        if (concepts.isEmpty()) {
            int fallbackMastery = request.scorePercentage() == null
                    ? 0
                    : request.scorePercentage().setScale(0, RoundingMode.HALF_UP).intValue();
            concepts.add(new ConceptAssessment(FALLBACK_CONCEPT, Math.max(0, Math.min(100, fallbackMastery))));
        }

        return new FeedbackResult(content(request, conceptPoints, concepts), concepts);
    }

    private int mastery(int[] points) {
        if (points[1] <= 0) {
            return 0;
        }
        return (int) Math.round((points[0] * 100.0) / points[1]);
    }

    private String content(DiagnosticRequest request, Map<String, int[]> conceptPoints,
            List<ConceptAssessment> selected) {
        BigDecimal score = request.scorePercentage() == null ? BigDecimal.ZERO : request.scorePercentage();
        String quizTitle = request.quizTitle() == null || request.quizTitle().isBlank()
                ? "this activity"
                : request.quizTitle();

        Set<String> strengths = conceptPoints.entrySet().stream()
                .filter(entry -> mastery(entry.getValue()) >= MASTERY_TARGET)
                .map(Map.Entry::getKey)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> needsPractice = selected.stream()
                .filter(concept -> concept.masteryLevel() < MASTERY_TARGET)
                .map(ConceptAssessment::concept)
                .toList();

        List<String> sentences = new ArrayList<>();
        if (score.doubleValue() >= 85) {
            sentences.add("You scored " + format(score) + "% on " + quizTitle
                    + ", which shows strong control of the ideas in this activity.");
        } else if (score.doubleValue() >= MASTERY_TARGET) {
            sentences.add("You scored " + format(score) + "% on " + quizTitle
                    + ", so the core ideas are starting to connect.");
        } else {
            sentences.add("You scored " + format(score) + "% on " + quizTitle
                    + ", and that gives us a useful place to focus next.");
        }

        if (!strengths.isEmpty()) {
            sentences.add("You handled " + join(strengths) + " well, and that strength is worth keeping.");
        } else {
            sentences.add("You stayed with the problem, and small, steady practice will make these ideas clearer.");
        }

        if (!needsPractice.isEmpty()) {
            sentences.add("When you review " + join(needsPractice)
                    + ", trace what happens step by step and explain the decision in your own words before choosing an answer.");
        } else {
            sentences.add("To keep improving, explain why each answer fits instead of relying on recognition alone.");
        }

        if (sentences.size() < 2) {
            sentences.add("Try one more short practice set and compare your reasoning with a classmate.");
        }
        return String.join(" ", sentences);
    }

    private String format(BigDecimal score) {
        return score.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String join(Iterable<String> concepts) {
        List<String> values = new ArrayList<>();
        concepts.forEach(values::add);
        if (values.size() == 1) {
            return values.get(0);
        }
        if (values.size() == 2) {
            return values.get(0) + " and " + values.get(1);
        }
        return String.join(", ", values.subList(0, values.size() - 1)) + ", and " + values.get(values.size() - 1);
    }
}
