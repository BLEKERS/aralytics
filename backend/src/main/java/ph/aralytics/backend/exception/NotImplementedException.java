package ph.aralytics.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Explicitly deferred feature surface. Returning 501 keeps unimplemented frontend routes
 * honest instead of silently failing (see backend/README.md "Out of scope").
 */
public class NotImplementedException extends ApiException {

    public NotImplementedException(String detail) {
        super(HttpStatus.NOT_IMPLEMENTED, "Not Implemented", detail);
    }
}
