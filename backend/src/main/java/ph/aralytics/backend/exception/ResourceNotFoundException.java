package ph.aralytics.backend.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String detail) {
        super(HttpStatus.NOT_FOUND, "Not Found", detail);
    }
}
