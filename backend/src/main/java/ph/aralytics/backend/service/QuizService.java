package ph.aralytics.backend.service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.config.AralyticsProperties;
import ph.aralytics.backend.domain.ClassEntity;
import ph.aralytics.backend.domain.Concept;
import ph.aralytics.backend.domain.Enrollment;
import ph.aralytics.backend.domain.ProgressRecord;
import ph.aralytics.backend.domain.Question;
import ph.aralytics.backend.domain.QuestionOption;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.QuizStatus;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.BadRequestException;
import ph.aralytics.backend.exception.ConflictException;
import ph.aralytics.backend.exception.ForbiddenOperationException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.ClassRepository;
import ph.aralytics.backend.repository.ConceptRepository;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.FeedbackRepository;
import ph.aralytics.backend.repository.ProgressRecordRepository;
import ph.aralytics.backend.repository.QuizRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.repository.UserRepository;
import ph.aralytics.backend.web.dto.StudentDtos;
import ph.aralytics.backend.web.dto.TeacherDtos;

@Service
public class QuizService {

    private final QuizRepository quizRepository;
    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ConceptRepository conceptRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final ProgressRecordRepository progressRecordRepository;
    private final FeedbackRepository feedbackRepository;
    private final QuizDraftStore draftStore;
    private final AralyticsProperties properties;

    public QuizService(QuizRepository quizRepository, ClassRepository classRepository,
            UserRepository userRepository, ConceptRepository conceptRepository,
            EnrollmentRepository enrollmentRepository, SubmissionRepository submissionRepository,
            ProgressRecordRepository progressRecordRepository, FeedbackRepository feedbackRepository,
            QuizDraftStore draftStore, AralyticsProperties properties) {
        this.quizRepository = quizRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.conceptRepository = conceptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.submissionRepository = submissionRepository;
        this.progressRecordRepository = progressRecordRepository;
        this.feedbackRepository = feedbackRepository;
        this.draftStore = draftStore;
        this.properties = properties;
    }

    // ---------------------------------------------------------------- teacher

