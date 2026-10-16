import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { seedMerchants } from "@/lib/merchants/seed";

describe("Database Persistence & Prisma Models", () => {
  it("seeds curated merchants into PostgreSQL", async () => {
    await seedMerchants();

    const netflix = await prisma.merchant.findUnique({
      where: { canonicalName: "Netflix" },
      include: { aliases: true },
    });

    expect(netflix).not.toBeNull();
    expect(netflix?.canonicalName).toBe("Netflix");
    expect(netflix?.aliases.length).toBeGreaterThan(0);
  });

  it("persists an ImportBatch and linked Transactions", async () => {
    const netflixMerchant = await prisma.merchant.findUnique({
      where: { canonicalName: "Netflix" },
    });

    // Create an import batch
    const batch = await prisma.importBatch.create({
      data: {
        filename: "test-statement.pdf",
        source: "BANK_STATEMENT",
        status: "SUCCESS",
        transactionCount: 2,
        transactions: {
          create: [
            {
              transactionDate: new Date("2026-04-01T00:00:00Z"),
              rawDescription: "NETFLIX.COM ENTERTAINMENT",
              normalizedDescription: "NETFLIX.COM ENTERTAINMENT",
              amount: "499.00",
              currency: "INR",
              transactionType: "DEBIT",
              referenceId: "REF12345",
              merchantId: netflixMerchant?.id,
            },
            {
              transactionDate: new Date("2026-04-05T00:00:00Z"),
              rawDescription: "SALARY ACME CORP",
              normalizedDescription: "SALARY ACME CORP",
              amount: "45000.00",
              currency: "INR",
              transactionType: "CREDIT",
              referenceId: "SAL9999",
            },
          ],
        },
      },
      include: {
        transactions: true,
      },
    });

    expect(batch.id).toBeDefined();
    expect(batch.transactions).toHaveLength(2);

    const debitTxn = batch.transactions.find((t) => t.transactionType === "DEBIT");
    expect(debitTxn).toBeDefined();
    expect(debitTxn?.amount.toFixed(2)).toBe("499.00");
    expect(debitTxn?.merchantId).toBe(netflixMerchant?.id);

    // Clean up test batch
    await prisma.importBatch.delete({
      where: { id: batch.id },
    });
  });
});

