/**
 * Minimal, dependency-free CSV builder for Admin Analytics' export
 * infrastructure (requirement 7). Values are quoted (and internal
 * quotes doubled) whenever they contain a comma, quote, or newline -
 * the common RFC-4180-ish subset every spreadsheet application (Excel,
 * Google Sheets, Numbers) reads correctly. No third-party CSV package -
 * this is small and self-contained enough not to warrant one.
 */

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/** Builds a full CSV document (header row + data rows, CRLF line endings) from already-resolved values. */
export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [headers.map(escapeCsvValue).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvValue).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}
