package ph.aralytics.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.domain.ClassEntity;
import ph.aralytics.backend.domain.Enrollment;
import ph.aralytics.backend.domain.Feedback;
import ph.aralytics.backend.domain.ProgressRecord;
import ph.aralytics.backend.domain.Question;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.QuizStatus;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.ForbiddenOperationException;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.ClassRepository;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.FeedbackRepository;
import ph.aralytics.backend.repository.ProgressRecordRepository;
import ph.aralytics.backend.repository.QuizRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.repository.UserRepository;
import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.StudentDtos;
import ph.aralytics.backend.web.dto.TeacherDtos;

@Service
public class RosterService {

    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final SubmissionRepository submissionRepository;
    private final ProgressRecordRepository progressRecordRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final FeedbackService feedbackService;
    private final DtoMapper dtoMapper;
    private final TeacherSettingsService teacherSettingsService;

    public RosterService(ClassRepository classRepository, EnrollmentRepository enrollmentRepository,
            QuizRepository quizRepository, SubmissionRepository submissionRepository,
            ProgressRecordRepository progressRecordRepository, FeedbackRepository feedbackRepository,
            UserRepository userRepository, FeedbackService feedbackService, DtoMapper dtoMapper,
            TeacherSettingsService teacherSettingsService) {
        this.classRepository = classRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.quizRepository = quizRepository;
        this.submissionRepository = submissionRepository;
        this.progressRecordRepository = progressRecordRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.feedbackService = feedbackService;
        this.dtoMapper = dtoMapper;
        this.teacherSettingsService = teacherSettingsService;
    }

    @Transactional(readOnly = true)
    public TeacherDtos.TeacherDashboardResponse teacherDashboard(Long teacherId, String section, String concept) {
        List<ClassEntity> classes = teacherClasses(teacherId, section);
        List<Long> classIds = classes.stream().map(ClassEntity::getId).toList();
        Map<Long, User> students = enrolledStudents(classIds);
        List<Quiz> quizzes = publishedQuizzes(classIds, concept);
        List<Long> quizIds = quizzes.stream().map(Quiz::getId).toList();
        List<Submission> submissions = submissionsFor(quizIds, students.keySet());
        Map<Long, List<Submission>> submissionsByStudent = submissions.stream()
                .collect(Collectors.groupingBy(submission -> submission.getStudent().getId()));
        Map<Long, List<ProgressRecord>> progressByStudent = progressFor(students.keySet());
        int threshold = teacherSettingsService.thresholdFor(teacherId);

        List<TeacherDtos.StudentPerformance> belowThreshold = new ArrayList<>();
        int highMasteryCount = 0;
        int practiceCount = 0;
        int strugglingCount = 0;
        int onTrackCount = 0;
        int needsNudgeCount = 0;
        int activeStudentCount = 0;
        for (User student : students.values()) {
            List<Submission> studentSubmissions = submissionsByStudent.getOrDefault(student.getId(), List.of());
            BigDecimal average = averageScore(studentSubmissions);
            int score = average == null ? 0 : (int) Math.round(average.doubleValue());
            if (average != null) {
                activeStudentCount++;
            }
            if (score >= 85) {
                highMasteryCount++;
            }
            if (score < threshold) {
                strugglingCount++;
            } else if (score < 85) {
                practiceCount++;
            }
            if (score >= threshold + 5) {
                onTrackCount++;
            } else if (score >= threshold) {
                needsNudgeCount++;
            }
            if (average != null && average.compareTo(BigDecimal.valueOf(threshold)) < 0) {
                belowThreshold.add(new TeacherDtos.StudentPerformance(
                        student.getId(),
                        student.getFullName(),
                        student.getEmail(),
                        average,
                        studentSubmissions.size(),
                        masteryList(progressByStudent.getOrDefault(student.getId(), List.of()), concept)));
            }
        }
        belowThreshold.sort(Comparator.comparing(TeacherDtos.StudentPerformance::averageScore));

        return new TeacherDtos.TeacherDashboardResponse(
                section == null || section.isBlank() ? "All sections" : section,
                concept == null || concept.isBlank() ? "All concepts" : concept,
                students.size(),
                averageScore(submissions),
                completionRate(submissions.size(), students.size(), quizzes.size()),
                belowThreshold.size(),
                threshold,
                highMasteryCount,
                practiceCount,
                strugglingCount,
                onTrackCount,
                needsNudgeCount,
                activeStudentCount,
                belowThreshold,
                classMastery(students.keySet(), concept));
    }

    @Transactional(readOnly = true)
    public CommonDtos.PageResponse<TeacherDtos.RosterItem> roster(Long teacherId, String search, String topic,
            String status, int page, int size) {
        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, size);

