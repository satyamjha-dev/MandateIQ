import { extractPdfText } from "./extract-text";
import { identifyPdfLayout } from "./identify-layout";
import { parseGooglePayPdf } from "./parsers/gpay-parser";
import { parsePhonePePdf } from "./parsers/phonepe-parser";
import { parseBankStatementPdf } from "./parsers/bank-statement-parser";
import { validateTransaction } from "@/lib/validation";
import type { NormalizedTransaction, ImportSource } from "@/types/transaction";

export type PdfParseError = {
  row: number;
  message: string;
  rawText?: string;
};

export type PdfParseResult = {
  source: ImportSource;
  transactions: NormalizedTransaction[];
  errors: PdfParseError[];
  totalPages: number;
  warnings: string[];
};

/**
 * Main entry point for PDF statement processing.
 * Executes the full extraction pipeline:
 * 1. Extract text from PDF document
 * 2. Identify statement layout / provider
 * 3. Invoke source-specific parser
 * 4. Validate and normalize transactions
 * 5. Return structured preview data
 */
export async function parsePdfStatement(
  pdfBuffer: ArrayBuffer | Uint8Array | Buffer
): Promise<PdfParseResult> {
  const extraction = await extractPdfText(pdfBuffer);

  if (extraction.isScannedOrEmpty || extraction.error) {
    throw new Error(
      extraction.error ||
        "The uploaded PDF does not contain extractable text. Scanned documents require OCR."
    );
  }

  const detectedLayout = identifyPdfLayout(extraction.fullText);

  if (detectedLayout === "UNKNOWN") {
    throw new Error(
      "Unable to determine statement layout. Supported formats include Google Pay, PhonePe, and standard Indian Bank Statements."
    );
  }

  let rawExtracted: Array<{
    rawText: string;
    transaction?: NormalizedTransaction;
    error?: string;
  }> = [];

  switch (detectedLayout) {
    case "GPAY":
      rawExtracted = parseGooglePayPdf(extraction.fullText);
      break;
    case "PHONEPE":
      rawExtracted = parsePhonePePdf(extraction.fullText);
      break;
    case "BANK_STATEMENT":
      rawExtracted = parseBankStatementPdf(extraction.fullText);
      break;
  }

  if (rawExtracted.length === 0) {
    throw new Error(
      `Detected ${detectedLayout} statement layout, but found no identifiable transaction records.`
    );
  }

  const transactions: NormalizedTransaction[] = [];
  const errors: PdfParseError[] = [];
  const warnings: string[] = [];

  rawExtracted.forEach((item, index) => {
    const rowNum = index + 1;

    if (item.error || !item.transaction) {
      errors.push({
        row: rowNum,
        message: item.error || "Failed to extract complete transaction data.",
        rawText: item.rawText,
      });
      return;
    }

    const validation = validateTransaction(item.transaction);
    if (!validation.success) {
      errors.push({
        row: rowNum,
        message: validation.error,
        rawText: item.rawText,
      });
      return;
    }

    transactions.push(validation.transaction);
  });

  return {
    source: detectedLayout,
    transactions,
    errors,
    totalPages: extraction.totalPages,
    warnings,
  };
}

