package ph.aralytics.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Enrollment;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findAllByStudentId(Long studentId);

    List<Enrollment> findAllByClazzId(Long classId);

    List<Enrollment> findAllByClazzIdIn(Collection<Long> classIds);

    boolean existsByStudentIdAndClazzId(Long studentId, Long classId);

    boolean existsByStudentIdAndClazzIdIn(Long studentId, Collection<Long> classIds);

    long countByClazzId(Long classId);
}
