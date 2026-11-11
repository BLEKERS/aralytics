package ph.aralytics.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * A partner school. {@code institutionCode} is an additive column: the activation flow
 * needs a stable institution identifier, which the ERD does not model explicitly
 * (see backend/README.md, "Design decisions").
 */
@Entity
@Table(name = "SCHOOL")
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 160)
    private String contactEmail;

    @Column(nullable = false, unique = true, length = 64)
    private String institutionCode;

    @Column(length = 64)
    private String studentActivationKeyHash;

    @Column(length = 64)
    private String teacherActivationKeyHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscriptionId")
    private Subscription subscription;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getInstitutionCode() {
        return institutionCode;
    }

    public void setInstitutionCode(String institutionCode) {
        this.institutionCode = institutionCode;
    }

    public String getStudentActivationKeyHash() {
        return studentActivationKeyHash;
    }

    public void setStudentActivationKeyHash(String studentActivationKeyHash) {
        this.studentActivationKeyHash = studentActivationKeyHash;
    }

    public String getTeacherActivationKeyHash() {
        return teacherActivationKeyHash;
    }

    public void setTeacherActivationKeyHash(String teacherActivationKeyHash) {
        this.teacherActivationKeyHash = teacherActivationKeyHash;
    }

    public Subscription getSubscription() {
        return subscription;
    }

    public void setSubscription(Subscription subscription) {
        this.subscription = subscription;
    }
}
