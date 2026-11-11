package ph.aralytics.backend.security;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import ph.aralytics.backend.exception.TooManyRequestsException;

/**
 * Failed-attempt limiter for the public auth endpoints: 5 failures per IP + identifier
 * per minute. Successful attempts do not count.
 *
 * shortcut: per-instance memory, so limits reset on restart and are not shared across
 * instances; move to Redis if the backend ever runs more than one instance.
 */
@Component
public class AuthRateLimiter {

    private static final int MAX_FAILURES = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int MAX_TRACKED_KEYS = 10_000;

    private record Attempts(Instant startedAt, int count) {
    }

    private final Map<String, Attempts> failures = new ConcurrentHashMap<>();

    /** Throws 429 when this IP + identifier already used up its attempts. */
    public void check(String identifier) {
        String key = key(identifier);
        Attempts attempts = failures.get(key);
        if (attempts == null) {
            return;
        }
        if (attempts.startedAt().plus(WINDOW).isBefore(Instant.now())) {
            failures.remove(key, attempts);
            return;
        }
        if (attempts.count() >= MAX_FAILURES) {
            throw new TooManyRequestsException("Too many attempts. Try again in a minute.");
        }
    }

    public void recordFailure(String identifier) {
        Instant now = Instant.now();
        if (failures.size() >= MAX_TRACKED_KEYS) {
            failures.entrySet().removeIf(entry -> entry.getValue().startedAt().plus(WINDOW).isBefore(now));
        }
        failures.compute(key(identifier), (ignored, previous) ->
                previous == null || previous.startedAt().plus(WINDOW).isBefore(now)
                        ? new Attempts(now, 1)
                        : new Attempts(previous.startedAt(), previous.count() + 1));
    }

    private String key(String identifier) {
        String ip = "unknown";
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            ip = attributes.getRequest().getRemoteAddr();
        }
        return ip + "|" + (identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT));
    }
}
