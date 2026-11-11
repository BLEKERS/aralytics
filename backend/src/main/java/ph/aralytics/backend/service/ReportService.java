package ph.aralytics.backend.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import ph.aralytics.backend.web.dto.CommonDtos;
import ph.aralytics.backend.web.dto.TeacherDtos;

/**
 * Server-side report generation (PRD FR-RPT). CSV is plain text; the PDF is a minimal
 * single-font document written by hand so the backend does not need a PDF dependency.
 */
@Service
public class ReportService {

    private static final Charset WIN_ANSI = Charset.forName("windows-1252");

    private final RosterService rosterService;

    public ReportService(RosterService rosterService) {
        this.rosterService = rosterService;
    }

    public byte[] exportCsv(Long teacherId, String topic) {
        List<TeacherDtos.RosterItem> items = rosterService
                .roster(teacherId, null, topic, null, 1, Integer.MAX_VALUE).items();
        return csv(items).getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportPdf(Long teacherId, String section, String topic) {
        List<TeacherDtos.RosterItem> items = rosterService
                .roster(teacherId, null, topic, null, 1, Integer.MAX_VALUE).items();
        List<String> lines = new ArrayList<>();
        lines.add("Section: " + (section == null || section.isBlank() ? "All sections" : section)
                + "   Concept: " + (topic == null || topic.isBlank() ? "All concepts" : topic)
                + "   Students: " + items.size());
        lines.add("");
        lines.add("ID        Name                          Avg    Done  Flag  Strongest concept");
        for (TeacherDtos.RosterItem item : items) {
            String strongest = item.mastery().stream()
                    .max(java.util.Comparator.comparingInt(CommonDtos.ConceptMastery::masteryLevel))
                    .map(concept -> concept.concept() + " " + concept.masteryLevel() + "%")
                    .orElse("-");
            lines.add(String.format("%-9s %-29s %-6s %-5d %-5s %s",
                    "STU-" + item.studentId(),
                    truncate(item.fullName(), 29),
                    item.averageScore() == null ? "-" : item.averageScore().stripTrailingZeros().toPlainString(),
                    item.completedCount(),
                    item.belowThreshold() ? "yes" : "no",
                    truncate(strongest, 40)));
        }
        return pdf("Aralytics Cohort Report", lines);
    }

    static String csv(List<TeacherDtos.RosterItem> items) {
        StringBuilder builder = new StringBuilder();
        builder.append("Student ID,Name,Email,Username,Average Score,Completed,Below Threshold,Mastery\r\n");
        for (TeacherDtos.RosterItem item : items) {
            String mastery = item.mastery().stream()
                    .map(concept -> concept.concept() + ": " + concept.masteryLevel() + "%")
                    .reduce((left, right) -> left + "; " + right)
                    .orElse("");
            builder.append(String.join(",",
                    quote("STU-" + item.studentId()),
                    quote(item.fullName()),
                    quote(item.email()),
                    quote(item.username()),
                    quote(item.averageScore() == null ? "" : item.averageScore().toPlainString()),
                    quote(String.valueOf(item.completedCount())),
                    quote(item.belowThreshold() ? "yes" : "no"),
                    quote(mastery)))
                    .append("\r\n");
        }
        return builder.toString();
    }

    /**
     * Minimal PDF 1.4 with one Helvetica font. Lines wrap at a fixed character count instead
     * of measuring glyphs, which is enough for a roster table export.
     * shortcut: 50 lines per page, WinAnsi text only; use a PDF library with a Unicode font
     * if layout or non-Latin scripts matter.
     */
    static byte[] pdf(String title, List<String> lines) {
        final int linesPerPage = 50;
        final int maxChars = 80;
        List<String> wrapped = new ArrayList<>();
        for (String line : lines) {
            wrapped.addAll(wrap(line, maxChars));
        }
        List<String> titleLines = wrap(title, maxChars);
        int pageCount = Math.max(1, (wrapped.size() + linesPerPage - 1) / linesPerPage);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<Integer> offsets = new ArrayList<>();

        write(out, "%PDF-1.4\n");
        int fontObject = 3;
        int firstPageObject = 4;
        int catalogObject = 1;
        int pagesObject = 2;

        // Object 1: catalog
        offsets.add(out.size());
        write(out, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        // Object 2: page tree
        offsets.add(out.size());
        StringBuilder kids = new StringBuilder();
        for (int page = 0; page < pageCount; page++) {
            kids.append(firstPageObject + page * 2).append(" 0 R ");
        }
        write(out, "2 0 obj\n<< /Type /Pages /Kids [" + kids + "] /Count " + pageCount + " >>\nendobj\n");
        // Object 3: font
        offsets.add(out.size());
        write(out, "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");

        for (int page = 0; page < pageCount; page++) {
            int pageObject = firstPageObject + page * 2;
            offsets.add(out.size());
            write(out, pageObject + " 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]"
                    + " /Resources << /Font << /F1 " + fontObject + " 0 R >> >>"
                    + " /Contents " + (pageObject + 1) + " 0 R >>\nendobj\n");

            StringBuilder content = new StringBuilder();
            int titleY = 760;
            for (String titleLine : titleLines) {
                content.append("BT /F1 14 Tf 40 ").append(titleY).append(" Td (")
                        .append(escapePdf(titleLine)).append(") Tj ET\n");
                titleY -= 18;
            }
            content.append("BT /F1 9 Tf 40 ").append(titleY - 4).append(" Td 12 TL\n");
            int from = page * linesPerPage;
            int to = Math.min(wrapped.size(), from + linesPerPage);
            for (int index = from; index < to; index++) {
                content.append('(').append(escapePdf(wrapped.get(index))).append(") Tj T*\n");
            }
            content.append("ET\n");
            byte[] contentBytes = content.toString().getBytes(WIN_ANSI);

            offsets.add(out.size());
            write(out, (pageObject + 1) + " 0 obj\n<< /Length " + contentBytes.length + " >>\nstream\n");
            out.writeBytes(contentBytes);
            write(out, "endstream\nendobj\n");
        }

        int xrefOffset = out.size();
        write(out, "xref\n0 " + (offsets.size() + 1) + "\n0000000000 65535 f \n");
        for (int offset : offsets) {
            write(out, String.format("%010d 00000 n \n", offset));
        }
        write(out, "trailer\n<< /Size " + (offsets.size() + 1) + " /Root " + catalogObject + " 0 R >>\n");
        write(out, "startxref\n" + xrefOffset + "\n%%EOF\n");
        return out.toByteArray();
    }

    private static void write(ByteArrayOutputStream out, String text) {
        out.writeBytes(text.getBytes(StandardCharsets.US_ASCII));
    }

    private static String quote(String value) {
        String text = value == null ? "" : value;
        // Neutralize spreadsheet formulas: a leading =, +, -, @, tab or CR would be evaluated by Excel.
        if (!text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) {
            text = "'" + text;
        }
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    private static String truncate(String value, int length) {
        String text = value == null ? "" : value;
        return text.length() <= length ? text : text.substring(0, Math.max(0, length - 3)) + "...";
    }

    /** Splits on spaces where possible and hard-wraps longer tokens. */
    private static List<String> wrap(String value, int max) {
        List<String> out = new ArrayList<>();
        for (String raw : (value == null ? "" : value).split("\n", -1)) {
            String line = raw;
            while (line.length() > max) {
                int cut = line.lastIndexOf(' ', max);
                if (cut <= 0) {
                    cut = max;
                }
                out.add(line.substring(0, cut));
                line = line.substring(cut).stripLeading();
            }
            out.add(line);
        }
        return out;
    }

    private static String escapePdf(String value) {
        StringBuilder builder = new StringBuilder((value == null ? "" : value).length());
        for (char character : (value == null ? "" : value).toCharArray()) {
            if (character == '\\' || character == '(' || character == ')') {
                builder.append('\\').append(character);
            } else if (character == '\r' || character == '\n' || character == '\t') {
                builder.append(' ');
            } else if ((character >= 32 && character <= 126) || (character >= 160 && character <= 255)) {
                builder.append(character);
            } else {
                builder.append('?');
            }
        }
        return builder.toString();
    }
}
