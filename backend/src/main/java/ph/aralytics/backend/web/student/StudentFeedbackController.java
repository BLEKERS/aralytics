package ph.aralytics.backend.web.student;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.FeedbackService;
import ph.aralytics.backend.web.dto.StudentDtos;

@RestController
@RequestMapping("/api/student/feedback")
@Tag(name = "Student", description = "Student portal: dashboard, activities, quiz taking, and progress")
public class StudentFeedbackController {

    private final FeedbackService feedbackService;

    public StudentFeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @GetMapping("/{submissionId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Read your diagnostic feedback",
            description = "Returns 202 with feedbackStatus=PENDING when generation has not completed yet.")
    public ResponseEntity<StudentDtos.FeedbackView> feedback(
            @AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable Long submissionId) {
        StudentDtos.FeedbackView view = feedbackService.getForStudent(principal.userId(), submissionId);
        return ResponseEntity.status("READY".equals(view.status()) ? 200 : 202).body(view);
    }

    @PostMapping("/{submissionId}/retry")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Re-trigger feedback generation for a PENDING submission")
    public ResponseEntity<StudentDtos.FeedbackView> retry(
            @AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable Long submissionId) {
        StudentDtos.FeedbackView view = feedbackService.retry(principal.userId(), submissionId);
        return ResponseEntity.status("READY".equals(view.status()) ? 200 : 202).body(view);
    }

    @PostMapping("/{submissionId}/practice-drill")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Practice drill generation (not implemented in the 40% milestone)")
    public void practiceDrill(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long submissionId) {
        throw new NotImplementedException(
                "Practice-drill generation is post-40% (PRD FR-AI-04 and section 6.4); no drill is generated.");
    }
}
