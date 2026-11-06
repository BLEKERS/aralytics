package ph.aralytics.backend.service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.QuizStatus;
import ph.aralytics.backend.domain.Submission;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.exception.ResourceNotFoundException;
import ph.aralytics.backend.repository.EnrollmentRepository;
import ph.aralytics.backend.repository.ProgressRecordRepository;
import ph.aralytics.backend.repository.QuizRepository;
import ph.aralytics.backend.repository.SubmissionRepository;
import ph.aralytics.backend.repository.UserRepository;
import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.StudentDtos;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final QuizRepository quizRepository;
    private final SubmissionRepository submissionRepository;
    private final ProgressRecordRepository progressRecordRepository;
    private final DtoMapper dtoMapper;

    public DashboardService(UserRepository userRepository, EnrollmentRepository enrollmentRepository,
            QuizRepository quizRepository, SubmissionRepository submissionRepository,
            ProgressRecordRepository progressRecordRepository, DtoMapper dtoMapper) {
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.quizRepository = quizRepository;
        this.submissionRepository = submissionRepository;
        this.progressRecordRepository = progressRecordRepository;
        this.dtoMapper = dtoMapper;
    }

    @Transactional(readOnly = true)
    public StudentDtos.DashboardResponse studentDashboard(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        List<Long> classIds = enrollmentRepository.findAllByStudentId(studentId).stream()
                .map(enrollment -> enrollment.getClazz().getId())
                .toList();
        if (classIds.isEmpty()) {
            return new StudentDtos.DashboardResponse(student.getFullName(), 0, 0, List.of(),
                    new StudentDtos.StreakSummary(0, List.of()), List.of());
        }

        List<Quiz> published = quizRepository.findByClazzIdInAndStatusOrderByIdDesc(classIds, QuizStatus.PUBLISHED);
        Set<Long> publishedIds = published.stream().map(Quiz::getId).collect(java.util.stream.Collectors.toSet());
        List<Submission> submissions = submissionRepository.findByStudentIdOrderBySubmittedAtDesc(studentId)
                .stream()
                .filter(submission -> publishedIds.contains(submission.getQuiz().getId()))
                .toList();
        Set<Long> completedQuizIds = submissions.stream()
                .map(submission -> submission.getQuiz().getId())
                .collect(java.util.stream.Collectors.toSet());
        int assignedCount = (int) published.stream()
                .filter(quiz -> !completedQuizIds.contains(quiz.getId()))
                .count();

        List<StudentDtos.RecentScore> recentScores = submissions.stream()
                .limit(5)
                .map(submission -> new StudentDtos.RecentScore(
                        submission.getId(),
                        submission.getQuiz().getId(),
                        submission.getQuiz().getTitle(),
                        submission.getScore(),
                        submission.getSubmittedAt()))
                .toList();

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate windowStart = today.minusDays(6);
        List<LocalDate> activeDates = submissions.stream()
                .map(submission -> submission.getSubmittedAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate())
                .filter(date -> !date.isBefore(windowStart) && !date.isAfter(today))
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        List<CommonDtos.ConceptMastery> mastery = progressRecordRepository
                .findAllByStudentIdOrderByConceptNameAsc(studentId).stream()
                .map(dtoMapper::toConceptMastery)
                .toList();

        return new StudentDtos.DashboardResponse(
                student.getFullName(),
                assignedCount,
                submissions.size(),
                recentScores,
                new StudentDtos.StreakSummary(activeDates.size(), activeDates),
                mastery);
    }

    @Transactional(readOnly = true)
    public StudentDtos.ProgressResponse studentProgress(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        List<CommonDtos.ConceptMastery> concepts = progressRecordRepository
                .findAllByStudentIdOrderByConceptNameAsc(studentId).stream()
                .map(dtoMapper::toConceptMastery)
                .toList();
        return new StudentDtos.ProgressResponse(student.getId(), student.getFullName(), concepts);
    }
}
