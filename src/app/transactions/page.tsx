"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ReceiptText,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Building2,
  AlertCircle,
  Hash,
} from "lucide-react";

type TransactionItem = {
  id: string;
  transactionDate: string;
  rawDescription: string;
  normalizedDescription: string;
  amount: string;
  currency: string;
  transactionType: "DEBIT" | "CREDIT";
  referenceId?: string;
  source: string;
  filename: string;
  merchantName: string | null;
  merchantCategory: string | null;
};

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (page: number, type: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/transactions?page=${page}&limit=20`;
      if (type !== "ALL") {
        url += `&type=${type}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load transactions");
      }
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(pagination.page, typeFilter);
  }, [pagination.page, typeFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleTypeChange = (newType: string) => {
    setTypeFilter(newType);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Transaction History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Persisted records with original narrations, normalized tokens, and identified merchants
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Type Filter Buttons */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
            {["ALL", "DEBIT", "CREDIT"].map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  typeFilter === type
                    ? "bg-slate-800 text-sky-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            Import Statement
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && transactions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <ReceiptText className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">No Transactions Found</h3>
            <p className="text-xs text-slate-400">
              {typeFilter !== "ALL"
                ? `No ${typeFilter.toLowerCase()} transactions match the selected filter.`
                : "No transaction records exist yet. Import a PDF statement or CSV file to get started."}
            </p>
          </div>
          {typeFilter === "ALL" && (
            <div className="pt-2">
              <Link
                href="/import"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all"
              >
                <UploadCloud className="h-4 w-4" />
                Import Statement
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Transactions Table */}
      {!loading && transactions.length > 0 && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Descriptions (Normalized & Raw)</th>
                  <th className="px-5 py-3.5">Merchant Identity</th>
                  <th className="px-5 py-3.5">Source & Reference</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400">
                      {formatDate(t.transactionDate)}
                    </td>

                    <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                      <p className="font-semibold text-slate-200">{t.normalizedDescription}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={t.rawDescription}>
                        <span className="text-slate-600 font-mono">raw:</span> {t.rawDescription}
                      </p>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {t.merchantName ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
                            <Building2 className="h-3.5 w-3.5" />
                            {t.merchantName}
                          </span>
                          {t.merchantCategory && (
                            <p className="text-[10px] text-slate-500">{t.merchantCategory}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-400 border border-slate-700/50">
                          Unknown
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700/40">
                          {t.source}
                        </span>
                        {t.referenceId && (
                          <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1" title={t.referenceId}>
                            <Hash className="h-3 w-3 text-slate-600" />
                            {t.referenceId.length > 18 ? t.referenceId.slice(0, 18) + "..." : t.referenceId}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="space-y-0.5">
                        <span
                          className={`font-semibold font-mono text-sm ${
                            t.transactionType === "DEBIT" ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {t.transactionType === "DEBIT" ? "-" : "+"}₹{Number(t.amount).toFixed(2)}
                        </span>
                        <p className="text-[10px] text-slate-500 uppercase">{t.transactionType}</p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-200">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-200">
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </span>{" "}
              of <span className="font-semibold text-slate-200">{pagination.totalCount}</span> records
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="px-2 font-mono">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
