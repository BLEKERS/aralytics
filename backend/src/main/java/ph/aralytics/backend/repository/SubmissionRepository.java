package ph.aralytics.backend.repository;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByStudentIdAndQuizId(Long studentId, Long quizId);

    boolean existsByStudentIdAndQuizId(Long studentId, Long quizId);

    List<Submission> findByStudentIdOrderBySubmittedAtDesc(Long studentId);

    List<Submission> findTop5ByStudentIdOrderBySubmittedAtDesc(Long studentId);

    List<Submission> findByStudentIdAndSubmittedAtAfter(Long studentId, OffsetDateTime after);

    List<Submission> findByStudentIdIn(Collection<Long> studentIds);

    List<Submission> findByQuizIdIn(Collection<Long> quizIds);

    long countByStudentId(Long studentId);

    long countByQuizId(Long quizId);
}
