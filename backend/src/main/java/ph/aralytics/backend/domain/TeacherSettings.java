package ph.aralytics.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "TEACHER_SETTINGS")
public class TeacherSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacherId", nullable = false, unique = true)
    private User teacher;

    @Column(nullable = false)
    private int interventionThreshold;

    @Column(nullable = false, length = 32)
    private String feedbackTone;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public int getInterventionThreshold() {
        return interventionThreshold;
    }

    public void setInterventionThreshold(int interventionThreshold) {
        this.interventionThreshold = interventionThreshold;
    }

    public String getFeedbackTone() {
        return feedbackTone;
    }

    public void setFeedbackTone(String feedbackTone) {
        this.feedbackTone = feedbackTone;
    }
}
