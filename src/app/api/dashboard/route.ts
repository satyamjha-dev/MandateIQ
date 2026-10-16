import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalTransactions,
      totalBatches,
      debitAggregate,
      creditAggregate,
      recentTransactions,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.importBatch.count(),
      prisma.transaction.aggregate({
        where: { transactionType: "DEBIT" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { transactionType: "CREDIT" },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        orderBy: { transactionDate: "desc" },
        take: 8,
        include: {
          merchant: {
            select: {
              canonicalName: true,
              category: true,
            },
          },
          importBatch: {
            select: {
              filename: true,
              source: true,
            },
          },
        },
      }),
    ]);

    const totalDebits = debitAggregate._sum.amount
      ? debitAggregate._sum.amount.toFixed(2)
      : "0.00";

    const totalCredits = creditAggregate._sum.amount
      ? creditAggregate._sum.amount.toFixed(2)
      : "0.00";

    const formattedRecent = recentTransactions.map((t) => ({
      id: t.id,
      transactionDate: t.transactionDate.toISOString(),
      rawDescription: t.rawDescription,
      normalizedDescription: t.normalizedDescription,
      amount: t.amount.toFixed(2),
      currency: t.currency,
      transactionType: t.transactionType,
      referenceId: t.referenceId,
      source: t.importBatch.source,
      filename: t.importBatch.filename,
      merchantName: t.merchant?.canonicalName ?? null,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalTransactions,
        totalBatches,
        totalDebits,
        totalCredits,
      },
      recentTransactions: formattedRecent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard statistics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

