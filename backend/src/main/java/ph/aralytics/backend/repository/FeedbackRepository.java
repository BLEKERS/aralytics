package ph.aralytics.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Feedback;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Optional<Feedback> findBySubmissionId(Long submissionId);

    Optional<Feedback> findBySubmissionIdAndStudentId(Long submissionId, Long studentId);

    List<Feedback> findAllByStudentIdOrderByGeneratedAtDesc(Long studentId);
}
