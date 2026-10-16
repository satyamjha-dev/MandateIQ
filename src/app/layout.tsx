import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MandateIQ | FinTech Auto Debit Intelligence",
  description: "Phase 1: Ingest statements (PDF & CSV), extract transactions, normalize descriptions, and identify merchants.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col font-sans">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>MandateIQ &bull; Problem Statement T4.1 — The Auto Debits Nobody Can Find</p>
            <p className="font-mono text-[11px] text-slate-600">Phase 1 Prototype &bull; PostgreSQL &bull; Prisma 7</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
