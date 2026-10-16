import type {
  CsvFormat,
  NormalizedTransaction,
  TransactionType,
} from "./types";
import { identifyMerchant } from "@/lib/merchants/identify";

type NormalizeResult =
  | { success: true; transaction: NormalizedTransaction }
  | { success: false; error: string };

type CsvRow = Record<string, string | undefined>;

function getValue(row: CsvRow, key: string): string {
  const actualKey = Object.keys(row).find(
    (header) =>
      header.trim().toLowerCase().replace(/[_\s-]+/g, "") === key,
  );

  return actualKey ? String(row[actualKey] ?? "").trim() : "";
}

function parseDate(value: string, format: CsvFormat): Date | null {
  if (!value) return null;
  let year: number;
  let month: number;
  let day: number;

  if (format === "STANDARD") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    [, year, month, day] = match.map(Number);
  } else if (format === "BANK_A") {
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    [, day, month, year] = match.map(Number);
  } else {
    const match = value.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
    if (!match) return null;

    const months: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4,
      may: 5, jun: 6, jul: 7, aug: 8,
      sep: 9, oct: 10, nov: 11, dec: 12,
    };

    day = Number(match[1]);
    month = months[match[2].toLowerCase()] ?? 0;
    year = Number(match[3]);
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function parseAmount(value: string): string | null {
  if (!value) return null;
  const clean = value.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;

  const [whole, fraction = ""] = clean.split(".");
  const normalizedWhole = whole.replace(/^0+(?=\d)/, "") || "0";

  if (normalizedWhole.length > 12) return null;

  return `${normalizedWhole}.${fraction.padEnd(2, "0")}`;
}

export function normalizeDescription(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} .&/-]/gu, "");
}

function extractReferenceId(row: CsvRow): string | undefined {
  const possibleRefKeys = ["referenceid", "refno", "txnid", "utr", "chequeno", "referenceno"];
  for (const key of possibleRefKeys) {
    const val = getValue(row, key);
    if (val) return val;
  }
  return undefined;
}

export function normalizeRow(
  row: CsvRow,
  format: CsvFormat,
): NormalizeResult {
  let dateValue: string;
  let description: string;
  let amountValue: string;
  let transactionType: TransactionType;

  if (format === "STANDARD") {
    dateValue = getValue(row, "date");
    description = getValue(row, "description");

    const rawAmount = getValue(row, "amount");
    const type = getValue(row, "type").toUpperCase();

    if (type !== "DEBIT" && type !== "CREDIT") {
      return { success: false, error: "Invalid transaction type (must be DEBIT or CREDIT)." };
    }

    if (rawAmount.startsWith("-")) {
      return {
        success: false,
        error: "Standard CSV amounts must be non-negative; use the type column.",
      };
    }

    amountValue = rawAmount;
    transactionType = type as TransactionType;
  } else {
    dateValue = getValue(
      row,
      format === "BANK_A" ? "transactiondate" : "txndate",
    );

    description = getValue(
      row,
      format === "BANK_A" ? "narration" : "particulars",
    );

    const debit = getValue(
      row,
      format === "BANK_A" ? "debit" : "withdrawal",
    );

    const credit = getValue(
      row,
      format === "BANK_A" ? "credit" : "deposit",
    );

    if (debit && credit) {
      return {
        success: false,
        error: "Both debit and credit amounts are populated.",
      };
    }

    if (!debit && !credit) {
      return {
        success: false,
        error: "Both debit and credit amounts are empty.",
      };
    }

    amountValue = debit || credit;
    transactionType = debit ? "DEBIT" : "CREDIT";
  }

  const transactionDate = parseDate(dateValue, format);

  if (!transactionDate) {
    return { success: false, error: "Invalid or unsupported date format." };
  }

  if (!description) {
    return { success: false, error: "Transaction description is empty." };
  }

  const amount = parseAmount(amountValue);

  if (amount === null || Number(amount) <= 0) {
    return {
      success: false,
      error: "Amount must be positive and have at most two decimal places.",
    };
  }

  const normalizedDescription = normalizeDescription(description);

  if (!normalizedDescription) {
    return {
      success: false,
      error: "Description contains no usable characters.",
    };
  }

  const merchantMatch = identifyMerchant(description, normalizedDescription);
  const referenceId = extractReferenceId(row);

  return {
    success: true,
    transaction: {
      transactionDate,
      rawDescription: description,
      normalizedDescription,
      amount,
      currency:
        format === "STANDARD" ? getValue(row, "currency").toUpperCase() || "INR" : "INR",
      transactionType,
      referenceId,
      source: "CSV",
      merchantName: merchantMatch ? merchantMatch.canonicalName : undefined,
    },
  };
}