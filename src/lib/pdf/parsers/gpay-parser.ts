import type { NormalizedTransaction, TransactionType } from "@/types/transaction";
import { identifyMerchant } from "@/lib/merchants/identify";
import { normalizeDescription, parseAmount } from "@/lib/csv/normalize-row";

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.replace(/,/g, " ").trim();

  // Pattern: "24 Aug 2026" or "24 August 2026"
  const dayMonthYear = clean.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dayMonthYear) {
    const day = Number(dayMonthYear[1]);
    const month = MONTH_MAP[dayMonthYear[2].toLowerCase()] ?? 0;
    const year = Number(dayMonthYear[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // Pattern: "Aug 24 2026" or "August 24 2026"
  const monthDayYear = clean.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})/);
  if (monthDayYear) {
    const month = MONTH_MAP[monthDayYear[1].toLowerCase()] ?? 0;
    const day = Number(monthDayYear[2]);
    const year = Number(monthDayYear[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // Pattern: "24-08-2026" or "24/08/2026"
  const dmyNumeric = clean.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})/);
  if (dmyNumeric) {
    const day = Number(dmyNumeric[1]);
    const month = Number(dmyNumeric[2]);
    const year = Number(dmyNumeric[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  // Pattern: "2026-08-24"
  const ymdNumeric = clean.match(/^(\d{4})[-/.](\d{2})[-/.](\d{2})/);
  if (ymdNumeric) {
    const year = Number(ymdNumeric[1]);
    const month = Number(ymdNumeric[2]);
    const day = Number(ymdNumeric[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }

  return null;
}

export type RawExtractedTransaction = {
  rawText: string;
  transaction?: NormalizedTransaction;
  error?: string;
};

/**
 * Parses Google Pay transaction statement text (Format A).
 * Handles both single-receipt PDFs and multi-transaction lists.
 */
export function parseGooglePayPdf(text: string): RawExtractedTransaction[] {
  const results: RawExtractedTransaction[] = [];

  // Split into candidate blocks if multiple receipts are present
  // Typical delimiters in GPay: "Paid to", "Payment to", "Received from"
  const blockDelimiters = /(?=(?:Paid to|Payment to|Received from|Money sent to))\b/gi;
  const blocks = text.split(blockDelimiters).filter((b) => b.trim().length > 15);

  const candidateBlocks = blocks.length > 0 ? blocks : [text];

  for (const block of candidateBlocks) {
    // 1. Description: e.g. "Paid to Manjeet", "Payment to Spotify", "Received from Alice"
    const descMatch =
      block.match(/(?:Paid to|Payment to|Money sent to|Received from)\s+([^\n\r]+)/i) ||
      block.match(/Description\s*:\s*([^\n\r]+)/i);

    const rawDescription = descMatch ? descMatch[0].trim() : "";

    // 2. Transaction Type
    const isCredit = /Received from/i.test(rawDescription) || /Credit/i.test(block);
    const transactionType: TransactionType = isCredit ? "CREDIT" : "DEBIT";

    // 3. Amount: e.g. "INR 564", "₹ 564", "Amount: INR 564", "₹564.00"
    const amountMatch =
      block.match(/(?:Amount\s*:\s*)?(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
      block.match(/([\d,]+(?:\.\d{2}))\s*(?:INR|Rs\.?|₹)/i);

    // 4. Date: e.g. "Date: 24 Aug, 2026" or "24 Aug, 2026" or "Aug 24, 2026"
    const dateMatch =
      block.match(/(?:Date\s*:\s*)?(\d{1,2}\s+[A-Za-z]+,?\s+\d{4})/i) ||
      block.match(/(?:Date\s*:\s*)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
      block.match(/(?:Date\s*:\s*)?(\d{2}[-/.]\d{2}[-/.]\d{4})/i);

    // 5. Reference ID: e.g. "UPI Transaction ID: 623660426874"
    const refMatch =
      block.match(/UPI\s*(?:Transaction\s*)?ID\s*:\s*(\w+)/i) ||
      block.match(/Google\s*Transaction\s*ID\s*:\s*(\w+)/i) ||
      block.match(/Transaction\s*ID\s*:\s*(\w+)/i);

    const referenceId = refMatch ? refMatch[1].trim() : undefined;

    if (!descMatch && !amountMatch && !dateMatch) {
      continue; // Skip non-transaction text blocks (headers, footers)
    }

    if (!rawDescription) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: "Missing transaction description in Google Pay block.",
      });
      continue;
    }

    if (!amountMatch) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: "Could not identify transaction amount in Google Pay block.",
      });
      continue;
    }

    const rawAmt = amountMatch[1].replace(/,/g, "");
    const normalizedAmount = parseAmount(rawAmt);

    if (!normalizedAmount || Number(normalizedAmount) <= 0) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: `Invalid transaction amount: "${amountMatch[1]}"`,
      });
      continue;
    }

    if (!dateMatch) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: "Missing transaction date in Google Pay block.",
      });
      continue;
    }

    const parsedDate = parseFlexibleDate(dateMatch[1]);
    if (!parsedDate) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: `Unsupported or invalid date format: "${dateMatch[1]}"`,
      });
      continue;
    }

    const normalizedDescription = normalizeDescription(rawDescription);
    const merchantMatch = identifyMerchant(rawDescription, normalizedDescription);

    results.push({
      rawText: block.trim().slice(0, 200),
      transaction: {
        transactionDate: parsedDate,
        rawDescription,
        normalizedDescription,
        amount: normalizedAmount,
        currency: "INR",
        transactionType,
        referenceId,
        source: "GPAY",
        merchantName: merchantMatch ? merchantMatch.canonicalName : undefined,
      },
    });
  }

  return results;
}

