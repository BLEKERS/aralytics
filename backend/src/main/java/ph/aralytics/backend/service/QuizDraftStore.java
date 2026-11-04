package ph.aralytics.backend.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Draft answers for in-progress quizzes. The ERD has no draft table, and creating a
 * SUBMISSION before the student submits would break "one submission per quiz" semantics.
 * This store is therefore intentionally in-memory for the 40% milestone; a durable draft
 * table is a post-40% item (documented in backend/README.md).
 */
@Component
public class QuizDraftStore {

    private final Map<String, Map<Long, String>> answers = new ConcurrentHashMap<>();
    private final Map<String, OffsetDateTime> savedAt = new ConcurrentHashMap<>();

    public OffsetDateTime save(Long studentId, Long quizId, Long questionId, String selectedOption) {
        String key = key(studentId, quizId);
        Map<Long, String> draft = answers.computeIfAbsent(key, ignored -> new ConcurrentHashMap<>());
        if (selectedOption == null || selectedOption.isBlank()) {
            draft.remove(questionId);
        } else {
            draft.put(questionId, selectedOption.trim());
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        savedAt.put(key, now);
        return now;
    }

    public Map<Long, String> get(Long studentId, Long quizId) {
        Map<Long, String> draft = answers.get(key(studentId, quizId));
        return draft == null ? Map.of() : Map.copyOf(draft);
    }

    public void clear(Long studentId, Long quizId) {
        String key = key(studentId, quizId);
        answers.remove(key);
        savedAt.remove(key);
    }

    private String key(Long studentId, Long quizId) {
        return studentId + ":" + quizId;
    }
}
