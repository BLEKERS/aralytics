package ph.aralytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Question;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByQuizIdOrderByIdAsc(Long quizId);
}
