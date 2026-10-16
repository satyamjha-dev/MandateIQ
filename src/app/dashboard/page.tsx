"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  ReceiptText,
  FileCheck2,
  UploadCloud,
  ArrowRight,
  RefreshCw,
  Building2,
  AlertCircle,
} from "lucide-react";

type DashboardStats = {
  totalTransactions: number;
  totalBatches: number;
  totalDebits: string;
  totalCredits: string;
};

type RecentTransaction = {
  id: string;
  transactionDate: string;
  rawDescription: string;
  normalizedDescription: string;
  amount: string;
  currency: string;
  transactionType: "DEBIT" | "CREDIT";
  referenceId?: string;
  source: string;
  merchantName: string | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load dashboard data");
      }
      setStats(data.stats);
      setRecentTransactions(data.recentTransactions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated statement statistics and merchant identification overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all"
          >
            <UploadCloud className="h-4 w-4" />
            Import Statement
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State: No data imported */}
      {!loading && stats && stats.totalTransactions === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20">
            <ReceiptText className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white">No Statement Data Found</h3>
            <p className="text-sm text-slate-400">
              No financial statements have been imported into PostgreSQL yet. Upload a synthetic PDF receipt or CSV statement to populate the dashboard.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-all"
            >
              <UploadCloud className="h-4 w-4" />
              Import Statement Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Stats Display */}
      {stats && stats.totalTransactions > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Transactions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Transactions</span>
                <ReceiptText className="h-5 w-5 text-sky-400" />
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {stats.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">From {stats.totalBatches} statement batches</p>
              </div>
            </div>

            {/* Total Debits */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">Total Debits</span>
                <TrendingDown className="h-5 w-5 text-rose-400" />
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-rose-300 tracking-tight">
                  ₹{Number(stats.totalDebits).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Outflows & payments</p>
              </div>
            </div>

            {/* Total Credits */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Credits</span>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-emerald-300 tracking-tight">
                  ₹{Number(stats.totalCredits).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500 mt-1">Inflows & deposits</p>
              </div>
            </div>

            {/* Total Batches */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Import Batches</span>
                <FileCheck2 className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="mt-3">
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {stats.totalBatches}
                </p>
                <p className="text-xs text-slate-500 mt-1">Active files processed</p>
              </div>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
                <p className="text-xs text-slate-400">Latest imported financial records</p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
              >
                View full history &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5">Merchant</th>
                    <th className="px-5 py-3.5">Source</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400">
                        {formatDate(t.transactionDate)}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs sm:max-w-md truncate">
                        <p className="font-medium text-slate-200">{t.normalizedDescription}</p>
                        <p className="text-[11px] text-slate-500 truncate" title={t.rawDescription}>
                          {t.rawDescription}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {t.merchantName ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
                            <Building2 className="h-3 w-3" />
                            {t.merchantName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                            Unknown
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700/50">
                          {t.source}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span
                          className={`font-semibold font-mono ${
                            t.transactionType === "DEBIT" ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {t.transactionType === "DEBIT" ? "-" : "+"}₹{Number(t.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
