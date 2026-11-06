package ph.aralytics.backend.web.teacher;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import ph.aralytics.backend.exception.NotImplementedException;
import ph.aralytics.backend.security.AuthenticatedPrincipal;
import ph.aralytics.backend.service.QuizService;
import ph.aralytics.backend.web.dto.TeacherDtos;

@RestController
@RequestMapping("/api/teacher/activities")
@Tag(name = "Teacher", description = "Teacher portal: activities, dashboard, roster, and deferred settings")
public class TeacherActivityController {

    private final QuizService quizService;

    public TeacherActivityController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "List the teacher's activities", description = "status=DRAFT|PUBLISHED|CLOSED|all, topic=free text")
    public List<TeacherDtos.QuizSummary> list(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String topic) {
        return quizService.listForTeacher(principal.userId(), status, topic);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Create a DRAFT activity with questions, options, and concept tags")
    public TeacherDtos.QuizSummary create(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody TeacherDtos.CreateQuizRequest request) {
        return quizService.create(principal.userId(), request);
    }

    @PatchMapping("/{activityId}")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Update a DRAFT activity")
    public TeacherDtos.QuizSummary update(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long activityId,
            @Valid @RequestBody TeacherDtos.UpdateQuizRequest request) {
        return quizService.update(principal.userId(), activityId, request);
    }

    @PostMapping("/{activityId}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "Publish a DRAFT activity so enrolled students can see it")
    public TeacherDtos.PublishResponse publish(@AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable Long activityId) {
        return quizService.publish(principal.userId(), activityId);
    }

    @PostMapping("/ai-generate")
    @PreAuthorize("hasRole('TEACHER')")
    @Operation(summary = "AI-assisted activity generation (not implemented in the 40% milestone)")
    public void aiGenerate(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        throw new NotImplementedException(
                "AI activity generation is post-40% (PRD FR-CNT-02); the authoring endpoints accept "
                        + "teacher-supplied questions only.");
    }
}
