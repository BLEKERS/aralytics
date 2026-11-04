package ph.aralytics.backend.domain;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

/**
 * Additive join table: the ERD links concepts to feedback but not to questions. The
 * diagnostic engine needs per-question concept metadata, so this table was added and is
 * documented in backend/README.md.
 */
@Entity
@Table(name = "QUESTION_CONCEPT")
public class QuestionConcept {

    @EmbeddedId
    private QuestionConceptId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("questionId")
    @JoinColumn(name = "questionId")
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("conceptId")
    @JoinColumn(name = "conceptId")
    private Concept concept;

    public QuestionConceptId getId() {
        return id;
    }

    public void setId(QuestionConceptId id) {
        this.id = id;
    }

    public Question getQuestion() {
        return question;
    }

    public void setQuestion(Question question) {
        this.question = question;
    }

    public Concept getConcept() {
        return concept;
    }

    public void setConcept(Concept concept) {
        this.concept = concept;
    }
}
