package ph.aralytics.backend.web.teacher;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.RosterService;
import ph.aralytics.backend.web.dto.TeacherDtos;

@RestController
@RequestMapping("/api/teacher")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, and deferred settings")
public class TeacherDashboardController {

    private final RosterService rosterService;

    public TeacherDashboardController(RosterService rosterService) {
        this.rosterService = rosterService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Cohort KPIs, students below the intervention threshold, and class concept mastery",
            description = "section and concept are optional filters over the teacher's own classes.")
    public TeacherDtos.TeacherDashboardResponse dashboard(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String concept) {
        return rosterService.teacherDashboard(principal.userId(), section, concept);
    }

    @PostMapping("/diagnostics/run")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Batch cohort diagnostics (not implemented in the 40% milestone)")
    public void runDiagnostics(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "Teacher-triggered batch diagnostics are post-40%; feedback is generated on submission and "
                        + "can be retried by the student.");
    }

    @GetMapping("/dashboard/export-csv")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "CSV dashboard export (not implemented in the 40% milestone)")
    public void exportDashboardCsv(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "CSV/PDF reporting and exports are deferred beyond the 40% milestone (PRD FR-RPT-02).");
    }
}
