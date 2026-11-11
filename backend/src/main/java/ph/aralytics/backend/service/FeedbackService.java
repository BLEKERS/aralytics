package ph.aralytics.backend.service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import ph.aralytics.backend.domain.Feedback;
import ph.aralytics.backend.domain.FeedbackConcept;
import ph.aralytics.backend.domain.ProgressRecord;
import ph.aralytics.backend.domain.Question;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.QuizStatus;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.exception.ConflictException;
import ph.aralytics.backend.exception.ForbiddenOperationException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.FeedbackConceptRepository;
import ph.aralytics.backend.repository.FeedbackRepository;
import ph.aralytics.backend.repository.ProgressRecordRepository;
import ph.aralytics.backend.repository.QuizRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.StudentDtos;

@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    private final SubmissionRepository submissionRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackConceptRepository feedbackConceptRepository;
    private final ProgressRecordRepository progressRecordRepository;
    private final QuizRepository quizRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final DiagnosticService diagnosticService;
    private final DtoMapper dtoMapper;
    private final TransactionTemplate transactionTemplate;

    public FeedbackService(SubmissionRepository submissionRepository, FeedbackRepository feedbackRepository,
            FeedbackConceptRepository feedbackConceptRepository,
            ProgressRecordRepository progressRecordRepository, QuizRepository quizRepository,
            EnrollmentRepository enrollmentRepository, DiagnosticService diagnosticService,
            DtoMapper dtoMapper, TransactionTemplate transactionTemplate) {
        this.submissionRepository = submissionRepository;
        this.feedbackRepository = feedbackRepository;
        this.feedbackConceptRepository = feedbackConceptRepository;
        this.progressRecordRepository = progressRecordRepository;
        this.quizRepository = quizRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.diagnosticService = diagnosticService;
        this.dtoMapper = dtoMapper;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Reads feedback for the authenticated student only. The ownership check is repeated
     * here (service layer), not just in the controller.
     */
    @Transactional(readOnly = true)
    public StudentDtos.FeedbackView getForStudent(Long studentId, Long submissionId) {
        Submission submission = ownedSubmission(studentId, submissionId);
        return feedbackRepository.findBySubmissionId(submissionId)
                .map(feedback -> map(submission, feedback))
                .orElseGet(() -> pendingView(submission));
    }

    /**
     * If feedback is missing (PENDING), re-run the engine outside any read transaction.
     * Ownership and the pending view are loaded in a short transaction first.
     */
    public StudentDtos.FeedbackView retry(Long studentId, Long submissionId) {
        record RetryContext(boolean ready, StudentDtos.FeedbackView view) {
        }
        RetryContext context = transactionTemplate.execute(status -> {
            Submission submission = ownedSubmission(studentId, submissionId);
            Feedback feedback = feedbackRepository.findBySubmissionId(submissionId).orElse(null);
            return feedback == null
                    ? new RetryContext(false, pendingView(submission))
                    : new RetryContext(true, map(submission, feedback));
        });
        if (context == null || context.ready()) {
            return context == null ? null : context.view();
        }
        try {
            return diagnosticService.generateAndPersist(submissionId);
        } catch (Exception exception) {
            log.warn("Diagnostic retry failed for submission {}: {}", submissionId, exception.getMessage());
            return context.view();
        }
    }

    @Transactional(readOnly = true)
    public Submission ownedSubmission(Long studentId, Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found."));
        if (!submission.getStudent().getId().equals(studentId)) {
            throw new ForbiddenOperationException("You can only view your own feedback.");
        }
        return submission;
    }

    @Transactional(readOnly = true)
    public StudentDtos.FeedbackView map(Submission submission, Feedback feedback) {
        List<FeedbackConcept> links = feedbackConceptRepository.findAllByFeedback_Id(feedback.getId());
        List<ProgressRecord> progress = progressRecordRepository
                .findAllByStudentIdOrderByConceptNameAsc(submission.getStudent().getId());
        return dtoMapper.toFeedbackView(feedback, links, progress);
    }

    @Transactional(readOnly = true)
    public StudentDtos.FeedbackView pendingView(Submission submission) {
        Quiz quiz = submission.getQuiz();
        return new StudentDtos.FeedbackView(
                null,
                submission.getId(),
                quiz.getId(),
                quiz.getTitle(),
                "PENDING",
                null,
                null,
                List.of());
    }

    @Transactional(readOnly = true)
    public StudentDtos.FeedbackHistoryResponse history(Long studentId, String search) {
        List<Submission> submissions = submissionRepository.findByStudentIdOrderBySubmittedAtDesc(studentId);
        Map<Long, Feedback> feedbackBySubmission = feedbackRepository
                .findAllByStudentIdOrderByGeneratedAtDesc(studentId).stream()
                .collect(Collectors.toMap(item -> item.getSubmission().getId(), item -> item, (a, b) -> a));
        List<ProgressRecord> progress = progressRecordRepository.findAllByStudentIdOrderByConceptNameAsc(studentId);
        String needle = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);

        List<StudentDtos.FeedbackHistoryItem> items = submissions.stream()
                .filter(submission -> needle.isEmpty()
                        || submission.getQuiz().getTitle().toLowerCase(Locale.ROOT).contains(needle))
                .map(submission -> {
                    Feedback feedback = feedbackBySubmission.get(submission.getId());
                    List<CommonDtos.ConceptMastery> concepts = feedback == null
                            ? List.of()
                            : dtoMapper.toFeedbackView(feedback,
                                    feedbackConceptRepository.findAllByFeedback_Id(feedback.getId()), progress)
                                    .concepts();
                    return new StudentDtos.FeedbackHistoryItem(
                            submission.getId(),
                            submission.getQuiz().getId(),
                            submission.getQuiz().getTitle(),
                            submission.getScore(),
                            submission.getSubmittedAt(),
                            feedback == null ? "PENDING" : "READY",
                            concepts);
                })
                .toList();
        return new StudentDtos.FeedbackHistoryResponse(
                items, progress.stream().map(dtoMapper::toConceptMastery).toList());
    }

    /**
     * Builds a 3-question drill from real published questions tagged with the weak
     * concepts in this submission's feedback. Other activities are preferred so the
     * student practises something new; the submitted activity tops the list up.
     */
    @Transactional(readOnly = true)
    public StudentDtos.PracticeDrillResponse practiceDrill(Long studentId, Long submissionId) {
        Submission submission = ownedSubmission(studentId, submissionId);
        Feedback feedback = feedbackRepository.findBySubmissionId(submissionId)
                .orElseThrow(() -> new ConflictException(
                        "Feedback is still being generated. Retry in a moment to unlock the practice drill."));
        List<FeedbackConcept> links = feedbackConceptRepository.findAllByFeedback_Id(feedback.getId());
        Set<Long> conceptIds = links.stream()
                .map(link -> link.getConcept().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<String> conceptNames = links.stream()
                .map(link -> link.getConcept().getName())
                .distinct()
                .toList();
        if (conceptIds.isEmpty()) {
            return new StudentDtos.PracticeDrillResponse(submissionId, conceptNames, List.of());
        }

        List<Long> classIds = enrollmentRepository.findAllByStudentId(studentId).stream()
                .map(enrollment -> enrollment.getClazz().getId())
                .toList();
        if (classIds.isEmpty()) {
            return new StudentDtos.PracticeDrillResponse(submissionId, conceptNames, List.of());
        }
        List<Quiz> quizzes = quizRepository.findByClazzIdInAndStatusOrderByIdDesc(classIds, QuizStatus.PUBLISHED);
        List<Question> questions = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();
        addMatchingQuestions(quizzes.stream()
                .filter(quiz -> !quiz.getId().equals(submission.getQuiz().getId())).toList(),
                conceptIds, questions, seen);
        addMatchingQuestions(quizzes.stream()
                .filter(quiz -> quiz.getId().equals(submission.getQuiz().getId())).toList(),
                conceptIds, questions, seen);

        List<StudentDtos.PracticeDrillQuestion> drill = questions.stream()
                .map(question -> new StudentDtos.PracticeDrillQuestion(
                        question.getId(),
                        question.getText(),
                        question.getOptions().stream()
                                .map(option -> new StudentDtos.OptionView(option.key(), option.text()))
                                .toList(),
                        question.getPoints(),
                        question.getConcepts().stream().map(link -> link.getConcept().getName()).toList()))
                .toList();
        return new StudentDtos.PracticeDrillResponse(submissionId, conceptNames, drill);
    }

    private void addMatchingQuestions(List<Quiz> quizzes, Set<Long> conceptIds, List<Question> target,
            Set<Long> seen) {
        for (Quiz quiz : quizzes) {
            for (Question question : quiz.getQuestions()) {
                if (target.size() >= 3) {
                    return;
                }
                boolean matches = question.getConcepts().stream()
                        .anyMatch(link -> conceptIds.contains(link.getConcept().getId()));
                if (matches && seen.add(question.getId())) {
                    target.add(question);
                }
            }
        }
    }
}
