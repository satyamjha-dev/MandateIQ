import { parsePdfStatement } from "@/lib/pdf/parse-pdf";
import { parseCsvTransactions } from "@/lib/csv/parse-csv";
import type { ImportDraftResult, ParsedTransactionRow, ImportSource } from "@/types/transaction";

export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type FileProcessingInput = {
  filename: string;
  mimeType?: string;
  buffer: Buffer | ArrayBuffer;
};

/**
 * Validates file signature, routes to the appropriate parser (PDF or CSV),
 * and formats the preview draft with clear distinction between valid and invalid rows.
 */
export async function processUploadedFile(
  input: FileProcessingInput
): Promise<ImportDraftResult> {
  const { filename, buffer } = input;
  const uint8Array = new Uint8Array(buffer);

  if (uint8Array.length === 0) {
    throw new Error("Uploaded file is empty (0 bytes).");
  }

  if (uint8Array.length > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new Error(
      `File size exceeds maximum permitted limit of ${MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
    );
  }

  const isPdf =
    uint8Array.length >= 4 &&
    uint8Array[0] === 0x25 && // %
    uint8Array[1] === 0x50 && // P
    uint8Array[2] === 0x44 && // D
    uint8Array[3] === 0x46; // F

  const isCsv =
    filename.toLowerCase().endsWith(".csv") ||
    input.mimeType === "text/csv" ||
    input.mimeType === "application/vnd.ms-excel";

  if (!isPdf && !isCsv) {
    throw new Error(
      "Unsupported file format. Please upload a PDF statement (.pdf) or supported CSV file (.csv)."
    );
  }

  const rows: ParsedTransactionRow[] = [];
  const warnings: string[] = [];
  let source: ImportSource = "CSV";

  if (isPdf) {
    const pdfResult = await parsePdfStatement(uint8Array);
    source = pdfResult.source;

    // Map successful transactions
    pdfResult.transactions.forEach((txn, idx) => {
      rows.push({
        rowNumber: idx + 1,
        status: "VALID",
        transaction: txn,
      });
    });

    // Map errors
    pdfResult.errors.forEach((err) => {
      rows.push({
        rowNumber: err.row,
        status: "INVALID",
        error: err.message,
        rawText: err.rawText,
      });
    });

    warnings.push(...pdfResult.warnings);
  } else {
    // CSV processing
    const textContent = new TextDecoder("utf-8").decode(uint8Array);
    const csvResult = parseCsvTransactions(textContent);
    source = "CSV";

    csvResult.transactions.forEach((txn, idx) => {
      rows.push({
        rowNumber: idx + 1,
        status: "VALID",
        transaction: txn,
      });
    });

    csvResult.errors.forEach((err) => {
      rows.push({
        rowNumber: err.row,
        status: "INVALID",
        error: err.message,
        rawText: err.rawText,
      });
    });
  }

  const validCount = rows.filter((r) => r.status === "VALID").length;
  const invalidCount = rows.filter((r) => r.status === "INVALID").length;

  return {
    filename,
    source,
    totalParsed: rows.length,
    validCount,
    invalidCount,
    rows,
    warnings,
  };
}

