package ph.aralytics.backend.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.ProgressRecord;

public interface ProgressRecordRepository extends JpaRepository<ProgressRecord, Long> {

    List<ProgressRecord> findAllByStudentIdOrderByConceptNameAsc(Long studentId);

    List<ProgressRecord> findAllByStudentIdIn(Collection<Long> studentIds);

    Optional<ProgressRecord> findByStudentIdAndConceptId(Long studentId, Long conceptId);
}
