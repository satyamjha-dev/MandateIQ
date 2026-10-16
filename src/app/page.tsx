import Link from "next/link";
import {
  UploadCloud,
  LayoutDashboard,
  ReceiptText,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Landmark,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-8 sm:p-14 shadow-2xl">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3.5 py-1.5 text-xs font-semibold text-sky-400 ring-1 ring-inset ring-sky-500/20">
            <CheckCircle2 className="h-4 w-4" />
            Phase 1 Active &bull; Ingestion, Extraction & Merchant Identification
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Auto Debit Intelligence
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            MandateIQ solves problem statement <span className="font-semibold text-sky-300">T4.1 — The Auto Debits Nobody Can Find</span>.
            We extract financial transactions from messy PDF and CSV statements, normalize cryptic bank narrations, and accurately identify merchant identities.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 transition-all hover:scale-[1.02]"
            >
              <UploadCloud className="h-5 w-5" />
              Import Statement
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all hover:scale-[1.02]"
            >
              <LayoutDashboard className="h-5 w-5 text-sky-400" />
              Open Dashboard
            </Link>

            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all"
            >
              <ReceiptText className="h-5 w-5 text-indigo-400" />
              Transaction History
            </Link>
          </div>
        </div>
      </div>

      {/* Supported Statement Formats Section */}
      <div className="mt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Supported Input Formats</h2>
            <p className="text-sm text-slate-400 mt-1">
              Synthetic and authentic financial statement layouts handled by Phase 1 parsers
            </p>
          </div>
          <Link
            href="/import"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
          >
            Try sample statements &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Format A: Google Pay */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-inset ring-emerald-500/20">
                <Smartphone className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Google Pay PDF</h3>
                <span className="text-xs text-slate-400">Format A Receipt</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts recipient name, UPI transaction ID, bank payment source, date, and decimal amount from Google Pay PDF receipts.
            </p>
            <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800/80">
              Paid to Manjeet &bull; INR 564.00<br />
              UPI ID: 623660426874
            </div>
          </div>

          {/* Format B: PhonePe */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 p-3 ring-1 ring-inset ring-purple-500/20">
                <Smartphone className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">PhonePe PDF</h3>
                <span className="text-xs text-slate-400">Format B Statement</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Handles comma-separated amounts (e.g. INR 60,500), extracts alphanumeric Transaction IDs (T...) and 12-digit UTR numbers.
            </p>
            <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800/80">
              Paid to SAITM &bull; INR 60,500.00<br />
              Txn: T260829160952... | UTR: 4799...
            </div>
          </div>

          {/* Format C: Bank Statement */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 ring-1 ring-inset ring-blue-500/20">
                <Landmark className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Bank Statement PDF</h3>
                <span className="text-xs text-slate-400">Format C Tabular</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Isolates actual transaction amount from running balances, extracts UPI RRN numbers, and preserves raw narrations.
            </p>
            <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800/80">
              UPI/DR/073479210545/Mr YASH...<br />
              Amt: 50.00 (Balance: 99016.09)
            </div>
          </div>

          {/* Standard CSV */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-500/10 p-3 ring-1 ring-inset ring-sky-500/20">
                <FileSpreadsheet className="h-6 w-6 text-sky-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Standard CSV</h3>
                <span className="text-xs text-slate-400">date, description, amount...</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingests standard CSV files with ISO dates (YYYY-MM-DD), explicit DEBIT/CREDIT types, and currency specifiers.
            </p>
          </div>

          {/* Bank A CSV */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-3 ring-1 ring-inset ring-amber-500/20">
                <FileSpreadsheet className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Bank A CSV</h3>
                <span className="text-xs text-slate-400">Date, Narration, Debit, Credit</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Handles DD/MM/YYYY dates, separate Debit and Credit columns, and detects invalid rows where both are populated.
            </p>
          </div>

          {/* Bank B CSV */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4 hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/10 p-3 ring-1 ring-inset ring-rose-500/20">
                <FileSpreadsheet className="h-6 w-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Bank B CSV</h3>
                <span className="text-xs text-slate-400">Txn Date, Withdrawal, Deposit</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Supports DD-Mon-YYYY dates (01-Sep-2026), quoted numbers, and Particulars narrations.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Principles */}
      <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
        <h3 className="text-lg font-semibold text-white">Phase 1 Design Principles</h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
          <div>
            <h4 className="font-semibold text-slate-200">Zero Floating Point Storage</h4>
            <p className="mt-1">All monetary values use PostgreSQL Decimal(12,2) and normalized string representations to prevent rounding anomalies.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-200">Preserve Raw Descriptions</h4>
            <p className="mt-1">Original statement narrations are always preserved untouched alongside clean normalized descriptors.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-200">Unknown Stays Unknown</h4>
            <p className="mt-1">Merchant identification uses deterministic alias matching. When confidence is insufficient, merchants are designated unknown rather than guessed.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
