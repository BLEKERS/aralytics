package ph.aralytics.backend.domain;

/**
 * One selectable option inside {@link Question#getOptions()}. Persisted as JSON.
 */
public record QuestionOption(String key, String text) {
}
