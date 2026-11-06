package ph.aralytics.backend.web.student;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;
import ph.aralytics.backend.security.AuthenticatedPrincipal;

/**
 * Student-facing routes that the frontend links to but that are deliberately deferred
 * beyond the 40% milestone. Returning 501 keeps the contract explicit.
 */
@RestController
@RequestMapping("/api/student")
@Tag(name = "Student", description = "Student portal: dashboard, activities, quiz taking, and progress")
public class StudentDeferredController {

    @PatchMapping("/preferences")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Update portal preferences (not implemented in the 40% milestone)")
    public void preferences(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "Student preference persistence is deferred beyond the 40% milestone.");
    }

    @PostMapping("/office-hours/book")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Book a teacher consultation slot (not implemented in the 40% milestone)")
    public void bookOfficeHours(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "Office-hours booking is deferred beyond the 40% milestone.");
    }

    @PostMapping("/quiz/{quizId}/flag")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Flag a question for review (not implemented in the 40% milestone)")
    public void flagQuestion(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long quizId) {
        throw new NotImplementedException(
                "Question flagging is deferred beyond the 40% milestone; draft answers are saved per question.");
    }

    @GetMapping("/feedback/{submissionId}/pdf")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Download a feedback PDF (not implemented in the 40% milestone)")
    public void feedbackPdf(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long submissionId) {
        throw new NotImplementedException(
                "PDF reports are deferred beyond the 40% milestone (PRD FR-RPT-02).");
    }

    @GetMapping("/progress/history")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Filterable feedback history (not implemented in the 40% milestone)")
    public void progressHistory(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "Searchable feedback history is deferred beyond the 40% milestone; GET /api/student/progress "
                        + "returns current concept mastery.");
    }

    @GetMapping("/progress/report/{reportId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Historical report detail (not implemented in the 40% milestone)")
    public void progressReport(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long reportId) {
        throw new NotImplementedException(
                "Historical report detail is deferred beyond the 40% milestone.");
    }

    @PostMapping("/progress/notes")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Save student notes (not implemented in the 40% milestone)")
    public void progressNotes(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "Student notes have no ERD table and are deferred beyond the 40% milestone.");
    }
}
