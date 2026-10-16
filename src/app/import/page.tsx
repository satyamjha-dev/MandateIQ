"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  RefreshCw,
  Download,
  AlertCircle,
  Hash,
} from "lucide-react";
import type { ImportDraftResult } from "@/types/transaction";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImportDraftResult | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<{
    batchId: string;
    persistedCount: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setDraft(null);
    setConfirmSuccess(null);

    // Basic frontend check before upload
    const validExtensions = [".pdf", ".csv"];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError("Please select a PDF statement (.pdf) or supported CSV file (.csv).");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds maximum upload limit of 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract statement transactions");
      }

      setDraft(data.draft);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error parsing statement file");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!draft) return;

    const validRows = draft.rows
      .filter((r) => r.status === "VALID" && r.transaction)
      .map((r) => r.transaction!);

    if (validRows.length === 0) {
      setError("No valid transactions found to confirm.");
      return;
    }

    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: draft.filename,
          source: draft.source,
          transactions: validRows,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Persistence failed");
      }

      setConfirmSuccess({
        batchId: data.batchId,
        persistedCount: data.persistedCount,
        message: data.message,
      });
      setDraft(null);
      setFile(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error confirming import");
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setDraft(null);
    setError(null);
    setConfirmSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return "";
    const d = new Date(dateValue);
    return isNaN(d.getTime())
      ? String(dateValue)
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const sampleFiles = [
    { name: "gpay-sample.pdf", label: "Google Pay (Format A)", type: "PDF" },
    { name: "phonepe-sample.pdf", label: "PhonePe (Format B)", type: "PDF" },
    { name: "bank-statement-sample.pdf", label: "Bank Statement (Format C)", type: "PDF" },
    { name: "standard-sample.csv", label: "Standard CSV", type: "CSV" },
    { name: "bank-a-sample.csv", label: "Bank A (Debit/Credit)", type: "CSV" },
    { name: "bank-b-sample.csv", label: "Bank B (DD-Mon-YYYY)", type: "CSV" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Import Financial Statement
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload PDF receipts (Google Pay, PhonePe, Bank Statements) or CSV files for automated extraction, merchant identification, and review.
        </p>
      </div>

      {/* Success Notification */}
      {confirmSuccess && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Import Successfully Completed</h3>
              <p className="text-xs text-emerald-300/90">{confirmSuccess.message}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
            >
              View in Transaction History
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
            >
              View Updated Dashboard
            </Link>
            <button
              onClick={handleReset}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 underline ml-2"
            >
              Import another statement
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Import Issue</p>
            <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Step 1: Upload Box (shown when not previewing) */}
      {!draft && !confirmSuccess && (
        <div className="space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-10 sm:p-14 text-center hover:border-sky-500/50 hover:bg-slate-900/50 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20 group-hover:scale-105 transition-all">
              <UploadCloud className="h-8 w-8" />
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-base font-semibold text-white">
                {file ? file.name : "Click to browse or drag and drop statement"}
              </p>
              <p className="text-xs text-slate-400">
                Supports PDF (Google Pay, PhonePe, Bank Statements) and CSV files up to 10MB
              </p>
            </div>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 font-mono">
                {(file.size / 1024).toFixed(1)} KB &bull; {file.type || "binary"}
              </div>
            )}
          </div>

          {file && (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleReset}
                className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                Clear Selection
              </button>
              <button
                onClick={handleParse}
                disabled={parsing}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition-all disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Extracting & Normalizing...
                  </>
                ) : (
                  <>
                    Extract & Preview Transactions
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Sample Downloads */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Synthetic Test Statements</h3>
                <p className="text-xs text-slate-400">Download realistic sample files to test all Phase 1 parsers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sampleFiles.map((sample) => (
                <a
                  key={sample.name}
                  href={`/samples/${sample.name}`}
                  download={sample.name}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 hover:border-slate-700 hover:bg-slate-900/60 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    {sample.type === "PDF" ? (
                      <FileText className="h-4 w-4 text-rose-400" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-200 group-hover:text-sky-300 transition-colors">
                        {sample.label}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">{sample.name}</p>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Extraction Preview & Confirmation */}
      {draft && (
        <div className="space-y-6">
          {/* Draft Summary Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400 ring-1 ring-inset ring-sky-500/20">
                    Source: {draft.source}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{draft.filename}</span>
                </div>
                <h2 className="text-lg font-bold text-white">Extraction Preview & Validation Review</h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                  Cancel / Re-upload
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming || draft.validCount === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving to PostgreSQL...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm & Save {draft.validCount} Valid Transactions
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Counts breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-400">Total Extracted:</span>
                <p className="text-base font-bold text-white mt-0.5">{draft.totalParsed}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <span className="text-emerald-400">Valid Transactions:</span>
                <p className="text-base font-bold text-emerald-300 mt-0.5">{draft.validCount}</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 col-span-2 sm:col-span-1">
                <span className="text-rose-400">Invalid / Rejected Rows:</span>
                <p className="text-base font-bold text-rose-300 mt-0.5">{draft.invalidCount}</p>
              </div>
            </div>
          </div>

          {/* Invalid Rows Warning Box (if any) */}
          {draft.invalidCount > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" />
                {draft.invalidCount} rows failed validation and will NOT be saved
              </div>
              <div className="space-y-2 text-xs">
                {draft.rows
                  .filter((r) => r.status === "INVALID")
                  .map((r) => (
                    <div key={r.rowNumber} className="rounded-lg bg-slate-950/80 p-3 border border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between text-slate-300 font-medium">
                        <span>Row #{r.rowNumber}</span>
                        <span className="text-rose-400">{r.error}</span>
                      </div>
                      {r.rawText && (
                        <p className="font-mono text-[11px] text-slate-500 truncate" title={r.rawText}>
                          {r.rawText}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Valid Transactions Preview Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Valid Extracted Transactions</h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Normalized & Raw Description</th>
                    <th className="px-5 py-3.5">Identified Merchant</th>
                    <th className="px-5 py-3.5">Reference ID</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {draft.rows
                    .filter((r) => r.status === "VALID" && r.transaction)
                    .map((r) => {
                      const t = r.transaction!;
                      return (
                        <tr key={r.rowNumber} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-slate-500">{r.rowNumber}</td>
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
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
                                <Building2 className="h-3.5 w-3.5" />
                                {t.merchantName}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                                Unknown
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                            {t.referenceId ? (
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3 text-slate-600" />
                                {t.referenceId}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-right">
                            <span
                              className={`font-semibold font-mono text-sm ${
                                t.transactionType === "DEBIT" ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {t.transactionType === "DEBIT" ? "-" : "+"}₹{Number(t.amount).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1.5 uppercase font-medium">
                              {t.transactionType}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