    @Transactional(readOnly = true)
    public List<TeacherDtos.QuizSummary> listForTeacher(Long teacherId, String status, String topic) {
        List<Quiz> quizzes;
        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            quizzes = quizRepository.findByCreatedByIdAndStatusOrderByIdDesc(teacherId, parseStatus(status));
        } else {
            quizzes = quizRepository.findByCreatedByIdOrderByIdDesc(teacherId);
        }
        return quizzes.stream()
                .filter(quiz -> topic == null || topic.isBlank() || matchesTopic(quiz, topic))
                .map(this::toQuizSummary)
                .toList();
    }

    @Transactional
    public TeacherDtos.QuizSummary create(Long teacherId, TeacherDtos.CreateQuizRequest request) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found."));
        ClassEntity clazz = ownedClass(teacherId, request.classId());

        Quiz quiz = new Quiz();
        quiz.setTitle(request.title().trim());
        quiz.setDescription(request.description());
        quiz.setClazz(clazz);
        quiz.setCreatedBy(teacher);
        quiz.setDueDate(request.dueDate());
        quiz.setStatus(QuizStatus.DRAFT);
        replaceQuestions(quiz, request.questions());
        return toQuizSummary(quizRepository.save(quiz));
    }

    @Transactional
    public TeacherDtos.QuizSummary update(Long teacherId, Long quizId, TeacherDtos.UpdateQuizRequest request) {
        Quiz quiz = ownedQuiz(teacherId, quizId);
        if (quiz.getStatus() != QuizStatus.DRAFT) {
            throw new ConflictException("Only DRAFT activities can be edited.");
        }
        if (request.title() != null && !request.title().isBlank()) {
            quiz.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            quiz.setDescription(request.description());
        }
        if (request.classId() != null) {
            quiz.setClazz(ownedClass(teacherId, request.classId()));
        }
        if (request.dueDate() != null) {
            quiz.setDueDate(request.dueDate());
        }
        if (request.questions() != null) {
            if (request.questions().isEmpty()) {
                throw new BadRequestException("An activity must have at least one question.");
            }
            replaceQuestions(quiz, request.questions());
        }
        return toQuizSummary(quizRepository.save(quiz));
    }

    @Transactional
    public TeacherDtos.PublishResponse publish(Long teacherId, Long quizId) {
        Quiz quiz = ownedQuiz(teacherId, quizId);
        if (quiz.getStatus() != QuizStatus.DRAFT) {
            throw new ConflictException("Only DRAFT activities can be published.");
        }
        if (quiz.getQuestions().isEmpty()) {
            throw new BadRequestException("Add at least one question before publishing.");
        }
        if (quiz.getDueDate() != null && quiz.getDueDate().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            throw new BadRequestException("The due date must be in the future before publishing.");
        }
        quiz.setStatus(QuizStatus.PUBLISHED);
        quizRepository.save(quiz);
        return new TeacherDtos.PublishResponse(quiz.getId(), quiz.getStatus().name(), quiz.getDueDate());
    }

    // ---------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public List<StudentDtos.ActivitySummary> listForStudent(Long studentId, String category) {
        String normalized = category == null || category.isBlank() ? "all" : category.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("all", "assigned", "remedial", "completed").contains(normalized)) {
            throw new BadRequestException("category must be one of all, assigned, remedial, or completed.");
        }

        List<Long> classIds = enrollmentRepository.findAllByStudentId(studentId).stream()
                .map(enrollment -> enrollment.getClazz().getId())
                .toList();
        if (classIds.isEmpty()) {
            return List.of();
        }

        List<Quiz> quizzes = quizRepository.findByClazzIdInAndStatusOrderByIdDesc(classIds, QuizStatus.PUBLISHED);
        Map<Long, Submission> submissions = submissionRepository.findByStudentIdOrderBySubmittedAtDesc(studentId)
                .stream()
                .filter(submission -> quizzes.stream()
                        .anyMatch(quiz -> quiz.getId().equals(submission.getQuiz().getId())))
                .collect(java.util.stream.Collectors.toMap(
                        submission -> submission.getQuiz().getId(), submission -> submission, (a, b) -> a));
        Map<String, Integer> masteryByName = progressRecordRepository
                .findAllByStudentIdOrderByConceptNameAsc(studentId).stream()
                .collect(java.util.stream.Collectors.toMap(
                        record -> record.getConcept().getName().toLowerCase(Locale.ROOT),
                        ProgressRecord::getMasteryLevel, (a, b) -> b));

        List<StudentDtos.ActivitySummary> result = new ArrayList<>();
        for (Quiz quiz : quizzes) {
            Submission submission = submissions.get(quiz.getId());
            boolean remedial = isRemedial(quiz, masteryByName);
            if ("completed".equals(normalized) && submission == null) {
                continue;
            }
            if ("assigned".equals(normalized) && submission != null) {
                continue;
            }
            if ("remedial".equals(normalized) && (submission != null || !remedial)) {
                continue;
            }
            result.add(toActivitySummary(quiz, submission, remedial));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public StudentDtos.QuizDetail getQuizForStudent(Long studentId, Long quizId) {
        Quiz quiz = loadAccessiblePublishedQuiz(studentId, quizId);
        Submission submission = submissionRepository.findByStudentIdAndQuizId(studentId, quizId).orElse(null);
        Map<Long, String> draft = draftStore.get(studentId, quizId);
        String feedbackStatus = null;
        if (submission != null) {
            feedbackStatus = feedbackRepository.findBySubmissionId(submission.getId()).isPresent()
                    ? "READY"
                    : "PENDING";
        }
        List<StudentDtos.QuizQuestion> questions = quiz.getQuestions().stream()
                .map(question -> new StudentDtos.QuizQuestion(
                        question.getId(),
                        question.getText(),
                        question.getOptions().stream()
                                .map(option -> new StudentDtos.OptionView(option.key(), option.text()))
                                .toList(),
                        question.getPoints(),
                        conceptNames(question),
                        submission == null ? draft.get(question.getId()) : null))
                .toList();

        return new StudentDtos.QuizDetail(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getClazz().getId(),
                quiz.getClazz().getName(),
                quiz.getDueDate(),
                quiz.getStatus().name(),
                quiz.getQuestions().stream().mapToInt(Question::getPoints).sum(),
                submission != null,
                submission == null ? null : submission.getId(),
                submission == null ? null : submission.getScore(),
                feedbackStatus,
                questions);
    }

    @Transactional(readOnly = true)
    public StudentDtos.SaveAnswerResponse saveAnswer(Long studentId, Long quizId, Long questionId, String selectedOption) {
        Quiz quiz = loadAccessiblePublishedQuiz(studentId, quizId);
        if (submissionRepository.existsByStudentIdAndQuizId(studentId, quizId)) {
            throw new ConflictException("This activity has already been submitted.");
        }
        Question question = quiz.getQuestions().stream()
                .filter(item -> item.getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Question not found in this activity."));
        if (selectedOption != null && !selectedOption.isBlank()
                && question.getOptions().stream().noneMatch(option -> option.key().equalsIgnoreCase(selectedOption.trim()))) {
            throw new BadRequestException("selectedOption must match one of the question option keys.");
        }
        OffsetDateTime savedAt = draftStore.save(studentId, quizId, questionId, selectedOption);
        return new StudentDtos.SaveAnswerResponse(quizId, questionId, selectedOption, savedAt);
    }

    // ---------------------------------------------------------------- helpers

    @Transactional(readOnly = true)
    public Quiz ownedQuizForTeacher(Long teacherId, Long quizId) {
        return ownedQuiz(teacherId, quizId);
    }

    private Quiz ownedQuiz(Long teacherId, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found."));
        if (!quiz.getCreatedBy().getId().equals(teacherId)) {
            throw new ForbiddenOperationException("This activity belongs to another teacher.");
        }
        return quiz;
    }

    private ClassEntity ownedClass(Long teacherId, Long classId) {
        ClassEntity clazz = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found."));
        if (clazz.getTeacher() == null || !clazz.getTeacher().getId().equals(teacherId)) {
            throw new ForbiddenOperationException("You can only manage activities for your own classes.");
        }
        return clazz;
    }

    private Quiz loadAccessiblePublishedQuiz(Long studentId, Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found."));
        if (quiz.getStatus() != QuizStatus.PUBLISHED) {
            throw new ResourceNotFoundException("Activity not found.");
        }
        if (!enrollmentRepository.existsByStudentIdAndClazzId(studentId, quiz.getClazz().getId())) {
            throw new ForbiddenOperationException("You are not enrolled in this activity's class.");
        }
        return quiz;
    }

    private void replaceQuestions(Quiz quiz, List<TeacherDtos.QuizQuestionRequest> questionRequests) {
        quiz.getQuestions().clear();
        for (TeacherDtos.QuizQuestionRequest request : questionRequests) {
            if (request.options() == null || request.options().size() < 2) {
                throw new BadRequestException("Each question needs at least two options.");
            }
            List<QuestionOption> options = request.options().stream()
                    .map(option -> new QuestionOption(option.key().trim(), option.text().trim()))
                    .toList();
            long distinctKeys = options.stream().map(option -> option.key().toLowerCase(Locale.ROOT)).distinct().count();
            if (distinctKeys != options.size()) {
                throw new BadRequestException("Option keys must be unique within a question.");
            }
            if (options.stream().noneMatch(option -> option.key().equalsIgnoreCase(request.correctAnswer().trim()))) {
                throw new BadRequestException("correctAnswer must match one of the option keys.");
            }
            if (request.concepts() != null && request.concepts().size() > 3) {
                throw new BadRequestException("Attach at most three concepts per question.");
            }

            Question question = new Question();
            question.setText(request.text().trim());
            question.setOptions(new ArrayList<>(options));
            question.setCorrectAnswer(request.correctAnswer().trim());
            question.setPoints(request.points());

            Set<String> seenConcepts = new LinkedHashSet<>();
            if (request.concepts() != null) {
                for (String rawConcept : request.concepts()) {
                    String name = rawConcept.trim();
                    if (name.isEmpty() || !seenConcepts.add(name.toLowerCase(Locale.ROOT))) {
                        continue;
                    }
                    Concept concept = conceptRepository.findByNameIgnoreCase(name)
                            .orElseGet(() -> {
                                Concept created = new Concept();
                                created.setName(name);
                                return conceptRepository.save(created);
                            });
                    question.addConcept(concept);
                }
            }
            quiz.addQuestion(question);
        }
    }

    private TeacherDtos.QuizSummary toQuizSummary(Quiz quiz) {
        List<String> concepts = quiz.getQuestions().stream()
                .flatMap(question -> conceptNames(question).stream())
                .distinct()
                .toList();
        return new TeacherDtos.QuizSummary(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getClazz().getId(),
                quiz.getClazz().getName(),
                quiz.getStatus().name(),
                quiz.getDueDate(),
                quiz.getQuestions().size(),
                quiz.getQuestions().stream().mapToInt(Question::getPoints).sum(),
                concepts);
    }

    private StudentDtos.ActivitySummary toActivitySummary(Quiz quiz, Submission submission, boolean remedial) {
        String status;
        if (submission != null) {
            status = "COMPLETED";
        } else if (quiz.getDueDate() != null && quiz.getDueDate().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            status = "OVERDUE";
        } else if (remedial) {
            status = "REMEDIAL";
        } else {
            status = "ASSIGNED";
        }
        String topic = quiz.getQuestions().stream()
                .flatMap(question -> conceptNames(question).stream())
                .findFirst()
                .orElse(null);
        return new StudentDtos.ActivitySummary(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getDescription(),
                topic,
                quiz.getClazz().getId(),
                quiz.getClazz().getName(),
                quiz.getDueDate(),
                status,
                submission == null ? null : submission.getScore(),
                submission == null ? null : submission.getId(),
                quiz.getQuestions().size());
    }

    private boolean isRemedial(Quiz quiz, Map<String, Integer> masteryByName) {
        for (Question question : quiz.getQuestions()) {
            for (String concept : conceptNames(question)) {
                Integer mastery = masteryByName.get(concept.toLowerCase(Locale.ROOT));
                if (mastery != null && mastery < properties.intervention().threshold()) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean matchesTopic(Quiz quiz, String topic) {
        String needle = topic.trim().toLowerCase(Locale.ROOT);
        if (quiz.getTitle().toLowerCase(Locale.ROOT).contains(needle)) {
            return true;
        }
        return quiz.getQuestions().stream()
                .flatMap(question -> conceptNames(question).stream())
                .anyMatch(concept -> concept.toLowerCase(Locale.ROOT).contains(needle));
    }

    private List<String> conceptNames(Question question) {
        return question.getConcepts().stream()
                .map(link -> link.getConcept().getName())
                .toList();
    }

    private QuizStatus parseStatus(String status) {
        try {
            return QuizStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("status must be DRAFT, PUBLISHED, CLOSED, or all.");
        }
    }

    @SuppressWarnings("unused")
    private BigDecimal asPercentage(int earned, int total) {
        if (total <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return BigDecimal.valueOf(earned * 100.0 / total)
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    @SuppressWarnings("unused")
    private Enrollment firstEnrollment(Long studentId) {
        return enrollmentRepository.findAllByStudentId(studentId).stream().findFirst().orElse(null);
    }
}
