package ph.aralytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ph.aralytics.backend.domain.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByUserIdOrderByScheduledAtDesc(Long userId);
}
