package ph.aralytics.backend.it;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;

import ph.aralytics.backend.repository.PilotInquiryRepository;
import ph.aralytics.backend.support.AbstractApiIT;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class PilotInquiryIT extends AbstractApiIT {

    @Autowired
    private PilotInquiryRepository repository;

    @Test
    void storesPilotInquiryAndReturnsCreated() throws Exception {
        long before = repository.count();

        mockMvc.perform(post("/api/public/pilot-inquiry")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "schoolName", "St. Jude Academy",
                        "contactName", "Maria Santos",
                        "email", "maria@school.edu.ph",
                        "message", "Interested in the pilot"))))
                .andExpect(status().isCreated());

        assertThat(repository.count()).isEqualTo(before + 1);
    }

    @Test
    void rejectsInvalidEmail() throws Exception {
        mockMvc.perform(post("/api/public/pilot-inquiry")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", "not-an-email"))))
                .andExpect(status().isBadRequest());
    }
}
