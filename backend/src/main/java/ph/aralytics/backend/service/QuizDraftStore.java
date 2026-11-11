package ph.aralytics.backend.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import ph.aralytics.backend.domain.QuizDraft;
import ph.aralytics.backend.repository.QuizDraftRepository;

/**
 * Draft answers for in-progress quizzes, persisted so a restart does not wipe a student's work.
 *
 * shortcut: last write wins per (student, quiz); two tabs saving at once can drop one answer.
 * Add @Version optimistic locking if that becomes possible in practice.
 */
@Component
public class QuizDraftStore {

    private static final Logger log = LoggerFactory.getLogger(QuizDraftStore.class);
    private static final TypeReference<Map<Long, String>> ANSWERS = new TypeReference<>() {
    };

    private final QuizDraftRepository repository;
    private final ObjectMapper objectMapper;

    public QuizDraftStore(QuizDraftRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public OffsetDateTime save(Long studentId, Long quizId, Long questionId, String selectedOption) {
        QuizDraft draft = repository.findByStudentIdAndQuizId(studentId, quizId).orElse(null);
        if (draft == null) {
            draft = new QuizDraft();
            draft.setStudentId(studentId);
            draft.setQuizId(quizId);
        }
        Map<Long, String> answers = read(draft.getAnswersJson());
        if (selectedOption == null || selectedOption.isBlank()) {
            answers.remove(questionId);
        } else {
            answers.put(questionId, selectedOption.trim());
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        draft.setAnswersJson(write(answers));
        draft.setLastSavedAt(now);
        repository.save(draft);
        return now;
    }

    @Transactional(readOnly = true)
    public Map<Long, String> get(Long studentId, Long quizId) {
        return repository.findByStudentIdAndQuizId(studentId, quizId)
                .map(draft -> Map.copyOf(read(draft.getAnswersJson())))
                .orElse(Map.of());
    }

    @Transactional
    public void clear(Long studentId, Long quizId) {
        repository.deleteByStudentIdAndQuizId(studentId, quizId);
    }

    private Map<Long, String> read(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(json, ANSWERS);
        } catch (JsonProcessingException exception) {
            log.warn("Ignoring malformed quiz draft JSON: {}", exception.getMessage());
            return new LinkedHashMap<>();
        }
    }

    private String write(Map<Long, String> answers) {
        try {
            return objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize quiz draft", exception);
        }
    }
}
