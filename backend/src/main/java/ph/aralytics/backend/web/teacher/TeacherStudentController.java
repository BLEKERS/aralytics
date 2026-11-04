package ph.aralytics.backend.web.teacher;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.RosterService;
import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.TeacherDtos;

@RestController
@RequestMapping("/api/teacher/students")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, and deferred settings")
public class TeacherStudentController {

    private final RosterService rosterService;

    public TeacherStudentController(RosterService rosterService) {
        this.rosterService = rosterService;
    }

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Paginated mastery roster for the teacher's own students",
            description = "search matches name/email/username; topic filters by concept; status=below|above.")
    public CommonDtos.PageResponse<TeacherDtos.RosterItem> roster(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return rosterService.roster(principal.userId(), search, topic, status, page, size);
    }

    @GetMapping("/{studentId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Student deep-dive: scores, concept mastery, and feedback delivered to the student")
    public TeacherDtos.StudentDiagnosticResponse student(
            @AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable Long studentId) {
        return rosterService.studentDiagnostic(principal.userId(), studentId);
    }

    @GetMapping("/{studentId}/diagnostic")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Diagnostic drill-down for a student in one of the teacher's classes")
    public TeacherDtos.StudentDiagnosticResponse diagnostic(
            @AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable Long studentId) {
        return rosterService.studentDiagnostic(principal.userId(), studentId);
    }

    @PostMapping("/{studentId}/nudge")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Send a nudge notification (not implemented in the 40% milestone)")
    public void nudge(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable Long studentId) {
        throw new NotImplementedException(
                "Notification delivery is out of scope for the 40% milestone (PRD FR-NOT-01/02).");
    }

    @PostMapping("/batch-nudge")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Send batch nudges (not implemented in the 40% milestone)")
    public void batchNudge(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "Notification delivery is out of scope for the 40% milestone (PRD FR-NOT-01/02).");
    }

    @PutMapping("/{studentId}/private-log")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Append a private teacher note (not implemented in the 40% milestone)")
    public void privateLog(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable Long studentId) {
        throw new NotImplementedException(
                "Teacher private notes have no ERD table and are deferred beyond the 40% milestone.");
    }
}
