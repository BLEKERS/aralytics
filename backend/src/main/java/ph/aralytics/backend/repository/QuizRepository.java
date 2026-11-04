package ph.aralytics.backend.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.QuizStatus;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByCreatedByIdOrderByIdDesc(Long teacherId);

    List<Quiz> findByCreatedByIdAndStatusOrderByIdDesc(Long teacherId, QuizStatus status);

    List<Quiz> findByClazzIdInAndStatusOrderByIdDesc(Collection<Long> classIds, QuizStatus status);

    List<Quiz> findByClazzIdAndStatusOrderByIdDesc(Long classId, QuizStatus status);

    long countByClazzIdInAndStatus(Collection<Long> classIds, QuizStatus status);
}
