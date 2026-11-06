package ph.aralytics.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.School;

public interface SchoolRepository extends JpaRepository<School, Long> {

    Optional<School> findByInstitutionCodeIgnoreCase(String institutionCode);
}
