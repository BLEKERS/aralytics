package ph.aralytics.backend.service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.domain.Notification;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.NotificationRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.web.dto.CommonDtos;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;

    public NotificationService(NotificationRepository notificationRepository,
            EnrollmentRepository enrollmentRepository, SubmissionRepository submissionRepository) {
        this.notificationRepository = notificationRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public void assignmentPublished(Quiz quiz) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String due = quiz.getDueDate() == null ? "" : " Due " + quiz.getDueDate().toLocalDate() + ".";
        String message = "New activity \"" + quiz.getTitle() + "\" in " + quiz.getClazz().getName() + "." + due;
        List<Notification> notifications = enrollmentRepository.findAllByClazzId(quiz.getClazz().getId()).stream()
                .map(enrollment -> notification(enrollment.getStudent(), message, now))
                .toList();
        notificationRepository.saveAll(notifications);
    }

    @Transactional
    public void submissionReceived(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) {
            return;
        }
        User teacher = submission.getQuiz().getCreatedBy();
        if (teacher == null) {
            return;
        }
        String message = submission.getStudent().getFullName() + " submitted \""
                + submission.getQuiz().getTitle() + "\" with a score of "
                + submission.getScore().stripTrailingZeros().toPlainString() + "%.";
        notificationRepository.save(notification(teacher, message, OffsetDateTime.now(ZoneOffset.UTC)));
    }

    @Transactional(readOnly = true)
    public List<CommonDtos.NotificationView> listFor(Long userId) {
        return notificationRepository.findAllByUserIdOrderByScheduledAtDesc(userId).stream()
                .map(item -> new CommonDtos.NotificationView(
                        item.getId(),
                        item.getMessage(),
                        item.isRead(),
                        item.getScheduledAt(),
                        item.getSentAt()))
                .toList();
    }

    private Notification notification(User user, String message, OffsetDateTime now) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setScheduledAt(now);
        notification.setSentAt(now);
        return notification;
    }
}
