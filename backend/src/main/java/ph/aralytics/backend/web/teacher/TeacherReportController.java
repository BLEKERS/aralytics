package ph.aralytics.backend.web.teacher;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;

/**
 * Reports and exports are post-40% (PRD section 6.6). Every endpoint returns 501 rather
 * than fabricated analytics.
 */
@RestController
@RequestMapping("/api/teacher/reports")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, and deferred settings")
public class TeacherReportController {

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Cohort reports (not implemented in the 40% milestone)")
    public void reports() {
        throw new NotImplementedException(
                "Cohort reporting is post-40% (PRD section 6.6); the dashboard endpoint covers current KPIs.");
    }

    @GetMapping("/export-csv")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "CSV report export (not implemented in the 40% milestone)")
    public void exportCsv() {
        throw new NotImplementedException("CSV exports are post-40% (PRD FR-RPT-02).");
    }

    @GetMapping("/export-pdf")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "PDF report export (not implemented in the 40% milestone)")
    public void exportPdf() {
        throw new NotImplementedException("PDF exports are post-40% (PRD FR-RPT-02).");
    }
}
