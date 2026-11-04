package ph.aralytics.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.ClassEntity;

public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    List<ClassEntity> findAllByTeacherIdOrderByIdAsc(Long teacherId);

    List<ClassEntity> findAllBySchoolIdOrderByIdAsc(Long schoolId);

    Optional<ClassEntity> findByIdAndTeacherId(Long id, Long teacherId);

    Optional<ClassEntity> findFirstBySchoolIdAndTeacherIsNullOrderByIdAsc(Long schoolId);
}
