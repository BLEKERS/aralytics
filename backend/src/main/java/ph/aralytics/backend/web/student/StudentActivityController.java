package ph.aralytics.backend.web.student;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.DashboardService;
import ph.aralytics.backend.service.QuizService;
import ph.aralytics.backend.service.SubmissionService;
import ph.aralytics.backend.web.dto.StudentDtos;

@RestController
@RequestMapping("/api/student")
@Tag(name = "Student", description = "Student portal: dashboard, activities, quiz taking, and progress")
public class StudentActivityController {

    private final DashboardService dashboardService;
    private final QuizService quizService;
    private final SubmissionService submissionService;

    public StudentActivityController(DashboardService dashboardService, QuizService quizService,
            SubmissionService submissionService) {
        this.dashboardService = dashboardService;
        this.quizService = quizService;
        this.submissionService = submissionService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Student dashboard: assigned/completed counts, recent scores, streak, and concept mastery")
    public StudentDtos.DashboardResponse dashboard(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return dashboardService.studentDashboard(principal.userId());
    }

    @GetMapping("/progress")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Concept mastery for the authenticated student")
    public StudentDtos.ProgressResponse progress(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return dashboardService.studentProgress(principal.userId());
    }

    @GetMapping("/activities")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "List activities", description = "category=all|assigned|remedial|completed")
    public java.util.List<StudentDtos.ActivitySummary> activities(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(defaultValue = "all") String category) {
        return quizService.listForStudent(principal.userId(), category);
    }

    @GetMapping("/quiz/{quizId}")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Load a published quiz", description = "Correct answers are never included in the response.")
    public StudentDtos.QuizDetail quiz(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long quizId) {
        return quizService.getQuizForStudent(principal.userId(), quizId);
    }

    @PatchMapping("/quiz/{quizId}/answer")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Save a draft answer (idempotent)")
    public StudentDtos.SaveAnswerResponse saveAnswer(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long quizId, @Valid @RequestBody StudentDtos.SaveAnswerRequest request) {
        return quizService.saveAnswer(principal.userId(), quizId, request.questionId(), request.selectedOption());
    }

    @PostMapping("/quiz/{quizId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Submit a quiz",
            description = "Scores deterministically, persists answers, and synchronously generates feedback. "
                    + "Returns 200 when feedback is READY and 202 when it is PENDING (retry available).")
    public ResponseEntity<StudentDtos.SubmitResponse> submit(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long quizId,
            @Valid @RequestBody StudentDtos.SubmitRequest request) {
        StudentDtos.SubmitResponse response = submissionService.submit(principal.userId(), quizId, request);
        return ResponseEntity.status("READY".equals(response.feedbackStatus()) ? 200 : 202).body(response);
    }
}