        List<ClassEntity> classes = teacherClasses(teacherId, null);
        List<Long> classIds = classes.stream().map(ClassEntity::getId).toList();
        Map<Long, User> students = enrolledStudents(classIds);
        List<Quiz> quizzes = publishedQuizzes(classIds, null);
        List<Long> quizIds = quizzes.stream().map(Quiz::getId).toList();
        List<Submission> submissions = submissionsFor(quizIds, students.keySet());
        Map<Long, List<Submission>> submissionsByStudent = submissions.stream()
                .collect(Collectors.groupingBy(submission -> submission.getStudent().getId()));
        Map<Long, List<ProgressRecord>> progressByStudent = progressFor(students.keySet());
        int threshold = teacherSettingsService.thresholdFor(teacherId);
        String statusFilter = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);

        List<TeacherDtos.RosterItem> items = new ArrayList<>();
        for (User student : students.values()) {
            if (search != null && !search.isBlank()) {
                String needle = search.trim().toLowerCase(Locale.ROOT);
                if (!contains(student.getFullName(), needle)
                        && !contains(student.getEmail(), needle)
                        && !contains(student.getUsername(), needle)) {
                    continue;
                }
            }
            List<ProgressRecord> progress = progressByStudent.getOrDefault(student.getId(), List.of());
            List<CommonDtos.ConceptMastery> mastery = masteryList(progress, topic);
            if (topic != null && !topic.isBlank() && mastery.isEmpty()) {
                continue;
            }
            List<Submission> studentSubmissions = submissionsByStudent.getOrDefault(student.getId(), List.of());
            BigDecimal average = averageScore(studentSubmissions);
            boolean below = average != null && average.compareTo(BigDecimal.valueOf(threshold)) < 0;
            if (!matchesStatus(statusFilter, average, threshold)) {
                continue;
            }
            items.add(new TeacherDtos.RosterItem(
                    student.getId(),
                    student.getFullName(),
                    student.getEmail(),
                    student.getUsername(),
                    average,
                    studentSubmissions.size(),
                    below,
                    mastery));
        }
        items.sort(Comparator.comparing(TeacherDtos.RosterItem::fullName));

        int total = items.size();
        int from = (int) Math.min((long) (safePage - 1) * safeSize, total);
        int to = (int) Math.min((long) from + safeSize, total);
        int totalPages = total == 0 ? 0 : (int) Math.ceil(total / (double) safeSize);
        return new CommonDtos.PageResponse<>(
                new ArrayList<>(items.subList(from, to)), safePage, safeSize, total, totalPages);
    }

    @Transactional(readOnly = true)
    public TeacherDtos.StudentDiagnosticResponse studentDiagnostic(Long teacherId, Long studentId) {
        List<ClassEntity> teacherClasses = classRepository.findAllByTeacherIdOrderByIdAsc(teacherId);
        List<Long> teacherClassIds = teacherClasses.stream().map(ClassEntity::getId).toList();
        List<Long> studentClassIds = enrollmentRepository.findAllByStudentId(studentId).stream()
                .map(enrollment -> enrollment.getClazz().getId())
                .toList();
        if (studentClassIds.stream().noneMatch(teacherClassIds::contains)) {
            throw new ForbiddenOperationException("This student is not enrolled in one of your classes.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        List<Long> sharedClassIds = studentClassIds.stream().filter(teacherClassIds::contains).toList();
        List<Quiz> quizzes = quizRepository.findByClazzIdInAndStatusOrderByIdDesc(sharedClassIds, QuizStatus.PUBLISHED);
        List<Long> quizIds = quizzes.stream().map(Quiz::getId).toList();
        List<Submission> submissions = quizIds.isEmpty()
                ? List.of()
                : submissionRepository.findByQuizIdIn(quizIds).stream()
                        .filter(submission -> submission.getStudent().getId().equals(studentId))
                        .toList();

        List<StudentDtos.FeedbackView> feedback = feedbackRepository
                .findAllByStudentIdOrderByGeneratedAtDesc(studentId).stream()
                .filter(item -> quizIds.contains(item.getSubmission().getQuiz().getId()))
                .map(item -> feedbackService.map(item.getSubmission(), item))
                .toList();

        return new TeacherDtos.StudentDiagnosticResponse(
                student.getId(),
                student.getFullName(),
                averageScore(submissions),
                masteryList(progressRecordRepository.findAllByStudentIdOrderByConceptNameAsc(studentId), null),
                feedback);
    }

    // ---------------------------------------------------------------- helpers

    private List<ClassEntity> teacherClasses(Long teacherId, String section) {
        List<ClassEntity> classes = classRepository.findAllByTeacherIdOrderByIdAsc(teacherId);
        if (section == null || section.isBlank()) {
            return classes;
        }
        String needle = section.trim().toLowerCase(Locale.ROOT);
        return classes.stream()
                .filter(clazz -> String.valueOf(clazz.getId()).equals(needle)
                        || clazz.getName().toLowerCase(Locale.ROOT).equals(needle)
                        || clazz.getName().toLowerCase(Locale.ROOT).contains(needle))
                .findFirst()
                .map(List::of)
                .orElseThrow(() -> new ResourceNotFoundException("No class matching that section in your classes."));
    }

    private Map<Long, User> enrolledStudents(List<Long> classIds) {
        if (classIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, User> students = new LinkedHashMap<>();
        for (Enrollment enrollment : enrollmentRepository.findAllByClazzIdIn(classIds)) {
            students.putIfAbsent(enrollment.getStudent().getId(), enrollment.getStudent());
        }
        return students;
    }

    private List<Quiz> publishedQuizzes(List<Long> classIds, String concept) {
        if (classIds.isEmpty()) {
            return List.of();
        }
        return quizRepository.findByClazzIdInAndStatusOrderByIdDesc(classIds, QuizStatus.PUBLISHED).stream()
                .filter(quiz -> concept == null || concept.isBlank() || quizHasConcept(quiz, concept))
                .toList();
    }

    private boolean quizHasConcept(Quiz quiz, String concept) {
        return quiz.getQuestions().stream()
                .flatMap(question -> questionConcepts(question).stream())
                .anyMatch(name -> isConceptMatch(name, concept));
    }

    private boolean isConceptMatch(String conceptName, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        if (conceptName == null) {
            return false;
        }
        String needle = filter.trim().toLowerCase(Locale.ROOT);
        String candidate = conceptName.toLowerCase(Locale.ROOT);
        return candidate.equals(needle) || candidate.contains(needle);
    }

    /**
     * Status filters shared by the dashboard tabs and the roster pills. Students with no
     * submissions count as 0%, so they land in the at-risk bucket instead of disappearing.
     */
    private boolean matchesStatus(String status, BigDecimal average, int threshold) {
        if (status == null || status.isBlank()) {
            return true;
        }
        int score = average == null ? 0 : (int) Math.round(average.doubleValue());
        return switch (status) {
            case "below", "at-risk", "needs-support", "needs-help", "struggling" -> score < threshold;
            case "above", "mastered" -> score >= threshold;
            case "on-track" -> score >= threshold + 5;
            case "needs-nudge" -> score >= threshold && score < threshold + 5;
            case "high" -> score >= 85;
            case "practice" -> score >= threshold && score < 85;
            default -> true;
        };
    }

    private List<String> questionConcepts(Question question) {
        return question.getConcepts().stream().map(link -> link.getConcept().getName()).toList();
    }

    private List<Submission> submissionsFor(List<Long> quizIds, Set<Long> studentIds) {
        if (quizIds.isEmpty() || studentIds.isEmpty()) {
            return List.of();
        }
        return submissionRepository.findByQuizIdIn(quizIds).stream()
                .filter(submission -> studentIds.contains(submission.getStudent().getId()))
                .toList();
    }

    private Map<Long, List<ProgressRecord>> progressFor(Set<Long> studentIds) {
        if (studentIds.isEmpty()) {
            return Map.of();
        }
        return progressRecordRepository.findAllByStudentIdIn(studentIds).stream()
                .collect(Collectors.groupingBy(record -> record.getStudent().getId()));
    }

    private List<CommonDtos.ConceptMastery> masteryList(List<ProgressRecord> records, String concept) {
        return records.stream()
                .filter(record -> isConceptMatch(record.getConcept().getName(), concept))
                .map(dtoMapper::toConceptMastery)
                .sorted(Comparator.comparing(CommonDtos.ConceptMastery::concept))
                .toList();
    }

    private List<CommonDtos.ConceptMastery> classMastery(Set<Long> studentIds, String concept) {
        if (studentIds.isEmpty()) {
            return List.of();
        }
        List<ProgressRecord> records = progressRecordRepository.findAllByStudentIdIn(studentIds);
        Map<Long, List<ProgressRecord>> byConcept = records.stream()
                .collect(Collectors.groupingBy(record -> record.getConcept().getId(),
                        LinkedHashMap::new, Collectors.toList()));
        List<CommonDtos.ConceptMastery> result = new ArrayList<>();
        for (List<ProgressRecord> conceptRecords : byConcept.values()) {
            ProgressRecord first = conceptRecords.get(0);
            if (!isConceptMatch(first.getConcept().getName(), concept)) {
                continue;
            }
            int average = (int) Math.round(conceptRecords.stream()
                    .mapToInt(ProgressRecord::getMasteryLevel).average().orElse(0));
            result.add(new CommonDtos.ConceptMastery(
                    first.getConcept().getId(),
                    first.getConcept().getName(),
                    average,
                    conceptRecords.stream().map(ProgressRecord::getLastUpdated)
                            .max(Comparator.naturalOrder()).orElse(null)));
        }
        result.sort(Comparator.comparing(CommonDtos.ConceptMastery::concept));
        return result;
    }

    private BigDecimal averageScore(List<Submission> submissions) {
        if (submissions.isEmpty()) {
            return null;
        }
        BigDecimal total = submissions.stream()
                .map(Submission::getScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.divide(BigDecimal.valueOf(submissions.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal completionRate(int submissions, int students, int quizzes) {
        if (students == 0 || quizzes == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        double rate = Math.min(100.0, submissions * 100.0 / (students * quizzes));
        return BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }
}
