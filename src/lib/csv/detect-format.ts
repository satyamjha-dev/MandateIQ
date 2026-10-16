import type { CsvFormat } from "./types";

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
}

export function detectCsvFormat(headers: string[]): CsvFormat {
  const normalizedHeaders = new Set(headers.map(normalizeHeader));

  // Standard CSV format
  const isStandard =
    normalizedHeaders.has("date") &&
    normalizedHeaders.has("description") &&
    normalizedHeaders.has("amount") &&
    normalizedHeaders.has("type") &&
    normalizedHeaders.has("currency");

  if (isStandard) {
    return "STANDARD";
  }

  // Bank A format
  const isBankA =
    normalizedHeaders.has("transactiondate") &&
    normalizedHeaders.has("narration") &&
    normalizedHeaders.has("debit") &&
    normalizedHeaders.has("credit");

  if (isBankA) {
    return "BANK_A";
  }

  // Bank B format
  const isBankB =
    normalizedHeaders.has("txndate") &&
    normalizedHeaders.has("particulars") &&
    normalizedHeaders.has("withdrawal") &&
    normalizedHeaders.has("deposit");

  if (isBankB) {
    return "BANK_B";
  }

  throw new Error(
    "Unsupported CSV format. Please provide a Standard, Bank A, or Bank B CSV file."
  );
}