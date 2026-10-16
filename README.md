# MandateIQ — AutoDebit Intelligence (Phase 1)

> **Project Name:** MandateIQ  
> **Problem Statement:** T4.1 — The Auto Debits Nobody Can Find  
> **Status:** Phase 1 Complete (Statement Ingestion, Extraction, Normalization & Merchant Identification)

---

## 1. Project Overview & Objectives

MandateIQ is a FinTech intelligence system designed to illuminate hidden, forgotten, or ambiguous recurring financial commitments from raw statements. 

**Phase 1 Focus:**
Phase 1 delivers the complete ingestion, extraction, and normalization foundation:
1. **PDF Statement Ingestion:** Parses digital PDF statements from Google Pay receipts, PhonePe transaction statements, and standard Indian bank statements.
2. **CSV Statement Ingestion:** Detects and parses Standard CSV, Bank A (Debit/Credit columns), and Bank B (Withdrawal/Deposit columns) formats.
3. **Transaction Normalization:** Deterministically normalizes narrations, ISO/flexible dates, and decimal amount strings without losing raw narrations.
4. **Merchant Identification:** Uses a curated reference dataset and conservative alias matching to identify merchants (e.g., Netflix, Spotify, Amazon, Google, Microsoft, Swiggy, Zomato) while preserving unknown merchants as `Unknown`.
5. **PostgreSQL Persistence:** Atomic batch persistence using Prisma ORM 7 with `@prisma/adapter-pg`.
6. **Financial Dashboard & History:** Real aggregated stats (total debits, total credits, batch counts) and paginated transaction history without fabricated data.

---

## 2. Supported Statement Formats

### Format A — Google Pay-style Receipts (PDF)
- **Cues:** Brand tokens or `Paid to` / `Received from` + `UPI Transaction ID`.
- **Extracted Fields:** Recipient name, Date (`24 Aug, 2026`), UPI Transaction ID (`623660426874`), Bank Source (`Kotak Mahindra Bank 0667`), and Amount (`INR 564.00`).
- **Transaction Type:** `Paid to` &rarr; `DEBIT`, `Received from` &rarr; `CREDIT`.

### Format B — PhonePe-style Statements (PDF)
- **Cues:** Brand tokens or `Transaction ID: T...` + `UTR:` numbers.
- **Extracted Fields:** Recipient name (`Paid to SAITM`), Date (`Aug 29, 2026`), Amount with comma parsing (`INR 60,500` &rarr; `60500.00`), Transaction ID (`T2608291609522447721902`), and UTR (`479923133777`).
- **Safe Amount Isolation:** Does not mistake UTR, masked accounts (`...6637`), or transaction IDs for monetary amounts.

### Format C — Tabular Bank Statements (PDF)
- **Cues:** Date patterns + `Amount:` + `Type: DEBIT/CREDIT` + `Balance:` + `UPI/DR/` narrations or tabular column lines.
- **Extracted Fields:** Date (`01-04-2026`), Transaction Amount (`INR 50.00`), Type (`DEBIT`), UPI RRN / Reference number (`073479210545`), and raw description.
- **Balance Isolation:** Distinguishes actual transaction amounts from running balances (`INR 99016.09`).

### CSV Statements
1. **Standard Format:**
   ```csv
   date,description,amount,type,currency
   2026-09-01,NETFLIX,499.00,DEBIT,INR
   2026-09-05,SALARY,45000.00,CREDIT,INR
   ```
2. **Bank A Format (Dual columns, DD/MM/YYYY):**
   ```csv
   Transaction Date,Narration,Debit,Credit
   01/09/2026,NETFLIX.COM,499.00,
   05/09/2026,SALARY CREDIT,,45000.00
   ```
3. **Bank B Format (DD-Mon-YYYY, Quoted amounts):**
   ```csv
   Txn Date,Particulars,Withdrawal,Deposit
   01-Sep-2026,NETFLIX,499.00,
   05-Sep-2026,SALARY,,"45000.00"
   ```

> **Sample Files:** Synthetic statement files for all 6 formats are available in `public/samples/` and can be downloaded directly from the `/import` page.

---

## 3. Architecture & Ingestion Pipeline

```text
Uploaded Statement File (.pdf or .csv)
   │
   ▼
[File Signature & Size Validation] ── (Rejects > 10MB or non-PDF/CSV)
   │
   ├── If PDF: [unpdf / pdfjs-dist Text Extraction]
   │           │
   │           ├── If Scanned / Empty ──> Reports "OCR Required"
   │           │
   │           └── [Layout Identification] ──> GPAY / PHONEPE / BANK_STATEMENT
   │
   └── If CSV: [Papa Parse Header Detection] ──> STANDARD / BANK_A / BANK_B
   │
   ▼
[Source-Specific Extraction] ── (Isolates Date, Description, Amount, Type, Reference ID)
   │
   ▼
[Normalization & Merchant Identification] ── (Deterministic tokens, curated alias matching)
   │
   ▼
[Zod Transaction Validation] ── (Valid vs Invalid Rows distinction)
   │
   ▼
[Frontend Preview at /import] ── (User reviews extracted rows before persisting)
   │
   ▼
[User Confirms Import]
   │
   ▼
[Server-Side Re-validation & Prisma $transaction Persistence]
   │
   ▼
[PostgreSQL Database] ──> Reflected in Dashboard (/dashboard) & History (/transactions)
```

