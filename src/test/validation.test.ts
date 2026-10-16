import { describe, it, expect } from "vitest";
import { validateTransaction, normalizedAmountSchema } from "@/lib/validation";

describe("Transaction Validation", () => {
  it("validates a compliant normalized transaction", () => {
    const valid = {
      transactionDate: new Date("2026-09-01T00:00:00.000Z"),
      rawDescription: "Netflix.com payment",
      normalizedDescription: "NETFLIX.COM PAYMENT",
      amount: "499.00",
      currency: "INR",
      transactionType: "DEBIT",
      source: "CSV",
    };

    const res = validateTransaction(valid);
    expect(res.success).toBe(true);
  });

  it("rejects amount with invalid decimal precision or format", () => {
    expect(normalizedAmountSchema.safeParse("499").success).toBe(false); // missing .00
    expect(normalizedAmountSchema.safeParse("499.999").success).toBe(false); // 3 decimals
    expect(normalizedAmountSchema.safeParse("-50.00").success).toBe(false); // negative
    expect(normalizedAmountSchema.safeParse("0.00").success).toBe(false); // zero
    expect(normalizedAmountSchema.safeParse("499.00").success).toBe(true); // valid
  });

  it("rejects empty description or whitespace only", () => {
    const invalid = {
      transactionDate: new Date(),
      rawDescription: "",
      normalizedDescription: "VALID",
      amount: "100.00",
      currency: "INR",
      transactionType: "DEBIT",
      source: "CSV",
    };

    const res = validateTransaction(invalid);
    expect(res.success).toBe(false);
  });

  it("rejects invalid transaction type", () => {
    const invalid = {
      transactionDate: new Date(),
      rawDescription: "Some payment",
      normalizedDescription: "SOME PAYMENT",
      amount: "100.00",
      currency: "INR",
      transactionType: "UNKNOWN_TYPE",
      source: "CSV",
    };

    const res = validateTransaction(invalid);
    expect(res.success).toBe(false);
  });
});

