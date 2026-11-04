package ph.aralytics.backend.web.teacher;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;

/**
 * Settings persistence is explicitly out of scope for the 40% milestone: the ERD has no
 * settings table and the product has not decided which settings are teacher- vs
 * school-controlled (PRD open question 5). The endpoints return 501 so the frontend can
 * distinguish "not built yet" from a silent failure.
 */
@RestController
@RequestMapping("/api/teacher/settings")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, and deferred settings")
public class TeacherSettingsController {

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Read classroom settings (not implemented in the 40% milestone)")
    public void settings() {
        throw new NotImplementedException(
                "Settings persistence is deferred beyond the 40% milestone; no settings table exists yet.");
    }

    @PutMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Update classroom settings (not implemented in the 40% milestone)")
    public void updateSettings() {
        throw new NotImplementedException(
                "Settings persistence is deferred beyond the 40% milestone; no settings table exists yet.");
    }
}
