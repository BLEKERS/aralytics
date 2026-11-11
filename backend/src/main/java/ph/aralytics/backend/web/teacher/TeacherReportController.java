package ph.aralytics.backend.web.teacher;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.ReportService;

@RestController
@RequestMapping("/api/teacher/reports")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, reports, and settings")
public class TeacherReportController {

    private final ReportService reportService;

    public TeacherReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/export-csv")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Download the class roster and scores as CSV")
    public ResponseEntity<byte[]> exportCsv(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String topic) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aralytics-roster.csv\"")
                .contentType(MediaType.parseMediaType("text/csv;charset=utf-8"))
                .body(reportService.exportCsv(principal.userId(), topic));
    }

    @GetMapping("/export-pdf")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Download a cohort analytics PDF")
    public ResponseEntity<byte[]> exportPdf(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String topic) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"aralytics-cohort.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(reportService.exportPdf(principal.userId(), section, topic));
    }
}
