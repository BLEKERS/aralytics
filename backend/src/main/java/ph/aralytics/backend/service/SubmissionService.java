package ph.aralytics.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import ph.aralytics.backend.exception.BadRequestException;
import ph.aralytics.backend.exception.ConflictException;
import ph.aralytics.backend.web.dto.StudentDtos;

@Service
public class SubmissionService {

    private static final Logger log = LoggerFactory.getLogger(SubmissionService.class);

    private final SubmissionPersistenceService persistenceService;
    private final DiagnosticService diagnosticService;
    private final QuizDraftStore draftStore;
    private final NotificationService notificationService;

    public SubmissionService(SubmissionPersistenceService persistenceService,
            DiagnosticService diagnosticService, QuizDraftStore draftStore,
            NotificationService notificationService) {
        this.persistenceService = persistenceService;
        this.diagnosticService = diagnosticService;
        this.draftStore = draftStore;
        this.notificationService = notificationService;
    }

    public StudentDtos.SubmitResponse submit(Long studentId, Long quizId, StudentDtos.SubmitRequest request) {
        Map<Long, String> selectedAnswers = new HashMap<>();
        for (StudentDtos.SubmitAnswer answer : request.answers()) {
            if (selectedAnswers.containsKey(answer.questionId())) {
                throw new BadRequestException("Each question can appear only once in a submission.");
            }
            selectedAnswers.put(answer.questionId(), answer.selectedOption());
        }

        SubmissionPersistenceService.Outcome outcome;
        try {
            outcome = persistenceService.create(studentId, quizId, selectedAnswers);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("This activity has already been submitted.");
        }

        String feedbackStatus = "PENDING";
        StudentDtos.FeedbackView feedback = null;
        try {
            feedback = diagnosticService.generateAndPersist(outcome.submissionId());
            feedbackStatus = "READY";
        } catch (Exception exception) {
            // The submission is already committed. Absence of a FEEDBACK row is the
            // persisted PENDING state; the student can retry with the retry endpoint.
            log.warn("Diagnostic generation failed for submission {}: {}",
                    outcome.submissionId(), exception.getMessage());
        }
        draftStore.clear(studentId, quizId);

        try {
            notificationService.submissionReceived(outcome.submissionId());
        } catch (Exception exception) {
            // Notification delivery must never fail the student's submission.
            log.warn("Notification delivery failed for submission {}: {}",
                    outcome.submissionId(), exception.getMessage());
        }

        return new StudentDtos.SubmitResponse(
                outcome.submissionId(),
                outcome.score(),
                outcome.totalPoints(),
                feedbackStatus,
                feedback);
    }
}
