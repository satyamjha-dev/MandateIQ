export type TransactionType = "DEBIT" | "CREDIT";

export type ImportSource = "BANK_STATEMENT" | "GPAY" | "PHONEPE" | "CSV";

export type NormalizedTransaction = {
  transactionDate: Date;
  rawDescription: string;
  normalizedDescription: string;
  amount: string; // Decimal string (e.g. "564.00")
  currency: string;
  transactionType: TransactionType;
  referenceId?: string;
  source: ImportSource;
  merchantId?: string;
  merchantName?: string;
};

export type ParsedTransactionRow = {
  rowNumber: number;
  status: "VALID" | "INVALID" | "UNRECOGNIZED";
  transaction?: NormalizedTransaction;
  error?: string;
  rawText?: string;
};

export type ImportDraftResult = {
  filename: string;
  source: ImportSource;
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  rows: ParsedTransactionRow[];
  warnings: string[];
};

export type MerchantReferenceItem = {
  canonicalName: string;
  category: string;
  aliases: string[];
};

