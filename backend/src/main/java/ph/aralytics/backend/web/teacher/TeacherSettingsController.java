package ph.aralytics.backend.web.teacher;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.TeacherSettingsService;
import ph.aralytics.backend.web.dto.TeacherDtos;

@RestController
@RequestMapping("/api/teacher/settings")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, reports, and settings")
public class TeacherSettingsController {

    private final TeacherSettingsService settingsService;

    public TeacherSettingsController(TeacherSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Read the teacher's classroom settings (creates defaults on first read)")
    public TeacherDtos.TeacherSettingsResponse settings(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return settingsService.get(principal.userId());
    }

    @PutMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Update the intervention threshold and feedback tone")
    public TeacherDtos.TeacherSettingsResponse updateSettings(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody TeacherDtos.UpdateTeacherSettingsRequest request) {
        return settingsService.update(principal.userId(), request);
    }
}
