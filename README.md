# MandateIQ — Development Environment Setup

> **Project Name:** MandateIQ  
> **Problem Statement:** T4.1 — The Auto Debits Nobody Can Find  
> **Phase:** Development Environment Setup Only

---

## 1. Overview

MandateIQ is a FinTech system designed to analyze transaction histories, identify recurring financial commitments, clarify merchant identities, detect subscription anomalies, and guide cancellations.

This repository currently contains the **foundational development environment**:
- **Frontend:** Next.js (App Router), React, TypeScript, and Tailwind CSS.
- **Backend:** Next.js Route Handlers and server-side runtime.
- **Database:** PostgreSQL running in a dedicated Docker container.
- **ORM:** Prisma 7 with the `@prisma/adapter-pg` driver adapter.
- **Tooling & Validation:** Zod, Papa Parse, Vitest, and Lucide React.

> **Scope Note:** In accordance with the project roadmap, no application business logic (such as recurring payment detection, CSV ingestion pipelines, or specific database schemas) is included in this phase. Application features will be designed and implemented in subsequent steps.

---

## 2. Prerequisites

Ensure you have the following installed on your machine:

| Requirement | Minimum Version | Verified Version | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.x` or `v22.x` | `v22.14.0` | Active LTS recommended |
| **npm** | `v10.x` | `v10.9.2` | Bundled with Node |
| **Docker & Docker Compose** | Docker Desktop / Engine | Latest | Required for running PostgreSQL |

---

## 3. Project Directory Structure

```text
MandateIq/
├── docker-compose.yml       # Docker Compose definition for PostgreSQL 16
├── prisma.config.ts         # Prisma 7 centralized configuration (datasource & migrations)
├── prisma/
│   └── schema.prisma        # Prisma schema file (datasource and client generators)
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind base styles and theme variables
│   │   ├── layout.tsx       # Root layout shell
│   │   └── page.tsx         # Development environment verification landing page
│   ├── lib/
│   │   └── db.ts            # Reusable Prisma 7 client with @prisma/adapter-pg driver adapter
│   └── test/
│       ├── setup.test.ts    # Vitest, Zod, and Papa Parse integration tests
│       └── db.test.ts       # Database connectivity test
├── public/                  # Static assets directory
├── .env.example             # Documented environment variables template
├── .gitignore               # Excludes secrets, node_modules, and build outputs
├── package.json             # Scripts and dependencies
├── tsconfig.json            # TypeScript compiler configuration with @/* alias
├── tailwind.config.ts       # Tailwind CSS configuration
├── postcss.config.mjs       # PostCSS plugins (Tailwind & Autoprefixer)
├── eslint.config.mjs        # Next.js flat ESLint configuration
├── vitest.config.ts         # Vitest test runner configuration
└── README.md                # Environment documentation
```

---

## 4. Environment Variables Configuration

The repository includes a template file `.env.example`.

### Step 1: Create your local `.env` file
```bash
cp .env.example .env
```

### Step 2: Understand the configuration variables
```ini
# PostgreSQL credentials for Docker Compose container
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=mandateiq_db

# Local connection string used by Prisma 7 runtime and CLI
# Notice host is localhost and port is 5432
DATABASE_URL="postgresql://postgres:your_secure_password_here@localhost:5432/mandateiq_db?schema=public"

# Direct URL for CLI migrations (matches DATABASE_URL for local setup)
DIRECT_URL="postgresql://postgres:your_secure_password_here@localhost:5432/mandateiq_db?schema=public"

# Node environment
NODE_ENV=development
```

> **Security Guardrails:**
> - `.env` is ignored by Git in `.gitignore`. Never commit `.env` or credentials to version control.
> - Database credentials remain strictly server-side and must never be exposed to client-side bundles (do not prefix with `NEXT_PUBLIC_`).

---

## 5. Starting and Managing PostgreSQL with Docker

PostgreSQL 16 runs isolated inside Docker using `docker-compose.yml`, storing data in a persistent Docker volume (`mandateiq_postgres_data`).

### Start PostgreSQL
```bash
npm run db:up
# Or directly via Docker Compose:
docker compose up -d
```

### Check Container Status and Health
```bash
docker compose ps
```
The status should indicate `Up ... (healthy)` and show the port binding `0.0.0.0:5432->5432/tcp`.

### View Database Logs
```bash
npm run db:logs
# Or directly:
docker compose logs -f
```

### Stop PostgreSQL (Preserving Data)
```bash
npm run db:down
# Or directly:
docker compose down
```

### Stop PostgreSQL and Delete Data (Fresh Reset)
```bash
docker compose down -v
```
> **Warning:** `docker compose down -v` permanently removes the `mandateiq_postgres_data` volume and erases all database tables and records.

---

## 6. Prisma 7 Configuration

Prisma 7 introduces substantial architectural improvements over earlier versions:
1. **Decoupled Datasource Configuration (`prisma.config.ts`):**  
   Connection URLs are defined in `prisma.config.ts` rather than `schema.prisma`.
2. **Mandatory Driver Adapters (`@prisma/adapter-pg`):**  
   Prisma 7 delegates database network operations and connection pooling directly to the Node PostgreSQL driver (`pg`).
3. **Reusable Client Singleton (`src/lib/db.ts`):**  
   Prevents connection pool exhaustion during Next.js Hot Module Replacement (HMR) in development.

### Prisma Commands
```bash
# Generate the Prisma Client
npm run prisma:generate

# Run schema migrations (once database models are defined in future steps)
npm run prisma:migrate

# Open Prisma Studio GUI
npm run prisma:studio
```

---

## 7. Development Server and Verification

### Dependency Installation
```bash
npm install
```

### Running Tests
Execute the Vitest test suite to verify testing framework, schema validation, CSV parsing, and database connectivity:
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Production Build Verification
```bash
npm run build
```

### Starting the Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You will see the MandateIQ environment status page.

---

## 8. Troubleshooting

### Port 5432 is already allocated
If `docker compose up -d` fails with `Bind for 0.0.0.0:5432 failed: port is already allocated`:
- Another service or PostgreSQL instance is already bound to port 5432.
- Inspect the process with `lsof -i :5432`.
- If another Docker container is using the port, inspect running containers via `docker ps` and stop the conflicting container with `docker stop <container_name>`.

### Database Connection Refused (`ECONNREFUSED 127.0.0.1:5432`)
- Verify the Docker container is running: `docker compose ps`.
- If the container is stopped or exited, run `docker compose up -d`.
- Check health logs: `docker compose logs`.

### `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`
- Ensure a `.env` file exists at the root of the project with a valid `DATABASE_URL`.
- Run `cp .env.example .env` and configure your credentials.

---

## 9. Next Steps

With the development environment verified and running:
1. Design Phase 1 data models in `prisma/schema.prisma`.
2. Apply database migrations via `npm run prisma:migrate`.
3. Implement synthetic CSV statement parsing and normalization.
4. Build the Phase 1 dashboard and transaction inspection views.

