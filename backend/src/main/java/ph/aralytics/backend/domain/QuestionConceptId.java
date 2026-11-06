package ph.aralytics.backend.domain;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class QuestionConceptId implements Serializable {

    @Column(name = "questionId")
    private Long questionId;

    @Column(name = "conceptId")
    private Long conceptId;

    public QuestionConceptId() {
    }

    public QuestionConceptId(Long questionId, Long conceptId) {
        this.questionId = questionId;
        this.conceptId = conceptId;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public Long getConceptId() {
        return conceptId;
    }

    public void setConceptId(Long conceptId) {
        this.conceptId = conceptId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof QuestionConceptId that)) {
            return false;
        }
        return Objects.equals(questionId, that.questionId) && Objects.equals(conceptId, that.conceptId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(questionId, conceptId);
    }
}
