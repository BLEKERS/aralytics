package ph.aralytics.backend.service;

import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.config.AralyticsProperties;
import ph.aralytics.backend.domain.TeacherSettings;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.BadRequestException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.TeacherSettingsRepository;
import ph.aralytics.backend.repository.UserRepository;
import ph.aralytics.backend.web.dto.TeacherDtos;

@Service
public class TeacherSettingsService {

    private static final Set<String> TONES =
            Set.of("FORMAL", "CONVERSATIONAL", "SOCRATIC", "CONCISE", "CHALLENGING");

    private final TeacherSettingsRepository settingsRepository;
    private final UserRepository userRepository;
    private final AralyticsProperties properties;

    public TeacherSettingsService(TeacherSettingsRepository settingsRepository, UserRepository userRepository,
            AralyticsProperties properties) {
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
        this.properties = properties;
    }

    /** Read path used by the dashboard/roster; never writes inside a read-only transaction. */
    @Transactional(readOnly = true)
    public int thresholdFor(Long teacherId) {
        return settingsRepository.findByTeacherId(teacherId)
                .map(TeacherSettings::getInterventionThreshold)
                .orElse(properties.intervention().threshold());
    }

    @Transactional
    public TeacherDtos.TeacherSettingsResponse get(Long teacherId) {
        TeacherSettings settings = settingsRepository.findByTeacherId(teacherId)
                .orElseGet(() -> createDefault(teacherId));
        return toResponse(settings);
    }

    @Transactional
    public TeacherDtos.TeacherSettingsResponse update(Long teacherId, TeacherDtos.UpdateTeacherSettingsRequest request) {
        String tone = request.feedbackTone().trim().toUpperCase(Locale.ROOT);
        if (!TONES.contains(tone)) {
            throw new BadRequestException("feedbackTone must be one of " + String.join(", ", TONES) + ".");
        }
        TeacherSettings settings = settingsRepository.findByTeacherId(teacherId)
                .orElseGet(() -> createDefault(teacherId));
        settings.setInterventionThreshold(request.interventionThreshold());
        settings.setFeedbackTone(tone);
        return toResponse(settingsRepository.save(settings));
    }

    private TeacherSettings createDefault(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found."));
        TeacherSettings settings = new TeacherSettings();
        settings.setTeacher(teacher);
        settings.setInterventionThreshold(properties.intervention().threshold());
        settings.setFeedbackTone("FORMAL");
        return settingsRepository.save(settings);
    }

    private TeacherDtos.TeacherSettingsResponse toResponse(TeacherSettings settings) {
        return new TeacherDtos.TeacherSettingsResponse(
                settings.getInterventionThreshold(), settings.getFeedbackTone());
    }
}
