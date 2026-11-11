package ph.aralytics.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.QuizDraft;

public interface QuizDraftRepository extends JpaRepository<QuizDraft, Long> {

    Optional<QuizDraft> findByStudentIdAndQuizId(Long studentId, Long quizId);

    void deleteByStudentIdAndQuizId(Long studentId, Long quizId);
}
