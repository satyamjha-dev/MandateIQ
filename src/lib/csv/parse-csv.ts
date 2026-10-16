import Papa from "papaparse";
import { detectCsvFormat } from "./detect-format";
import { normalizeRow } from "./normalize-row";
import type { CsvFormat, CsvParseResult, NormalizedTransaction, CsvImportError } from "./types";
import { validateTransaction } from "@/lib/validation";

export type ParsedCsv = {
  format: CsvFormat;
  headers: string[];
  rows: Record<string, string>[];
};

export function parseCsv(csvContent: string): ParsedCsv {
  if (!csvContent.trim()) {
    throw new Error("CSV file is empty.");
  }

  // Pre-check raw first line for duplicate column headers
  const firstLine = csvContent.split(/\r?\n/).find((line) => line.trim().length > 0);
  if (!firstLine) {
    throw new Error("CSV file is empty.");
  }

  const rawHeaders = firstLine
    .split(",")
    .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  if (new Set(rawHeaders).size !== rawHeaders.length) {
    throw new Error("CSV contains duplicate column headers.");
  }

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(
      `CSV parsing failed: ${result.errors
        .map((error) => error.message)
        .join("; ")}`
    );
  }

  const headers = result.meta.fields ?? [];

  if (headers.length === 0) {
    throw new Error("CSV headers are missing.");
  }

  const format = detectCsvFormat(headers);

  return {
    format,
    headers,
    rows: result.data,
  };
}

export function parseCsvTransactions(csvContent: string): CsvParseResult {
  const parsed = parseCsv(csvContent);
  const transactions: NormalizedTransaction[] = [];
  const errors: CsvImportError[] = [];

  parsed.rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header row
    const normalized = normalizeRow(row, parsed.format);

    if (!normalized.success) {
      errors.push({
        row: rowNum,
        message: normalized.error,
        rawText: JSON.stringify(row),
      });
      return;
    }

    const validated = validateTransaction(normalized.transaction);
    if (!validated.success) {
      errors.push({
        row: rowNum,
        message: validated.error,
        rawText: JSON.stringify(row),
      });
      return;
    }

    transactions.push(validated.transaction);
  });

  return {
    format: parsed.format,
    transactions,
    errors,
  };
}