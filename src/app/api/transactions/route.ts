import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const typeFilter = searchParams.get("type");
    const sourceFilter = searchParams.get("source");

    const whereClause: Record<string, unknown> = {};
    if (typeFilter === "DEBIT" || typeFilter === "CREDIT") {
      whereClause.transactionType = typeFilter;
    }
    if (sourceFilter) {
      whereClause.importBatch = { source: sourceFilter };
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { transactionDate: "desc" },
        skip,
        take: limit,
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
      prisma.transaction.count({ where: whereClause }),
    ]);

    const formatted = transactions.map((t) => ({
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
      merchantCategory: t.merchant?.category ?? null,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      transactions: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch transactions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

