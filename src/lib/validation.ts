import { z } from "zod";
import type { NormalizedTransaction } from "@/types/transaction";

export const transactionTypeSchema = z.enum(["DEBIT", "CREDIT"]);

export const importSourceSchema = z.enum(["BANK_STATEMENT", "GPAY", "PHONEPE", "CSV"]);

export const normalizedAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{2})$/, "Amount must be a valid non-negative decimal string with exactly two decimal places (e.g., 50.00)")
  .refine((val) => Number(val) > 0, "Amount must be strictly greater than zero");

export const transactionSchema = z.object({
  transactionDate: z.date({
    required_error: "Transaction date is required",
    invalid_type_error: "Invalid date format",
  }).refine((d) => !isNaN(d.getTime()), "Invalid date value"),
  rawDescription: z
    .string()
    .min(1, "Original description cannot be empty")
    .max(500, "Original description exceeds maximum length of 500 characters"),
  normalizedDescription: z
    .string()
    .min(1, "Normalized description cannot be empty")
    .max(500, "Normalized description exceeds maximum length of 500 characters"),
  amount: normalizedAmountSchema,
  currency: z
    .string()
    .min(3, "Currency must be a 3-letter code")
    .max(3, "Currency must be a 3-letter code")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase 3-letter code (e.g., INR)"),
  transactionType: transactionTypeSchema,
  referenceId: z.string().max(100).optional(),
  source: importSourceSchema,
  merchantId: z.string().optional(),
  merchantName: z.string().optional(),
});

export type ValidatedTransaction = z.infer<typeof transactionSchema>;

/**
 * Validates a normalized transaction against business and security rules.
 */
export function validateTransaction(
  data: unknown
): { success: true; transaction: NormalizedTransaction } | { success: false; error: string } {
  const result = transactionSchema.safeParse(data);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => e.message).join("; ");
    return { success: false, error: errorMsg };
  }
  return { success: true, transaction: result.data as NormalizedTransaction };
}
