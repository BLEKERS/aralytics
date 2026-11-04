package ph.aralytics.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import ph.aralytics.backend.config.AralyticsProperties;
import ph.aralytics.backend.domain.User;

@Service
public class JwtService {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_USER_ID = "userId";
    private static final String CLAIM_SCHOOL_ID = "schoolId";
    private static final String CLAIM_USERNAME = "username";
    private static final String CLAIM_EMAIL = "email";

    private final SecretKey signingKey;
    private final long expirationMinutes;

    public JwtService(AralyticsProperties properties) {
        String secret = properties.jwt().secret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT secret must be at least 32 bytes. Set JWT_SECRET in the environment.");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = properties.jwt().expirationMinutes();
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(expirationMinutes * 60);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .id(UUID.randomUUID().toString())
                .claim(CLAIM_USER_ID, user.getId())
                .claim(CLAIM_USERNAME, user.getUsername())
                .claim(CLAIM_EMAIL, user.getEmail())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_SCHOOL_ID, user.getSchool() == null ? null : user.getSchool().getId())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public AuthenticatedPrincipal toPrincipal(Claims claims) {
        Long userId = claims.get(CLAIM_USER_ID, Number.class) == null
                ? Long.valueOf(claims.getSubject())
                : claims.get(CLAIM_USER_ID, Number.class).longValue();
        Long schoolId = claims.get(CLAIM_SCHOOL_ID, Number.class) == null
                ? null
                : claims.get(CLAIM_SCHOOL_ID, Number.class).longValue();
        return new AuthenticatedPrincipal(
                userId,
                claims.get(CLAIM_USERNAME, String.class),
                claims.get(CLAIM_EMAIL, String.class),
                ph.aralytics.backend.domain.Role.valueOf(claims.get(CLAIM_ROLE, String.class)),
                schoolId);
    }

    public Instant expirationOf(Claims claims) {
        return claims.getExpiration().toInstant();
    }

    public OffsetDateTime expirationDateTime(Claims claims) {
        return OffsetDateTime.ofInstant(expirationOf(claims), ZoneOffset.UTC);
    }
}
