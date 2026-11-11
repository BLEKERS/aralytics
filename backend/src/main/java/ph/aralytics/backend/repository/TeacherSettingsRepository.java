package ph.aralytics.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.TeacherSettings;

public interface TeacherSettingsRepository extends JpaRepository<TeacherSettings, Long> {

    Optional<TeacherSettings> findByTeacherId(Long teacherId);
}
