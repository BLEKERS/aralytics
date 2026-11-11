package ph.aralytics.backend.web.publicapi;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ph.aralytics.backend.domain.PilotInquiry;
import ph.aralytics.backend.repository.PilotInquiryRepository;

/**
 * Public (unauthenticated) surface. Pilot inquiries are persisted for the onboarding team.
 */
@RestController
@RequestMapping("/api/public")
@Tag(name = "Public", description = "Unauthenticated landing-page endpoints")
public class PublicController {

    private final PilotInquiryRepository repository;

    public PublicController(PilotInquiryRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/pilot-inquiry")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Record a pilot enquiry from the landing page")
    public void pilotInquiry(@Valid @RequestBody PilotInquiryRequest request) {
        PilotInquiry inquiry = new PilotInquiry();
        inquiry.setSchoolName(trimToNull(request.schoolName()));
        inquiry.setContactName(trimToNull(request.contactName()));
        inquiry.setEmail(request.email().trim());
        inquiry.setMessage(trimToNull(request.message()));
        inquiry.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        repository.save(inquiry);
    }

    public record PilotInquiryRequest(
            @Size(max = 160, message = "School name must be at most 160 characters") String schoolName,
            @Size(max = 160, message = "Contact name must be at most 160 characters") String contactName,
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 160, message = "Email must be at most 160 characters") String email,
            @Size(max = 2000, message = "Message must be at most 2000 characters") String message) {
    }

    private static String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
