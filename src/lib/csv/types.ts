import type { NormalizedTransaction, TransactionType, ImportSource } from "@/types/transaction";

export type { NormalizedTransaction, TransactionType, ImportSource };

export type CsvFormat = "STANDARD" | "BANK_A" | "BANK_B";

export type CsvImportError = {
  row: number;
  message: string;
  rawText?: string;
};

export type CsvParseResult = {
  format: CsvFormat;
  transactions: NormalizedTransaction[];
  errors: CsvImportError[];
};