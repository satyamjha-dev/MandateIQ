import { CheckCircle2, Database, Layers, Terminal } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-3xl space-y-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Environment Configured
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              MandateIQ
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              T4.1 — The Auto Debits Nobody Can Find
            </p>
          </div>
          <div className="hidden rounded-xl bg-slate-800/80 p-3 sm:block">
            <Layers className="h-8 w-8 text-sky-400" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Development Stack Active
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
              <Layers className="mt-0.5 h-5 w-5 text-sky-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Frontend</p>
                <p className="text-xs text-slate-400">Next.js 15 (App Router), React 19, Tailwind CSS</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
              <Database className="mt-0.5 h-5 w-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Database & ORM</p>
                <p className="text-xs text-slate-400">PostgreSQL (Docker), Prisma ORM 7, @prisma/adapter-pg</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
              <Terminal className="mt-0.5 h-5 w-5 text-violet-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Tooling & Testing</p>
                <p className="text-xs text-slate-400">TypeScript, ESLint, Vitest, Zod, Papa Parse</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">Project Status</p>
                <p className="text-xs text-slate-400">Environment initialized. Ready for application design.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs font-mono text-slate-400">
            $ npm run db:up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Start PostgreSQL in Docker
            <br />
            $ npm run dev &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Start Next.js development server
            <br />
            $ npm run test &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Run Vitest test suite
          </p>
        </div>
      </div>
    </main>
  );
}

