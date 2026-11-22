package ph.aralytics.backend.domain;

import java.util.List;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Stores question options as JSON text so both PostgreSQL and H2 need no JSON column type. */
@Converter
public class QuestionOptionListConverter implements AttributeConverter<List<QuestionOption>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<QuestionOption>> TYPE = new TypeReference<>() {
    };

    @Override
    public String convertToDatabaseColumn(List<QuestionOption> options) {
        if (options == null) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(options);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize question options", exception);
        }
    }

    @Override
    public List<QuestionOption> convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(json, TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not read question options", exception);
        }
    }
}
