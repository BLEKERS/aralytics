package ph.aralytics.backend.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

public final class CommonDtos {

    private CommonDtos() {
    }

    public record PageResponse<T>(
            List<T> items,
            int page,
            int size,
            long totalItems,
            int totalPages) {
    }

    public record ConceptMastery(
            Long conceptId,
            String concept,
            int masteryLevel,
            OffsetDateTime lastUpdated) {
    }

    public record MessageResponse(String message) {
    }
}
