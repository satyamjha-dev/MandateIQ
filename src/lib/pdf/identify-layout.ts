import type { ImportSource } from "@/types/transaction";

export type DetectedPdfLayout = ImportSource | "UNKNOWN";

/**
 * Identifies the statement source and layout by analyzing textual cues,
 * application identifiers, and layout structural markers.
 */
export function identifyPdfLayout(text: string): DetectedPdfLayout {
  if (!text || !text.trim()) {
    return "UNKNOWN";
  }

  const lower = text.toLowerCase();

  // 1. Google Pay check
  const hasGpayBrand = lower.includes("google pay") || lower.includes("gpay");
  const hasGpayTokens =
    (lower.includes("paid to") || lower.includes("received from") || lower.includes("payment to")) &&
    (lower.includes("upi transaction id") || lower.includes("google transaction id"));

  if (hasGpayBrand || hasGpayTokens) {
    return "GPAY";
  }

  // 2. PhonePe check
  const hasPhonePeBrand = lower.includes("phonepe");
  const hasPhonePeTokens =
    /transaction\s*id\s*:\s*t[0-9a-z]+/i.test(text) ||
    (/utr\s*:\s*\d+/i.test(text) && (lower.includes("paid to") || lower.includes("debited from")));

  if (hasPhonePeBrand || hasPhonePeTokens) {
    return "PHONEPE";
  }

  // 3. Bank Statement check
  const hasBankKeywords =
    lower.includes("statement of account") ||
    lower.includes("account statement") ||
    (lower.includes("balance") && (lower.includes("debit") || lower.includes("withdrawal") || lower.includes("credit"))) ||
    /upi\/(dr|cr)\/\d+/i.test(text) ||
    (lower.includes("narration") && (lower.includes("withdrawal") || lower.includes("deposit")));

  // Pattern with date followed by amount, debit/credit and balance
  const hasBankLinePattern =
    /\d{2}[-/.]\d{2}[-/.]\d{4}.*?(inr|rs\.?|\₹)?\s*\d+(\.\d{2})?\s+(debit|credit|dr|cr).*?balance/i.test(text);

  if (hasBankKeywords || hasBankLinePattern) {
    return "BANK_STATEMENT";
  }

  return "UNKNOWN";
}

