import type { TransactionType } from "@/types/transaction";
import { identifyMerchant } from "@/lib/merchants/identify";
import { normalizeDescription, parseAmount } from "@/lib/csv/normalize-row";
import { parseFlexibleDate, type RawExtractedTransaction } from "./gpay-parser";

/**
 * Parses PhonePe transaction statement text (Format B).
 * Handles PhonePe receipts and transaction histories with UTRs and Transaction IDs.
 */
export function parsePhonePePdf(text: string): RawExtractedTransaction[] {
  const results: RawExtractedTransaction[] = [];

  // Split into candidate blocks if multiple receipts are present
  const blockDelimiters = /(?=(?:Paid to|Payment to|Debited from|Credited to|Transfer to))\b/gi;
  const blocks = text.split(blockDelimiters).filter((b) => b.trim().length > 15);

  const candidateBlocks = blocks.length > 0 ? blocks : [text];

  for (const block of candidateBlocks) {
    // 1. Description: e.g. "Paid to SAITM", "Debited from ... for Spotify"
    const descMatch =
      block.match(/(?:Paid to|Payment to|Transfer to|Debited from|Credited to)\s+([^\n\r]+)/i) ||
      block.match(/Description\s*:\s*([^\n\r]+)/i);

    const rawDescription = descMatch ? descMatch[0].trim() : "";

    // 2. Type: explicit "Type: DEBIT" or inferred
    const typeMatch = block.match(/Type\s*:\s*(DEBIT|CREDIT)/i);
    let transactionType: TransactionType = "DEBIT";

    if (typeMatch) {
      transactionType = typeMatch[1].toUpperCase() as TransactionType;
    } else if (/Credited to/i.test(rawDescription) || /Credit/i.test(block)) {
      transactionType = "CREDIT";
    }

    // 3. Amount: e.g. "INR 60,500", "Amount: INR 60,500", "₹ 60,500"
    // Be careful NOT to capture UTR (e.g. 479923133777) or masked account (6637) as amount!
    const amountMatch =
      block.match(/(?:Amount\s*:\s*)?(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
      block.match(/([\d,]+(?:\.\d{2}))\s*(?:INR|Rs\.?|₹)/i);

    // 4. Date: e.g. "Aug 29, 2026", "Date: Aug 29, 2026", "29 Aug 2026"
    const dateMatch =
      block.match(/(?:Date\s*:\s*)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i) ||
      block.match(/(?:Date\s*:\s*)?(\d{1,2}\s+[A-Za-z]+,?\s+\d{4})/i) ||
      block.match(/(?:Date\s*:\s*)?(\d{2}[-/.]\d{2}[-/.]\d{4})/i);

    // 5. Transaction ID and UTR
    const txnIdMatch = block.match(/Transaction\s*ID\s*:\s*(T[0-9A-Za-z]+)/i);
    const utrMatch = block.match(/UTR\s*:\s*(\d+)/i);

    let referenceId: string | undefined = undefined;
    if (txnIdMatch && utrMatch) {
      referenceId = `${txnIdMatch[1]} (UTR: ${utrMatch[1]})`;
    } else if (txnIdMatch) {
      referenceId = txnIdMatch[1];
    } else if (utrMatch) {
      referenceId = `UTR: ${utrMatch[1]}`;
    }

    if (!descMatch && !amountMatch && !dateMatch) {
      continue;
    }

    if (!rawDescription) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: "Missing transaction description in PhonePe block.",
      });
      continue;
    }

    if (!amountMatch) {
      results.push({
        rawText: block.trim().slice(0, 200),
        error: "Could not identify transaction amount in PhonePe block.",
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
        error: "Missing transaction date in PhonePe block.",
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
        source: "PHONEPE",
        merchantName: merchantMatch ? merchantMatch.canonicalName : undefined,
      },
    });
  }

  return results;
}
