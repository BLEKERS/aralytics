package ph.aralytics.backend.exception;

import org.springframework.http.HttpStatus;

public class ForbiddenOperationException extends ApiException {

    public ForbiddenOperationException(String detail) {
        super(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }
}
