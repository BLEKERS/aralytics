package ph.aralytics.backend.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String title;
    private final Map<String, Object> properties;

    public ApiException(HttpStatus status, String title, String detail) {
        this(status, title, detail, Map.of());
    }

    public ApiException(HttpStatus status, String title, String detail, Map<String, Object> properties) {
        super(detail);
        this.status = status;
        this.title = title;
        this.properties = properties == null ? Map.of() : properties;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getTitle() {
        return title;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }
}
