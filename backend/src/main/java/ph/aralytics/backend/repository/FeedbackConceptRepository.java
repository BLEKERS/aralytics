package ph.aralytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.FeedbackConcept;
import ph.aralytics.backend.domain.FeedbackConceptId;

public interface FeedbackConceptRepository extends JpaRepository<FeedbackConcept, FeedbackConceptId> {

    List<FeedbackConcept> findAllByFeedback_Id(Long feedbackId);
}
