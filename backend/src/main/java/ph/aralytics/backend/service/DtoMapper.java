package ph.aralytics.backend.service;

import java.util.List;

import org.springframework.stereotype.Component;

import ph.aralytics.backend.domain.ClassEntity;
import ph.aralytics.backend.domain.Concept;
import ph.aralytics.backend.domain.Feedback;
import ph.aralytics.backend.domain.FeedbackConcept;
import ph.aralytics.backend.domain.ProgressRecord;
import ph.aralytics.backend.domain.Quiz;
import ph.aralytics.backend.domain.School;
import ph.aralytics.backend.domain.User;
import ph.aralytics.backend.web.dto.AuthDtos;
import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.StudentDtos;

@Component
public class DtoMapper {

    public AuthDtos.UserSummary toUserSummary(User user) {
        School school = user.getSchool();
        return new AuthDtos.UserSummary(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                school == null ? null : school.getId(),
                school == null ? null : school.getName(),
                user.getCreatedAt(),
                user.getLastLogin());
    }

    public AuthDtos.ClassSummary toClassSummary(ClassEntity clazz) {
        School school = clazz.getSchool();
        User teacher = clazz.getTeacher();
        return new AuthDtos.ClassSummary(
                clazz.getId(),
                clazz.getName(),
                school == null ? null : school.getId(),
                school == null ? null : school.getName(),
                teacher == null ? null : teacher.getId(),
                teacher == null ? null : teacher.getFullName());
    }

    public CommonDtos.ConceptMastery toConceptMastery(ProgressRecord record) {
        Concept concept = record.getConcept();
        return new CommonDtos.ConceptMastery(
                concept.getId(),
                concept.getName(),
                record.getMasteryLevel(),
                record.getLastUpdated());
    }

    public StudentDtos.FeedbackView toFeedbackView(Feedback feedback, List<FeedbackConcept> links,
            List<ProgressRecord> progressRecords) {
        Quiz quiz = feedback.getSubmission().getQuiz();
        List<CommonDtos.ConceptMastery> concepts = links.stream()
                .map(link -> {
                    Concept concept = link.getConcept();
                    int mastery = progressRecords.stream()
                            .filter(record -> record.getConcept().getId().equals(concept.getId()))
                            .mapToInt(ProgressRecord::getMasteryLevel)
                            .findFirst()
                            .orElse(0);
                    return new CommonDtos.ConceptMastery(
                            concept.getId(), concept.getName(), mastery, feedback.getGeneratedAt());
                })
                .toList();
        return new StudentDtos.FeedbackView(
                feedback.getId(),
                feedback.getSubmission().getId(),
                quiz.getId(),
                quiz.getTitle(),
                "READY",
                feedback.getContent(),
                feedback.getGeneratedAt(),
                concepts);
    }
}
