import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parsePdfStatement } from "@/lib/pdf/parse-pdf";
import { extractPdfText } from "@/lib/pdf/extract-text";
import { identifyPdfLayout } from "@/lib/pdf/identify-layout";
import { parseGooglePayPdf } from "@/lib/pdf/parsers/gpay-parser";
import { parsePhonePePdf } from "@/lib/pdf/parsers/phonepe-parser";
import { parseBankStatementPdf } from "@/lib/pdf/parsers/bank-statement-parser";

const samplesDir = path.join(process.cwd(), "public/samples");

describe("PDF Text Extraction & Layout Identification", () => {
  it("extracts text from synthetic Google Pay PDF", async () => {
    const buffer = fs.readFileSync(path.join(samplesDir, "gpay-sample.pdf"));
    const result = await extractPdfText(buffer);
    expect(result.isScannedOrEmpty).toBe(false);
    expect(result.fullText).toContain("Google Pay");
    expect(result.fullText).toContain("623660426874");
  });

  it("identifies Google Pay layout accurately", () => {
    const text = "Google Pay Transaction Receipt Paid to Manjeet Amount: INR 564 UPI Transaction ID: 623660426874";
    expect(identifyPdfLayout(text)).toBe("GPAY");
  });

  it("identifies PhonePe layout accurately", () => {
    const text = "PhonePe Transaction Statement Paid to SAITM Type: DEBIT Transaction ID: T2608291609522447721902 UTR: 479923133777";
    expect(identifyPdfLayout(text)).toBe("PHONEPE");
  });

  it("identifies Bank Statement layout accurately", () => {
    const text = "Statement of Account Date: 01-04-2026 Amount: INR 50.00 Type: DEBIT Balance: INR 99016.09 Description: UPI/DR/073479210545";
    expect(identifyPdfLayout(text)).toBe("BANK_STATEMENT");
  });

  it("returns UNKNOWN for unrecognized layouts", () => {
    const text = "Random document about weather forecast in Delhi tomorrow.";
    expect(identifyPdfLayout(text)).toBe("UNKNOWN");
  });

  it("detects scanned/empty PDFs and requires OCR", async () => {
    const buffer = fs.readFileSync(path.join(samplesDir, "empty-scanned-sample.pdf"));
    const result = await extractPdfText(buffer);
    expect(result.isScannedOrEmpty).toBe(true);
    expect(result.error).toMatch(/OCR/i);
  });
});

describe("Format A: Google Pay Parser", () => {
  it("parses Format A synthetic transaction correctly", () => {
    const text = `Google Pay
Paid to Manjeet
Amount: INR 564
Date: 24 Aug, 2026
UPI Transaction ID: 623660426874
Payment source: Kotak Mahindra Bank 0667`;

    const parsed = parseGooglePayPdf(text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].transaction).toBeDefined();

    const t = parsed[0].transaction!;
    expect(t.rawDescription).toContain("Paid to Manjeet");
    expect(t.amount).toBe("564.00");
    expect(t.transactionType).toBe("DEBIT");
    expect(t.referenceId).toBe("623660426874");
    expect(t.source).toBe("GPAY");
    expect(t.currency).toBe("INR");
  });

  it("parses multiple transactions in Google Pay PDF", async () => {
    const buffer = fs.readFileSync(path.join(samplesDir, "gpay-sample.pdf"));
    const result = await parsePdfStatement(buffer);

    expect(result.source).toBe("GPAY");
    expect(result.transactions.length).toBeGreaterThanOrEqual(2);

    const first = result.transactions[0];
    expect(first.amount).toBe("564.00");
    expect(first.referenceId).toBe("623660426874");

    const second = result.transactions[1];
    expect(second.amount).toBe("499.00");
    expect(second.merchantName).toBe("Netflix");
  });
});

describe("Format B: PhonePe Parser", () => {
  it("parses Format B synthetic transaction preserving UTR and TxnID", () => {
    const text = `PhonePe Transaction Statement
Paid to SAITM
Type: DEBIT
Amount: INR 60,500
Date: Aug 29, 2026
Transaction ID: T2608291609522447721902
UTR: 479923133777
Payment source: masked account ending in 6637`;

    const parsed = parsePhonePePdf(text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].transaction).toBeDefined();

    const t = parsed[0].transaction!;
    expect(t.rawDescription).toContain("Paid to SAITM");
    expect(t.amount).toBe("60500.00"); // comma stripped!
    expect(t.transactionType).toBe("DEBIT");
    expect(t.referenceId).toContain("T2608291609522447721902");
    expect(t.referenceId).toContain("479923133777");
    expect(t.source).toBe("PHONEPE");
  });

  it("parses multiple transactions in PhonePe PDF including merchants", async () => {
    const buffer = fs.readFileSync(path.join(samplesDir, "phonepe-sample.pdf"));
    const result = await parsePdfStatement(buffer);

    expect(result.source).toBe("PHONEPE");
    expect(result.transactions.length).toBeGreaterThanOrEqual(2);

    const saitmTxn = result.transactions[0];
    expect(saitmTxn.amount).toBe("60500.00");

    const spotifyTxn = result.transactions[1];
    expect(spotifyTxn.amount).toBe("119.00");
    expect(spotifyTxn.merchantName).toBe("Spotify");
  });
});

describe("Format C: Bank Statement Parser", () => {
  it("isolates transaction amount from running balance in Format C", () => {
    const text = `Statement of Account
Date: 01-04-2026 Amount: INR 50.00 Type: DEBIT Balance: INR 99016.09 Description: UPI/DR/073479210545/Mr YASH/CBIN/8010057938axl/Pa`;

    const parsed = parseBankStatementPdf(text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].transaction).toBeDefined();

    const t = parsed[0].transaction!;
    expect(t.amount).toBe("50.00");
    // Ensure balance (99016.09) was NOT mistaken for transaction amount!
    expect(t.amount).not.toBe("99016.09");
    expect(t.transactionType).toBe("DEBIT");
    expect(t.referenceId).toBe("073479210545"); // Extracted UPI RRN
    expect(t.rawDescription).toBe("UPI/DR/073479210545/Mr YASH/CBIN/8010057938axl/Pa");
  });

  it("parses multiple transactions in synthetic Bank Statement PDF", async () => {
    const buffer = fs.readFileSync(path.join(samplesDir, "bank-statement-sample.pdf"));
    const result = await parsePdfStatement(buffer);

    expect(result.source).toBe("BANK_STATEMENT");
    expect(result.transactions).toHaveLength(3);

    expect(result.transactions[0].amount).toBe("50.00");
    expect(result.transactions[1].amount).toBe("499.00");
    expect(result.transactions[1].merchantName).toBe("Netflix");
    expect(result.transactions[2].amount).toBe("45000.00");
    expect(result.transactions[2].transactionType).toBe("CREDIT");
  });
});

