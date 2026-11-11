package ph.aralytics.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.PilotInquiry;

public interface PilotInquiryRepository extends JpaRepository<PilotInquiry, Long> {
}
