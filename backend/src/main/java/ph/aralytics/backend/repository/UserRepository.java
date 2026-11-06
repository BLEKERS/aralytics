package ph.aralytics.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmailIgnoreCaseOrUsername(String email, String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);
}
