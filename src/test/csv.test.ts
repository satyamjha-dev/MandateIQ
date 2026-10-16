import { describe, it, expect } from "vitest";
import { detectCsvFormat } from "@/lib/csv/detect-format";
import { parseCsv, parseCsvTransactions } from "@/lib/csv/parse-csv";
import { normalizeRow } from "@/lib/csv/normalize-row";

describe("CSV Parsing and Format Detection", () => {
  it("detects Standard CSV format", () => {
    const headers = ["date", "description", "amount", "type", "currency"];
    expect(detectCsvFormat(headers)).toBe("STANDARD");
  });

  it("detects Bank A CSV format", () => {
    const headers = ["Transaction Date", "Narration", "Debit", "Credit"];
    expect(detectCsvFormat(headers)).toBe("BANK_A");
  });

  it("detects Bank B CSV format", () => {
    const headers = ["Txn Date", "Particulars", "Withdrawal", "Deposit"];
    expect(detectCsvFormat(headers)).toBe("BANK_B");
  });

  it("throws for unsupported headers", () => {
    const headers = ["UnknownCol1", "UnknownCol2"];
    expect(() => detectCsvFormat(headers)).toThrow(/Unsupported CSV format/);
  });

  it("throws on duplicate headers", () => {
    const duplicateCsv = "date,description,amount,amount,type,currency\n2026-09-01,Netflix,499,499,DEBIT,INR";
    expect(() => parseCsv(duplicateCsv)).toThrow(/duplicate column headers/);
  });
});

describe("CSV Normalization", () => {
  it("normalizes Standard CSV row correctly", () => {
    const row = {
      date: "2026-09-01",
      description: "NETFLIX.COM",
      amount: "499.00",
      type: "DEBIT",
      currency: "INR",
    };
    const result = normalizeRow(row, "STANDARD");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.transaction.amount).toBe("499.00");
      expect(result.transaction.transactionType).toBe("DEBIT");
      expect(result.transaction.normalizedDescription).toBe("NETFLIX.COM");
      expect(result.transaction.merchantName).toBe("Netflix");
    }
  });

  it("normalizes Bank A debit and credit rows correctly", () => {
    const debitRow = {
      "Transaction Date": "01/09/2026",
      "Narration": "SPOTIFY INDIA",
      "Debit": "119.00",
      "Credit": "",
    };
    const debitRes = normalizeRow(debitRow, "BANK_A");
    expect(debitRes.success).toBe(true);
    if (debitRes.success) {
      expect(debitRes.transaction.amount).toBe("119.00");
      expect(debitRes.transaction.transactionType).toBe("DEBIT");
      expect(debitRes.transaction.merchantName).toBe("Spotify");
    }

    const creditRow = {
      "Transaction Date": "05/09/2026",
      "Narration": "SALARY CREDIT ACME",
      "Debit": "",
      "Credit": "45000.00",
    };
    const creditRes = normalizeRow(creditRow, "BANK_A");
    expect(creditRes.success).toBe(true);
    if (creditRes.success) {
      expect(creditRes.transaction.amount).toBe("45000.00");
      expect(creditRes.transaction.transactionType).toBe("CREDIT");
    }
  });

  it("normalizes Bank B row with quoted amounts and DD-Mon-YYYY dates", () => {
    const row = {
      "Txn Date": "01-Sep-2026",
      "Particulars": "AMAZON PRIME SUBSCRIPTION",
      "Withdrawal": "1499.00",
      "Deposit": "",
    };
    const result = normalizeRow(row, "BANK_B");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.transaction.amount).toBe("1499.00");
      expect(result.transaction.transactionType).toBe("DEBIT");
      expect(result.transaction.merchantName).toBe("Amazon");
      expect(result.transaction.transactionDate.getUTCMonth()).toBe(8); // September (0-indexed)
    }
  });

  it("rejects row when both debit and credit are populated", () => {
    const row = {
      "Transaction Date": "01/09/2026",
      "Narration": "ERRONEOUS ENTRY",
      "Debit": "100.00",
      "Credit": "100.00",
    };
    const res = normalizeRow(row, "BANK_A");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toMatch(/Both debit and credit amounts are populated/);
    }
  });

  it("rejects negative amount in Standard CSV", () => {
    const row = {
      date: "2026-09-01",
      description: "INVALID AMOUNT",
      amount: "-50.00",
      type: "DEBIT",
      currency: "INR",
    };
    const res = normalizeRow(row, "STANDARD");
    expect(res.success).toBe(false);
  });
});

describe("Complete CSV Ingestion Pipeline", () => {
  it("parses multi-row CSV, identifying valid and invalid rows", () => {
    const csvContent = `date,description,amount,type,currency
2026-09-01,NETFLIX,499.00,DEBIT,INR
invalid-date,BROKEN ROW,100.00,DEBIT,INR
2026-09-05,SALARY,45000.00,CREDIT,INR`;

    const result = parseCsvTransactions(csvContent);
    expect(result.transactions).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3); // line 3 in CSV
  });
});

