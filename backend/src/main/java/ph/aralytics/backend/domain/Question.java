package ph.aralytics.backend.domain;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Convert;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "QUESTION")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quizId", nullable = false)
    private Quiz quiz;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    /**
     * JSON array stored as TEXT for portability: [{ "key": "A", "text": "..." }, ...].
     */
    @Convert(converter = QuestionOptionListConverter.class)
    @Column(nullable = false, columnDefinition = "TEXT")
    private List<QuestionOption> options = new ArrayList<>();

    @Column(nullable = false, length = 16)
    private String correctAnswer;

    @Column(nullable = false)
    private int points;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuestionConcept> concepts = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Quiz getQuiz() {
        return quiz;
    }

    public void setQuiz(Quiz quiz) {
        this.quiz = quiz;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<QuestionOption> getOptions() {
        return options;
    }

    public void setOptions(List<QuestionOption> options) {
        this.options = options;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public List<QuestionConcept> getConcepts() {
        return concepts;
    }

    public void setConcepts(List<QuestionConcept> concepts) {
        this.concepts = concepts;
    }

    public void addConcept(Concept concept) {
        QuestionConcept link = new QuestionConcept();
        link.setId(new QuestionConceptId());
        link.setQuestion(this);
        link.setConcept(concept);
        concepts.add(link);
    }
}
