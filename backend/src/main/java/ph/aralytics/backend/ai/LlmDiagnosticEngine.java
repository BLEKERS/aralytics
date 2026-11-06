package ph.aralytics.backend.ai;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Stub adapter for a future locally hosted model. It posts the already-scored diagnostic
 * request to an external endpoint and falls back to {@link MockDiagnosticEngine} on any
 * failure or timeout. No real model is wired in the 40% milestone.
 */
@Component
@Profile("ai")
public class LlmDiagnosticEngine implements DiagnosticEngine {

    private static final Logger log = LoggerFactory.getLogger(LlmDiagnosticEngine.class);

    private final MockDiagnosticEngine fallback = new MockDiagnosticEngine();
    private final RestClient restClient;
    private final String baseUrl;

    public LlmDiagnosticEngine(@Value("${AI_BASE_URL:}") String baseUrl) {
        this.baseUrl = baseUrl;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public FeedbackResult generate(DiagnosticRequest request) {
        if (baseUrl == null || baseUrl.isBlank()) {
            log.warn("AI_BASE_URL is not configured; using the mock diagnostic engine");
            return fallback.generate(request);
        }
        try {
            FeedbackResult result = restClient.post()
                    .uri(baseUrl.replaceAll("/+$", "") + "/diagnose")
                    .body(request)
                    .retrieve()
                    .body(FeedbackResult.class);
            if (result == null || result.content() == null || result.content().isBlank()) {
                throw new IllegalStateException("Empty diagnostic response");
            }
            List<ConceptAssessment> concepts = result.concepts() == null ? List.of() : result.concepts();
            return new FeedbackResult(result.content(), concepts);
        } catch (Exception exception) {
            log.warn("AI diagnostic call failed ({}); falling back to the mock engine", exception.getMessage());
            return fallback.generate(request);
        }
    }
}
