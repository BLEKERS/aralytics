package ph.aralytics.backend.web;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.NotificationService;
import ph.aralytics.backend.web.dto.CommonDtos;

@RestController
@Tag(name = "Notifications", description = "In-app notifications for students and teachers")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/api/student/notifications")
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Notifications for the authenticated student, newest first")
    public List<CommonDtos.NotificationView> studentNotifications(
            @AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return notificationService.listFor(principal.userId());
    }

    @GetMapping("/api/teacher/notifications")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Notifications for the authenticated teacher, newest first")
    public List<CommonDtos.NotificationView> teacherNotifications(
            @AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return notificationService.listFor(principal.userId());
    }
}
