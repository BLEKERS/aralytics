package ph.aralytics.backend.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import ph.aralytics.backend.domain.Feedback;
import ph.aralytics.backend.domain.FeedbackConcept;
import ph.aralytics.backend.domain.ProgressRecord;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.exception.ForbiddenOperationException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.FeedbackConceptRepository;
import ph.aralytics.backend.repository.FeedbackRepository;
import ph.aralytics.backend.repository.ProgressRecordRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.web.dto.StudentDtos;

@Service
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    private final SubmissionRepository submissionRepository;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackConceptRepository feedbackConceptRepository;
    private final ProgressRecordRepository progressRecordRepository;
    private final DiagnosticService diagnosticService;
    private final DtoMapper dtoMapper;
    private final TransactionTemplate transactionTemplate;

    public FeedbackService(SubmissionRepository submissionRepository, FeedbackRepository feedbackRepository,
            FeedbackConceptRepository feedbackConceptRepository,
            ProgressRecordRepository progressRecordRepository, DiagnosticService diagnosticService,
            DtoMapper dtoMapper, TransactionTemplate transactionTemplate) {
        this.submissionRepository = submissionRepository;
        this.feedbackRepository = feedbackRepository;
        this.feedbackConceptRepository = feedbackConceptRepository;
        this.progressRecordRepository = progressRecordRepository;
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
}
