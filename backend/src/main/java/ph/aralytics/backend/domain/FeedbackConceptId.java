package ph.aralytics.backend.domain;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class FeedbackConceptId implements Serializable {

    @Column(name = "feedbackId")
    private Long feedbackId;

    @Column(name = "conceptId")
    private Long conceptId;

    public FeedbackConceptId() {
    }

    public FeedbackConceptId(Long feedbackId, Long conceptId) {
        this.feedbackId = feedbackId;
        this.conceptId = conceptId;
    }

    public Long getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(Long feedbackId) {
        this.feedbackId = feedbackId;
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
        if (!(o instanceof FeedbackConceptId that)) {
            return false;
        }
        return Objects.equals(feedbackId, that.feedbackId) && Objects.equals(conceptId, that.conceptId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(feedbackId, conceptId);
    }
}
