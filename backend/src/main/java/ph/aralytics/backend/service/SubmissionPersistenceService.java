package ph.aralytics.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.domain.Answer;
import ph.aralytics.backend.domain.Question;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.QuizStatus;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.BadRequestException;
import ph.aralytics.backend.exception.ConflictException;
import ph.aralytics.backend.exception.ForbiddenOperationException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.AnswerRepository;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.QuizRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.repository.UserRepository;

/**
 * Owns the single write transaction for a submission. Kept separate from
 * {@link SubmissionService} so the diagnostic call happens after the submission commits.
 */
@Service
public class SubmissionPersistenceService {

    public record Outcome(Long submissionId, BigDecimal score, int totalPoints, int earnedPoints) {
    }

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final AnswerRepository answerRepository;

    public SubmissionPersistenceService(QuizRepository quizRepository, UserRepository userRepository,
            EnrollmentRepository enrollmentRepository, SubmissionRepository submissionRepository,
            AnswerRepository answerRepository) {
        this.quizRepository = quizRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
        this.answerRepository = answerRepository;
    }

    @Transactional
    public Outcome create(Long studentId, Long quizId, Map<Long, String> selectedAnswers) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found."));
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Activity not found.");
        }
        if (!enrollmentRepository.existsByStudentIdAndClazzId(studentId, quiz.getClazz().getId())) {
            throw new ForbiddenOperationException("You are not enrolled in this activity's class.");
        }
        if (submissionRepository.existsByStudentIdAndQuizId(studentId, quizId)) {
            throw new ConflictException("This activity has already been submitted.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));

        Map<Long, Question> questionsById = quiz.getQuestions().stream()
                .collect(java.util.stream.Collectors.toMap(Question::getId, question -> question));
        for (Long questionId : selectedAnswers.keySet()) {
            if (!questionsById.containsKey(questionId)) {
                throw new BadRequestException("Question " + questionId + " does not belong to this activity.");
            }
        }

        int totalPoints = quiz.getQuestions().stream().mapToInt(Question::getPoints).sum();
        int earnedPoints = 0;
        for (Question question : quiz.getQuestions()) {
            String selected = selectedAnswers.get(question.getId());
            if (selected != null && selected.equalsIgnoreCase(question.getCorrectAnswer())) {
                earnedPoints += question.getPoints();
            }
        }
        BigDecimal score = totalPoints == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.valueOf(earnedPoints * 100.0 / totalPoints).setScale(2, RoundingMode.HALF_UP);

        Submission submission = new Submission();
        submission.setStudent(student);
        submission.setQuiz(quiz);
        submission.setScore(score);
        submission.setSubmittedAt(OffsetDateTime.now(ZoneOffset.UTC));
        submission = submissionRepository.save(submission);

        List<Answer> answers = new ArrayList<>();
        for (Question question : quiz.getQuestions()) {
            String selected = selectedAnswers.get(question.getId());
            Answer answer = new Answer();
            answer.setSubmission(submission);
            answer.setQuestion(question);
            answer.setSelectedOption(selected);
            answer.setCorrect(selected != null && selected.equalsIgnoreCase(question.getCorrectAnswer()));
            answers.add(answer);
        }
        answerRepository.saveAll(answers);

        return new Outcome(submission.getId(), score, totalPoints, earnedPoints);
    }
}
