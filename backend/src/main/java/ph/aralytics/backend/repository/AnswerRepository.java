package ph.aralytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Answer;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findBySubmissionIdOrderByIdAsc(Long submissionId);
}
