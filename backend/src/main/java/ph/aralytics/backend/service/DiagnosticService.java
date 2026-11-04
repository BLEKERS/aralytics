package ph.aralytics.backend.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import ph.aralytics.backend.ai.DiagnosticEngine;
import ph.aralytics.backend.ai.DiagnosticEngine.ConceptAssessment;
import ph.aralytics.backend.ai.DiagnosticEngine.DiagnosticRequest;
import ph.aralytics.backend.ai.DiagnosticEngine.FeedbackResult;
import ph.aralytics.backend.ai.DiagnosticEngine.QuestionDiagnostic;
import ph.aralytics.backend.domain.Answer;
import ph.aralytics.backend.domain.Concept;
import ph.aralytics.backend.domain.Feedback;
import ph.aralytics.backend.domain.FeedbackConcept;
import ph.aralytics.backend.domain.FeedbackConceptId;
import ph.aralytics.backend.domain.ProgressRecord;
import ph.aralytics.backend.domain.Question;
import ph.aralytics.backend.domain.QuestionOption;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.AnswerRepository;
import ph.aralytics.backend.repository.ConceptRepository;
import ph.aralytics.backend.repository.FeedbackConceptRepository;
import ph.aralytics.backend.repository.FeedbackRepository;
import ph.aralytics.backend.repository.ProgressRecordRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.web.dto.StudentDtos;

/**
 * Builds the diagnostic request (read transaction), calls the engine outside a database
 * transaction, then persists feedback, feedback-concept links, and progress records in a
 * second transaction. This keeps a slow/failed model call from holding a DB connection.
 */
@Service
public class DiagnosticService {

    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackConceptRepository feedbackConceptRepository;
    private final ProgressRecordRepository progressRecordRepository;
    private final ConceptRepository conceptRepository;
    private final DiagnosticEngine diagnosticEngine;
    private final DtoMapper dtoMapper;
    private final TransactionTemplate transactionTemplate;

    public DiagnosticService(SubmissionRepository submissionRepository, AnswerRepository answerRepository,
            FeedbackRepository feedbackRepository, FeedbackConceptRepository feedbackConceptRepository,
            ProgressRecordRepository progressRecordRepository, ConceptRepository conceptRepository,
            DiagnosticEngine diagnosticEngine, DtoMapper dtoMapper, TransactionTemplate transactionTemplate) {
        this.submissionRepository = submissionRepository;
        this.answerRepository = answerRepository;
        this.feedbackRepository = feedbackRepository;
        this.feedbackConceptRepository = feedbackConceptRepository;
        this.progressRecordRepository = progressRecordRepository;
        this.conceptRepository = conceptRepository;
        this.diagnosticEngine = diagnosticEngine;
        this.dtoMapper = dtoMapper;
        this.transactionTemplate = transactionTemplate;
    }

    public StudentDtos.FeedbackView generateAndPersist(Long submissionId) {
        DiagnosticRequest request = transactionTemplate.execute(status -> buildRequest(submissionId));
        FeedbackResult result = diagnosticEngine.generate(request);
        if (result == null || result.content() == null || result.content().isBlank()) {
            throw new IllegalStateException("Diagnostic engine returned an empty result.");
        }
        return transactionTemplate.execute(status -> persist(submissionId, result));
    }

    private DiagnosticRequest buildRequest(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found."));
        Quiz quiz = submission.getQuiz();
        Map<Long, Answer> answersByQuestion = new HashMap<>();
        for (Answer answer : answerRepository.findBySubmissionIdOrderByIdAsc(submissionId)) {
            answersByQuestion.put(answer.getQuestion().getId(), answer);
        }

        List<QuestionDiagnostic> questions = new ArrayList<>();
        int totalPoints = 0;
        int earnedPoints = 0;
        for (Question question : quiz.getQuestions()) {
            Answer answer = answersByQuestion.get(question.getId());
            String selected = answer == null ? null : answer.getSelectedOption();
            String selectedText = optionText(question, selected);
            String correctText = optionText(question, question.getCorrectAnswer());
            boolean correct = selected != null && selected.equalsIgnoreCase(question.getCorrectAnswer());
            totalPoints += question.getPoints();
            if (correct) {
                earnedPoints += question.getPoints();
            }

            Set<String> concepts = new LinkedHashSet<>();
            question.getConcepts().forEach(link -> concepts.add(link.getConcept().getName()));
            questions.add(new QuestionDiagnostic(
                    question.getId(),
                    question.getText(),
                    selected,
                    selectedText,
                    question.getCorrectAnswer(),
                    correctText,
                    correct,
                    question.getPoints(),
                    List.copyOf(concepts)));
        }

        return new DiagnosticRequest(
                submission.getId(),
                submission.getStudent().getId(),
                submission.getStudent().getFullName(),
                quiz.getId(),
                quiz.getTitle(),
                submission.getScore(),
                earnedPoints,
                totalPoints,
                questions);
    }

    private StudentDtos.FeedbackView persist(Long submissionId, FeedbackResult result) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found."));
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Feedback feedback = feedbackRepository.findBySubmissionId(submissionId).orElseGet(Feedback::new);
        if (feedback.getId() != null) {
            feedbackConceptRepository.deleteAll(
                    feedbackConceptRepository.findAllByFeedback_Id(feedback.getId()));
        }
        feedback.setSubmission(submission);
        feedback.setStudent(submission.getStudent());
        feedback.setContent(result.content());
        feedback.setGeneratedAt(now);
        feedback = feedbackRepository.save(feedback);

        List<FeedbackConcept> links = new ArrayList<>();
        for (ConceptAssessment assessment : result.concepts()) {
            if (assessment.concept() == null || assessment.concept().isBlank()) {
                continue;
            }
            Concept concept = upsertConcept(assessment.concept());
            FeedbackConcept link = new FeedbackConcept();
            link.setId(new FeedbackConceptId());
            link.setFeedback(feedback);
            link.setConcept(concept);
            links.add(feedbackConceptRepository.save(link));

            ProgressRecord record = progressRecordRepository
                    .findByStudentIdAndConceptId(submission.getStudent().getId(), concept.getId())
                    .orElseGet(ProgressRecord::new);
            record.setStudent(submission.getStudent());
            record.setConcept(concept);
            record.setMasteryLevel(Math.max(0, Math.min(100, assessment.masteryLevel())));
            record.setLastUpdated(now);
            progressRecordRepository.save(record);
        }

        List<ProgressRecord> progress = progressRecordRepository
                .findAllByStudentIdOrderByConceptNameAsc(submission.getStudent().getId());
        return dtoMapper.toFeedbackView(feedback, links, progress);
    }

    private Concept upsertConcept(String rawName) {
        String name = rawName.trim();
        return conceptRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Concept concept = new Concept();
            concept.setName(name);
            concept.setDescription("Concept tag applied by the diagnostic engine.");
            return conceptRepository.save(concept);
        });
    }

    private String optionText(Question question, String key) {
        if (key == null) {
            return null;
        }
        return question.getOptions().stream()
                .filter(option -> option.key().equalsIgnoreCase(key))
                .map(QuestionOption::text)
                .findFirst()
                .orElse(null);
    }
}
