package ph.aralytics.backend.web.publicapi;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import ph.aralytics.backend.exception.NotImplementedException;

/**
 * Public (unauthenticated) surface. Pilot inquiries are intentionally not persisted in the
 * 40% milestone (PRD FR-AUTH-01 / landing-page lead capture is deferred); the endpoint
 * returns an explicit 501 instead of pretending to succeed.
 */
@RestController
@RequestMapping("/api/public")
@Tag(name = "Public", description = "Unauthenticated landing-page endpoints")
public class PublicController {

    @PostMapping("/pilot-inquiry")
    public void pilotInquiry() {
        throw new NotImplementedException(
                "Pilot inquiry submissions are deferred beyond the 40% milestone (PRD section 6.1).");
    }
}
