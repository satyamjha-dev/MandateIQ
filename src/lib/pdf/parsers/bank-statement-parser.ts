import type { TransactionType } from "@/types/transaction";
import { identifyMerchant } from "@/lib/merchants/identify";
import { normalizeDescription, parseAmount } from "@/lib/csv/normalize-row";
import { parseFlexibleDate, type RawExtractedTransaction } from "./gpay-parser";

/**
 * Extracts UPI or bank reference numbers from Indian banking narrations.
 * e.g., "UPI/DR/073479210545/Mr YASH/CBIN/8010057938axl/Pa" -> "073479210545"
 */
function extractBankReferenceId(narration: string): string | undefined {
  const upiMatch = narration.match(/UPI\/(?:DR|CR)\/(\d+)/i);
  if (upiMatch) return upiMatch[1];

  const refMatch = narration.match(/(?:REF|RRN|IMPS|NEFT)[\s/:-]*([A-Za-z0-9]{8,22})/i);
  if (refMatch) return refMatch[1];

  return undefined;
}

/**
 * Parses Bank Statement PDF text (Format C and standard Indian tabular statements).
 * Accurately isolates transaction amounts from running balances and extracts UPI/RRN references.
 */
export function parseBankStatementPdf(text: string): RawExtractedTransaction[] {
  const results: RawExtractedTransaction[] = [];

  // Lines in the text
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Buffer for multi-line transactions
  let currentTxn: {
    dateStr: string;
    amountStr?: string;
    type?: TransactionType;
    balanceStr?: string;
    descriptionParts: string[];
    rawLines: string[];
  } | null = null;

  const commitCurrentTxn = () => {
    if (!currentTxn) return;

    const { dateStr, amountStr, type, descriptionParts, rawLines } = currentTxn;
    const rawText = rawLines.join(" ");
    const rawDescription = descriptionParts.join(" ").trim();

    if (!rawDescription && !amountStr) {
      currentTxn = null;
      return;
    }

    if (!amountStr) {
      results.push({
        rawText,
        error: "Missing transaction amount in bank statement row.",
      });
      currentTxn = null;
      return;
    }

    const normalizedAmount = parseAmount(amountStr.replace(/,/g, ""));
    if (!normalizedAmount || Number(normalizedAmount) <= 0) {
      results.push({
        rawText,
        error: `Invalid transaction amount: "${amountStr}"`,
      });
      currentTxn = null;
      return;
    }

    const parsedDate = parseFlexibleDate(dateStr);
    if (!parsedDate) {
      results.push({
        rawText,
        error: `Invalid date: "${dateStr}"`,
      });
      currentTxn = null;
      return;
    }

    if (!rawDescription) {
      results.push({
        rawText,
        error: "Missing transaction description / narration.",
      });
      currentTxn = null;
      return;
    }

    const transactionType: TransactionType = type ?? "DEBIT";
    const normalizedDescription = normalizeDescription(rawDescription);
    const merchantMatch = identifyMerchant(rawDescription, normalizedDescription);
    const referenceId = extractBankReferenceId(rawDescription);

    results.push({
      rawText,
      transaction: {
        transactionDate: parsedDate,
        rawDescription,
        normalizedDescription,
        amount: normalizedAmount,
        currency: "INR",
        transactionType,
        referenceId,
        source: "BANK_STATEMENT",
        merchantName: merchantMatch ? merchantMatch.canonicalName : undefined,
      },
    });

    currentTxn = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line starts a new transaction with a date
    const dateMatch = line.match(/^(?:Date\s*:\s*)?(\d{2}[-/.]\d{2}[-/.]\d{4}|\d{2}-[A-Za-z]{3}-\d{4})/i);

    if (dateMatch) {
      // Commit previous transaction if one was buffered
      commitCurrentTxn();

      const dateStr = dateMatch[1];
      const remainder = line.slice(dateMatch[0].length).trim();

      // Check for Format C explicit labels:
      // "Amount: INR 50.00 Type: DEBIT Balance: INR 99016.09 Description: ..."
      const explicitAmtMatch = remainder.match(/Amount\s*:\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
      const explicitTypeMatch = remainder.match(/Type\s*:\s*(DEBIT|CREDIT|DR|CR)/i);
      const explicitBalMatch = remainder.match(/Balance\s*:\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
      const explicitDescMatch = remainder.match(/Description\s*:\s*(.+)$/i);

      if (explicitAmtMatch) {
        let type: TransactionType = "DEBIT";
        if (explicitTypeMatch) {
          const t = explicitTypeMatch[1].toUpperCase();
          type = t === "CREDIT" || t === "CR" ? "CREDIT" : "DEBIT";
        }

        const desc = explicitDescMatch
          ? explicitDescMatch[1].trim()
          : remainder
              .replace(/Amount\s*:\s*(?:INR|Rs\.?|₹)?\s*[\d,]+(?:\.\d{1,2})?/i, "")
              .replace(/Type\s*:\s*(DEBIT|CREDIT|DR|CR)/i, "")
              .replace(/Balance\s*:\s*(?:INR|Rs\.?|₹)?\s*[\d,]+(?:\.\d{1,2})?/i, "")
              .trim();

        currentTxn = {
          dateStr,
          amountStr: explicitAmtMatch[1],
          type,
          balanceStr: explicitBalMatch ? explicitBalMatch[1] : undefined,
          descriptionParts: desc ? [desc] : [],
          rawLines: [line],
        };
        continue;
      }

      // Tabular line matching:
      // e.g. "INR 50.00 DEBIT INR 99016.09 UPI/DR/073479210545/..."
      // or "NETFLIX 499.00 DR 12000.00"
      const inlineMatch = remainder.match(
        /(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{2}))\s+(DEBIT|CREDIT|DR|CR)\s+(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{2}))\s+(.+)/i
      );

      if (inlineMatch) {
        const rawAmt = inlineMatch[1];
        const rawType = inlineMatch[2].toUpperCase();
        const type: TransactionType = rawType === "CREDIT" || rawType === "CR" ? "CREDIT" : "DEBIT";
        const balance = inlineMatch[3]; // isolated running balance!
        const desc = inlineMatch[4].trim();

        currentTxn = {
          dateStr,
          amountStr: rawAmt,
          type,
          balanceStr: balance,
          descriptionParts: [desc],
          rawLines: [line],
        };
        continue;
      }

      // Check alternate columnar: description first, then debit/credit, then balance
      // e.g. "UPI/DR/073479210545/... 50.00 0.00 99016.09"
      const colMatch = remainder.match(/(.*?)\s+([\d,]+(?:\.\d{2}))\s+(?:([\d,]+(?:\.\d{2}))\s+)?([\d,]+(?:\.\d{2}))$/);
      if (colMatch) {
        const desc = colMatch[1].trim();
        const debitAmt = colMatch[2];
        const creditAmt = colMatch[3];
        const isDebit = Number(debitAmt.replace(/,/g, "")) > 0;

        currentTxn = {
          dateStr,
          amountStr: isDebit ? debitAmt : creditAmt,
          type: isDebit ? "DEBIT" : "CREDIT",
          descriptionParts: [desc],
          rawLines: [line],
        };
        continue;
      }

      // Generic fallback start of transaction
      currentTxn = {
        dateStr,
        descriptionParts: [remainder],
        rawLines: [line],
      };
    } else if (currentTxn) {
      // Continuation line (wrapped description or metadata)
      // Check if this continuation line contains an amount or type that was on a new line
      const explicitAmt = line.match(/(?:Amount\s*:\s*|INR\s*|₹\s*)([\d,]+(?:\.\d{1,2})?)/i);
      const explicitType = line.match(/\b(DEBIT|CREDIT|DR|CR)\b/i);

      if (!currentTxn.amountStr && explicitAmt) {
        currentTxn.amountStr = explicitAmt[1];
      }
      if (!currentTxn.type && explicitType) {
        const t = explicitType[1].toUpperCase();
        currentTxn.type = t === "CREDIT" || t === "CR" ? "CREDIT" : "DEBIT";
      }

      // Clean line from headers or footers
      if (!/page \d+ of \d+/i.test(line) && !/statement summary/i.test(line)) {
        currentTxn.descriptionParts.push(line);
        currentTxn.rawLines.push(line);
      }
    }
  }

  // Commit the last transaction
  commitCurrentTxn();

  return results;
}
