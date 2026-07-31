# 🎬 E5 Chronicles — Production Operations Portal

This is the internal operational portal built to run E5 Chronicles, a fast-paced production house. It centralizes employee attendance, client invoicing, project task lifecycles, equipment tracking, talent roster & bookings, and operational health.

> **Current Status:** A mature production-operations portal (35–45% of a full ERP). It features robust Postgres-level security (RLS), atomic equipment checkout, strict invoice numbering, and an automated KPI engine. It does **not** yet have a double-entry General Ledger (GL) or Nepal-specific tax/fiscal compliance (VAT/TDS).

---

## 🛠️ The Stack

* **Framework:** Next.js 16 (App Router + Turbopack)
* **Frontend:** React 19 + Tailwind CSS v4 + shadcn/ui
* **Backend/Auth/DB:** PostgreSQL via Supabase (Cookie-based SSR sessions)
* **Routing Security:** `src/proxy.ts` handles SSR session refresh and server-side route protection.
* **Forms & Validation:** React Hook Form + Zod
* **Caching:** Deployment-aware cache (`node-cache` locally, Upstash Redis in prod)
* **Monitoring:** Sentry (errors) and Datadog Synthetics (uptime)
* **Testing:** Vitest + GitHub Actions (lint, typecheck, tests on PR)

---

## 🔥 Supported Features

* **Role-Based Portals:** Dedicated `/admin`, `/founder`, and `/employee` dashboards.
* **Operations Dashboard:** Real-time health scores using dual-window architecture (lifetime cumulative vs. monthly resetting metrics).
* **Timezone-Aware Attendance:** Check-ins are computed in **Asia/Kathmandu (UTC+5:45)** directly at the database level.
* **Employee KPIs:** Automated 0–100 scoring based on attendance, task completion, and punctuality over the last 30 days.
* **Projects & Kanban:** Full project lifecycles with a 5-phase delivery process and real-time Kanban task management.
* **Atomic Equipment Checkout:** Race-safe Postgres RPCs (`checkout_equipment`) prevent double-booking gear. *(Note: Manual Asset ID lookup is used; camera QR scanning is currently disabled).*
* **Talent Bookings:** Searchable talent roster with atomic booking constraints to prevent schedule overlaps.
* **Invoicing:** Sequential invoice number generation with client-side PDF rendering (`jspdf` + `html2canvas`). 
* **Audit Logs:** Database triggers automatically log changes to invoices, expenses, attendance, and equipment.

---

## 🏗️ Project Structure

```text
src/
├── proxy.ts                   # Next.js proxy — session refresh & route protection
├── app/
│   ├── login/                 # Entry point
│   ├── admin/                 # Admin operations (invoices, projects, equipment, talent, etc.)
│   ├── employee/              # Employee self-service
│   ├── founder/               # Strategic founder overview
│   ├── actions/               # Shared server actions
│   └── api/cron/              # Scheduled background jobs (e.g., mark-overdue-invoices)
├── components/                # Modular client UI and layout components
├── lib/
│   ├── supabase/              # Supabase clients (browser, server, admin, storage)
│   ├── validations.ts         # Central Zod schemas
│   └── ...                    # Caching, notifications, email dispatch
└── types/                     # Shared TypeScript definitions

supabase/
├── migrations/                # Forward-only database migrations
└── rollbacks/                 # Manual-use reversal scripts
```

---

## ⚠️ Known Limitations & Roadmap

As the system scales toward a full ERP, the following limitations are known and flagged for future development:

1. **No Double-Entry Accounting:** Invoices and expenses currently operate as operational lists, not a true General Ledger. There is no Chart of Accounts, Journal Entries, or Trial Balance.
2. **Missing Nepal Compliance:** 
   - No automated 13% VAT Tax Invoice PDFs (IRD format).
   - No TDS (Tax Deducted at Source) withholding for freelance talent.
   - Dashboards use the Gregorian calendar instead of the Nepal fiscal year (Bikram Sambat - Shrawan to Asar).
3. **Coarse Role Model:** The system uses 3 roles (Admin, Founder, Employee). A granular RBAC (Role-Based Access Control) permission table is required as the team grows.
4. **No Offline Mode (PWA):** Field crews on remote shoots require constant internet access to log attendance and task updates.

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/buddhi-art/e5.git
cd e5
npm install
```

### 2. Environment Variables

Copy the template and fill in your keys:

```bash
cp .env.local.example .env.local
```

Required keys include:
* `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY` (Used for bypassing RLS in secure server environments)
* `ADMIN_EMAIL` / `ADMIN_PASSWORD` (For initial bootstrap)

### 3. Database Migration Policy

Database schema is managed via Supabase migrations. We strictly follow these rules:
* **Never edit an applied migration.**
* **Never reuse a migration number.**
* **Never put rollback scripts in the forward migration directory.**

To apply migrations locally:
```bash
npx supabase db push
```

*(Note: Never run `supabase db reset` in production, as it wipes the database and reapplies migrations from scratch).*

### 4. Create Initial Admin

Run the bootstrap script to seed your first admin profile:

```bash
node create-admin.mjs
```

### 5. Start Development Server

```bash
npm run dev
```
Head over to `http://localhost:3000` to log in.
