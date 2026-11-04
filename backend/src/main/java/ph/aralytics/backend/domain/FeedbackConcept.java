package ph.aralytics.backend.domain;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "FEEDBACK_CONCEPT")
public class FeedbackConcept {

    @EmbeddedId
    private FeedbackConceptId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("feedbackId")
    @JoinColumn(name = "feedbackId")
    private Feedback feedback;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("conceptId")
    @JoinColumn(name = "conceptId")
    private Concept concept;

    public FeedbackConceptId getId() {
        return id;
    }

    public void setId(FeedbackConceptId id) {
        this.id = id;
    }

    public Feedback getFeedback() {
        return feedback;
    }

    public void setFeedback(Feedback feedback) {
        this.feedback = feedback;
    }

    public Concept getConcept() {
        return concept;
    }

    public void setConcept(Concept concept) {
        this.concept = concept;
    }
}
