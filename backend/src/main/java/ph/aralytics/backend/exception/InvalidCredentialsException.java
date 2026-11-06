package ph.aralytics.backend.exception;

import org.springframework.http.HttpStatus;

public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException(String detail) {
        super(HttpStatus.UNAUTHORIZED, "Unauthorized", detail);
    }
}