---

## 4. Technology Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React.
- **Backend:** Next.js Route Handlers (`/api/import/parse`, `/api/import/confirm`, `/api/transactions`, `/api/dashboard`).
- **Database:** PostgreSQL 16 (running via Docker Compose) with Prisma ORM 7 (`@prisma/adapter-pg` driver adapter).
- **PDF Extraction:** `unpdf` (powered by `pdfjs-dist`).
- **CSV Processing:** `papaparse`.
- **Validation:** `zod`.
- **Testing:** `vitest`.

---

## 5. Development Setup & Commands

### Prerequisites
- Node.js `v20.x` or `v22.x` (verified on `v22.14.0`)
- npm `v10.x` (verified on `10.9.2`)
- Docker Desktop or Docker Engine

### 1. Environment Configuration
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mandateiq_db
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mandateiq_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/mandateiq_db?schema=public"
NODE_ENV=development
```

### 2. Docker PostgreSQL Management
```bash
# Start PostgreSQL container
npm run db:up
# (or: docker compose up -d)

# Inspect container health
docker compose ps

# View container logs
npm run db:logs

# Stop container (data preserved)
npm run db:down
```

### 3. Database Migrations & Client Generation
```bash
# Generate Prisma Client
npm run prisma:generate

# Apply database migrations
npm run prisma:migrate

# Open Prisma Studio GUI
npm run prisma:studio
```

### 4. Running the Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to view MandateIQ.

### 5. Running Automated Tests & Quality Checks
```bash
# Run complete Vitest suite (41 tests across 7 suites)
npm run test

# Run ESLint check
npm run lint

# Build production application
npm run build
```

---

## 6. API Endpoints

### `POST /api/import/parse`
Parses an uploaded statement file and returns a structured preview without saving to the database.
- **Request:** `multipart/form-data` with `file`.
- **Response:**
  ```json
  {
    "success": true,
    "draft": {
      "filename": "gpay-sample.pdf",
      "source": "GPAY",
      "totalParsed": 2,
      "validCount": 2,
      "invalidCount": 0,
      "rows": [
        {
          "rowNumber": 1,
          "status": "VALID",
          "transaction": {
            "transactionDate": "2026-08-24T00:00:00.000Z",
            "rawDescription": "Paid to Manjeet",
            "normalizedDescription": "PAID TO MANJEET",
            "amount": "564.00",
            "currency": "INR",
            "transactionType": "DEBIT",
            "referenceId": "623660426874",
            "source": "GPAY",
            "merchantName": null
          }
        }
      ]
    }
  }
  ```

### `POST /api/import/confirm`
Re-validates client-submitted transactions server-side and atomically saves `ImportBatch` and `Transaction` records inside a PostgreSQL transaction.
- **Request Body:**
  ```json
  {
    "filename": "gpay-sample.pdf",
    "source": "GPAY",
    "transactions": [ ... ]
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "batchId": "c4d1...",
    "persistedCount": 2,
    "message": "Successfully imported and persisted 2 transactions from \"gpay-sample.pdf\"."
  }
  ```

### `GET /api/dashboard`
Returns real computed metrics from PostgreSQL:
```json
{
  "success": true,
  "stats": {
    "totalTransactions": 14,
    "totalBatches": 3,
    "totalDebits": "63200.00",
    "totalCredits": "90000.00"
  },
  "recentTransactions": [ ... ]
}
```

### `GET /api/transactions`
Returns paginated transactions with merchant details:
- Query parameters: `page=1`, `limit=20`, `type=DEBIT|CREDIT`, `source=GPAY|PHONEPE|BANK_STATEMENT|CSV`.

---

## 7. Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Another service is using port 5432 | Run `lsof -i :5432` or `docker ps` and stop conflicting services. |
| `The uploaded PDF does not contain extractable text` | PDF is a scanned image without selectable text | Document is an image scan; OCR is required (not supported in Phase 1). |
| `PrismaConfigEnvError: Cannot resolve environment variable` | Missing `.env` file | Run `cp .env.example .env` with database credentials. |

---

## 8. Phase 1 Boundaries & Future Phases

**Intentionally Excluded from Phase 1 (Scheduled for Later Phases):**
- Recurring-payment cadence detection (weekly, monthly, annual)
- Silent price increase detection
- Subscription cancellation guides and flows
- Account Aggregator / real bank APIs
- LLM-based categorization
