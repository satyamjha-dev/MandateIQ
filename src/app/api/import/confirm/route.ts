import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateTransaction } from "@/lib/validation";
import { seedMerchants } from "@/lib/merchants/seed";
import { identifyMerchant } from "@/lib/merchants/identify";
import { z } from "zod";
import type { ImportSource, NormalizedTransaction } from "@/types/transaction";

const confirmPayloadSchema = z.object({
  filename: z.string().min(1).max(255),
  source: z.enum(["BANK_STATEMENT", "GPAY", "PHONEPE", "CSV"]),
  transactions: z.array(z.any()).min(1, "At least one valid transaction must be confirmed"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedPayload = confirmPayloadSchema.safeParse(body);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid confirmation payload: " + parsedPayload.error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { filename, source, transactions: rawTransactions } = parsedPayload.data;

    // Server-side revalidation of every transaction (never trust client-submitted data blindly)
    const validTransactions: NormalizedTransaction[] = [];
    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];
      // Ensure transactionDate is converted back to Date object if stringified
      const candidate = {
        ...raw,
        transactionDate: new Date(raw.transactionDate),
        source: source as ImportSource,
      };

      const validation = validateTransaction(candidate);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: `Transaction at index ${i} failed server re-validation: ${validation.error}`,
          },
          { status: 422 }
        );
      }
      validTransactions.push(validation.transaction);
    }

    // Ensure database merchant reference is synced
    await seedMerchants();

    // Fetch existing merchants into map for fast lookup
    const dbMerchants = await prisma.merchant.findMany({
      select: { id: true, canonicalName: true },
    });
    const merchantMap = new Map(dbMerchants.map((m) => [m.canonicalName.toUpperCase(), m.id]));

    // Atomic persistence using Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ImportBatch record
      const batch = await tx.importBatch.create({
        data: {
          filename,
          source,
          status: "SUCCESS",
          transactionCount: validTransactions.length,
        },
      });

      // 2. Insert all transactions linked to batch
      const transactionData = validTransactions.map((t) => {
        // Resolve merchantId
        let merchantId: string | undefined = undefined;
        const merchantMatch = identifyMerchant(t.rawDescription, t.normalizedDescription);
        const resolvedName = t.merchantName || merchantMatch?.canonicalName;

        if (resolvedName) {
          merchantId = merchantMap.get(resolvedName.toUpperCase());
        }

        return {
          importBatchId: batch.id,
          transactionDate: t.transactionDate,
          rawDescription: t.rawDescription,
          normalizedDescription: t.normalizedDescription,
          amount: t.amount, // Prisma Decimal supports decimal string
          currency: t.currency,
          transactionType: t.transactionType,
          referenceId: t.referenceId ?? null,
          merchantId: merchantId ?? null,
        };
      });

      await tx.transaction.createMany({
        data: transactionData,
      });

      return batch;
    });

    return NextResponse.json({
      success: true,
      batchId: result.id,
      persistedCount: validTransactions.length,
      message: `Successfully imported and persisted ${validTransactions.length} transactions from "${filename}".`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Database transaction failed during persistence.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
