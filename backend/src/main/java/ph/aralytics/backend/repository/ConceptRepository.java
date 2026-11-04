package ph.aralytics.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Concept;

public interface ConceptRepository extends JpaRepository<Concept, Long> {

    Optional<Concept> findByNameIgnoreCase(String name);
}
