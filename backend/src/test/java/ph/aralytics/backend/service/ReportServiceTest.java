package ph.aralytics.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;

import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.TeacherDtos;

class ReportServiceTest {

    private TeacherDtos.RosterItem item(String name, String email, String average) {
        return new TeacherDtos.RosterItem(
                7L, name, email, "s2024-9102",
                average == null ? null : new BigDecimal(average), 2, true,
                List.of(new CommonDtos.ConceptMastery(1L, "Loops", 45, null)));
    }

    @Test
    void csvQuotesValuesAndKeepsMastery() {
        String csv = ReportService.csv(List.of(item("Miguel, Santos", "miguel@school.edu.ph", "45.50")));

        assertThat(csv).startsWith("Student ID,Name,Email,");
        assertThat(csv).contains("\"Miguel, Santos\"");
        assertThat(csv).contains("\"Loops: 45%\"");
        assertThat(csv).contains("\"yes\"");
    }

    @Test
    void csvHandlesStudentsWithNoScore() {
        String csv = ReportService.csv(List.of(item("Ana", "ana@school.edu.ph", null)));

        assertThat(csv).contains("\"Ana\",\"ana@school.edu.ph\",\"s2024-9102\",\"\",\"2\"");
    }

    @Test
    void csvNeutralizesSpreadsheetFormulas() {
        String csv = ReportService.csv(List.of(
                item("=HYPERLINK(\"http://evil\",\"click\")", "evil@school.edu.ph", null),
                item("+SUM(A1)", "plus@school.edu.ph", null),
                item("-2+3", "minus@school.edu.ph", null),
                item("@cmd", "at@school.edu.ph", null)));

        assertThat(csv).contains("\"'=HYPERLINK(\"\"http://evil\"\",\"\"click\"\")\"");
        assertThat(csv).contains("\"'+SUM(A1)\"");
        assertThat(csv).contains("\"'-2+3\"");
        assertThat(csv).contains("\"'@cmd\"");
    }

    @Test
    void pdfHasAValidTrailer() {
        byte[] pdf = ReportService.pdf("Cohort", List.of("STU-7  Miguel  45.5"));

        String text = new String(pdf, StandardCharsets.US_ASCII);
        assertThat(text).startsWith("%PDF-1.4");
        assertThat(text).contains("/Type /Catalog");
        assertThat(text).contains("startxref");
        assertThat(text).endsWith("%%EOF\n");
    }

    @Test
    void pdfKeepsLatin1NamesAndWrapsLongLines() {
        byte[] pdf = ReportService.pdf("Peña Cohort", List.of("Peña, Niño", "x".repeat(200)));

        String text = new String(pdf, Charset.forName("windows-1252"));
        assertThat(text).contains("/Encoding /WinAnsiEncoding");
        assertThat(text).contains("Peña, Niño");
        assertThat(text).contains("x".repeat(80));
        assertThat(text).doesNotContain("x".repeat(81));
    }
}
