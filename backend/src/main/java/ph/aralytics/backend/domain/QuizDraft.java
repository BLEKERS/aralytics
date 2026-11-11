package ph.aralytics.backend.domain;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Saved but unsubmitted answers for one student and quiz. Survives restarts so a
 * mid-quiz reload does not lose work.
 */
@Entity
@Table(name = "QUIZ_DRAFT")
public class QuizDraft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "quiz_id", nullable = false)
    private Long quizId;

    @Column(name = "answers_json", nullable = false, columnDefinition = "TEXT")
    private String answersJson;

    @Column(name = "last_saved_at", nullable = false)
    private OffsetDateTime lastSavedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public String getAnswersJson() {
        return answersJson;
    }

    public void setAnswersJson(String answersJson) {
        this.answersJson = answersJson;
    }

    public OffsetDateTime getLastSavedAt() {
        return lastSavedAt;
    }

    public void setLastSavedAt(OffsetDateTime lastSavedAt) {
        this.lastSavedAt = lastSavedAt;
    }
}
