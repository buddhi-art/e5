# 🎬 E5 Chronicles — Production Management Portal

This is the all-in-one internal portal built to run a fast-paced production house. Instead of fragmenting our operations across a dozen messy Google Sheets and random apps, **E5 Chronicles** centralizes everything: employee attendance, client invoicing, project task lifecycles, equipment tracking (with live QR scanning), talent roster & bookings, a production calendar, and financial health.

Built using **Next.js 16**, **React 19**, and **Supabase**.

---

## 🛠️ The Stack

* **Framework:** Next.js 16 (App Router + Turbopack)
* **Frontend:** React 19 + Framer Motion (for smooth layout transitions)
* **Styling:** Tailwind CSS v4 + shadcn/ui + Base UI
* **Charts:** Recharts (dashboard ring gauges, trend lines)
* **Backend/Auth/DB:** PostgreSQL via Supabase (Cookie-based SSR sessions)
* **Forms & Validation:** React Hook Form + Zod
* **Caching:** `node-cache` (self-hosted) or Upstash Redis (serverless) — auto-selected
* **Monitoring:** Sentry (errors + tracing) and Datadog Synthetics (uptime)
* **Testing/CI:** Vitest + GitHub Actions (lint, typecheck, tests on every PR)

---

## 🔥 Key Workflows & Features

### 🔐 Auth & Role-Based Routing

* Uses Supabase Auth under the hood with automatic, role-based routing via **`src/middleware.ts`** — a Next.js standard middleware that refreshes SSR sessions on every request and protects routes server-side before any page renders.
* **Admin Role:** Full dashboard access, global financial metrics, and operational overviews.
* **Employee Role:** Self-service portal focused strictly on their own check-ins, tasks, leave balances, and profile updates.
* **Founder Role:** High-level strategic dashboard with project, resource, and financial overviews.

### 📊 The Operations Dashboard

* **The Health Score:** A real-time, weighted ring gauge that scores the entire company's operational health based on attendance, overdue tasks, active cash flow, and equipment status.
* **Smart Performance Windows:** A unique dual-window approach. Top stat cards show **historical lifetime data** (always cumulative), while the lower domain blocks show **isolated monthly metrics** that reset every month. This keeps performance tracking highly relevant to the current month without losing historical context.
* Optimized via **Incremental Static Regeneration (ISR)** to auto-refresh the data every 5 minutes, preventing constant, heavy DB reads on complex analytics.
* **Single RPC Architecture:** The admin dashboard's analytics have been vastly improved by consolidating 35+ parallel database queries into a single, lightning-fast PostgreSQL RPC (`get_admin_dashboard_metrics`).
* **In-Memory Caching:** This single RPC call is further wrapped in a `node-cache` layer with a 600-second TTL, serving repeated hits within the same 10-minute window directly from RAM.

### 👥 People, Attendance & Leave

* **Optimistic Check-ins:** Real-time employee check-in tracking with status variables (**Present**, **Late**, **Absent**, **Half-Day**) featuring instant Optimistic UI feedback.
* Visual admin panels showing yesterday-vs-today attendance trends and 30-day consistency rates.
* A clean leave request calendar view to prevent team scheduling conflicts.

### 🎬 Projects, Tasks & Equipment Inventory

* Kanban-style task lifecycles (**To Do → In Progress → Completed**) mapped directly to client projects.
* Live tracking of expensive gear with distinct statuses (**Available**, **Checked Out**, **In Maintenance**).
* **Atomic Checkouts:** Equipment checkout features robust Postgres RPC functions (`checkout_equipment`) preventing race conditions and keeping status perfectly synced.
* Built-in **QR scanning** via the device camera for instantaneous equipment check-ins/check-outs on set.

### 📊 Employee KPI Scoring

* **Automated Scoring:** Employee performance is automatically computed from real attendance and task data on a 0–100 scale using a weighted formula, refreshed whenever an admin or founder loads their portal.
* **Weighted Formula (last 30 days):**
  * **Attendance (50 pts):** `present` = 1.0, `late` = 0.6, `half-day` = 0.5, `absent` = 0.0. Score = 50 × (weighted sum / record count). Falls back to 35 (50 × 0.7) when no records exist.
  * **Task Completion (30 pts):** Score = 30 × (completed tasks / total tasks with deadlines in window). Falls back to 21 (30 × 0.7) when no tasks exist.
  * **Punctuality (20 pts):** Of completed tasks with deadlines, score = 20 × (on-time completions / completed with deadline). Falls back to 14 (20 × 0.7) when no qualifying tasks exist.
* **Security:** KPI data is protected at the database level (RLS on `employee_kpi_snapshots` table restricts SELECT to admin/founder via `is_admin_or_founder()` check) and at the application layer (RPCs verify the caller before returning data). Employees see no KPI data anywhere.
* **Snapshot History:** Monthly scores are cached in `employee_kpi_snapshots` so trends and history display instantly without recomputing.
* **KPI Card:** The admin employee detail page shows a ring-gauge score with sub-score breakdowns and monthly history.

### 🎬 Founder Project Parity

* Founders now have full **Create, Read, Update, Delete** access to projects — the same CRUD capabilities as admins.
* **Shared actions:** Project mutations use a single `checkAdminOrFounder()` guard in the server actions, avoiding duplicated logic.
* **RLS:** Project RLS policies were updated to use `is_admin_or_founder()` so both admins and founders can insert, update, and delete projects.
* The founder projects page reuses the same `ProjectForm`, `ProjectStatusSelect`, and `ProjectActionsMenu` components as the admin page.

### 💰 Invoicing & Expense Tracking

* Complete billing lifecycles from Draft to Paid/Overdue, including native **PDF invoice generation** via `jspdf` + `html2canvas` (client-side rendering, triggered from the invoice detail page).
* **Atomic Invoice Numbering:** Features robust Postgres sequences to guarantee sequential, collision-free invoice numbering, even under concurrent high load.
* **Overdue Automation:** A client-side `OverdueChecker` component fires a server action on mount to mark invoices past-due, keeping statuses accurate without a cron job.
* Tracks localized payment routes like Cash, Bank, eSewa, Khalti, and ConnectIPS.
* Secure receipt image uploads mapped straight to Supabase Storage buckets (served via short-lived **signed URLs**, never public links).

### 🎭 Talent Roster & Bookings

* A searchable talent directory with categorized types, photos (signed-URL protected), and per-talent detail pages.
* **Booking lifecycle:** talents can be booked against projects with status management — **Confirm → Complete → Cancel** — driven by the `BookingStatusActions` component.
* Admins manage the full roster; employees get a read-only talent directory.

### 🗓️ Production Calendar

* A month-grid **production calendar** (`/admin/calendar`) surfacing meetings, bookings, and scheduled events in one view to prevent conflicts across teams.

### ⏱️ Timezone-Aware Attendance

* Attendance status is computed in the business timezone **Asia/Kathmandu (UTC+5:45)** at the database level, so check-in classification is correct regardless of server locale.
* **Cutoffs** (stored in an `attendance_config` table so they can be tuned without code changes): before **10:15 AM** → `present`, **10:15–11:00 AM** → `late`, after **11:00 AM** → `half-day`, no check-in → `absent`.

### ⚙️ Background Jobs & Reliability

* **Overdue invoices** are swept both reactively (the client-side `OverdueChecker`) and proactively via a scheduled cron endpoint: `GET /api/cron/mark-overdue-invoices`, which calls the `mark_overdue_invoices()` RPC.
* The cron route is protected by a **`CRON_SECRET`** bearer token — point pg_cron, a Supabase Edge timer, or Vercel Cron at it.

### 🩺 Monitoring & Observability

* **Sentry** captures client and server errors with tracing and session replay (enabled automatically in production, or when `SENTRY_DSN` is set).
* **Datadog Synthetics** runs scheduled uptime checks against production via a GitHub Actions workflow (business-hours cadence, NPT).

---

## 🏗️ Project Structure

```
src/
├── middleware.ts              # Next.js middleware — session refresh & route protection
├── app/
│   ├── login/                 # Entry point
│   ├── admin/                 # Admin views (attendance, invoices, projects, tasks, kanban,
│   │                          #   equipment, talents, calendar, clients, expenses, leave)
│   ├── employee/              # Employee self-service views
│   ├── founder/               # Founder strategic overview (finances, projects, resources)
│   ├── actions/               # Shared server actions (auth, notifications, storage, comments)
│   └── api/cron/              # Scheduled endpoints (e.g. mark-overdue-invoices)
├── components/                # Navbars, sidebars, and modular client UI
├── lib/
│   ├── supabase/              # Supabase clients (browser, server, middleware, admin, storage)
│   ├── cache.ts               # Deployment-aware cache (node-cache ↔ Upstash Redis)
│   ├── notifications.ts       # In-app notification helpers
│   ├── email.ts               # Email dispatch (Resend / SendGrid / SMTP / dev-console)
│   ├── validations.ts         # Zod schemas
│   └── __tests__/             # Vitest suites (invoice numbering, checkout, RLS)
└── types/                     # Shared TypeScript type definitions

sentry.client.config.ts        # Sentry init (browser)
sentry.server.config.ts        # Sentry init (server)
supabase/migrations/           # Forward migrations only (001 → 028)
supabase/rollbacks/            # Manual-use reversal scripts (never auto-applied)
.github/workflows/             # CI (lint/typecheck/test) + Datadog Synthetics
```

---

## 🚀 Getting Started

### 1. Spin up the project locally

```bash
git clone https://github.com/buddhi-art/e5.git
cd e5
npm install
```

### 2. Configure Environment Variables

Copy the template and fill in your keys — **`.env.local.example`** documents every supported variable (caching, email, cron, monitoring):

```bash
cp .env.local.example .env.local
```

The essentials to get running locally:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Bootstrap admin (used by create-admin.mjs)
ADMIN_EMAIL=your-admin-email@domain.com
ADMIN_PASSWORD=your-secure-password
```

Optional / deployment-time keys (see the example file for the full list): `CRON_SECRET` (protects `/api/cron/*`), `CACHE_DRIVER` + `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (Redis caching), `EMAIL_PROVIDER` + provider keys (notification emails), `SENTRY_DSN` (error monitoring), and `NEXT_PUBLIC_SITE_URL` (absolute links in emails).

### 3. Initialize the Database

Apply the numbered forward migrations inside `supabase/migrations/` in order against your Supabase project (the Supabase CLI `supabase db push` / `supabase db reset` handles this for you). They build out the tables, relational indexes, **Row Level Security (RLS)** guardrails, and our **advanced RPC functions**, spanning logical migrations **001 → 028**. Reversal scripts for the schema-changing migrations live **only** in `supabase/rollbacks/` — they are a manual-use archive and are **not** part of the auto-applied migration set (never place them in `supabase/migrations/`, or a `db reset` would undo each migration right after applying it).

### 4. Create the Initial Admin Account

Run our bootstrap script to seed your first admin profile into the database:

```bash
node create-admin.mjs
```

### 5. Fire up the Dev Server

```bash
npm run dev
```

Head over to `http://localhost:3000` to log in.

---

## ⚠️ Good to Know / Quirks

* **Migration numbering:** Files are timestamp-prefixed (`20260101…`) with the **logical** migration number in the filename (e.g. `…_021_phase2_integrity.sql`). Where the notes below reference "migration 019/020/021," they mean those logical numbers.
* **Cron needs an external scheduler:** `/api/cron/mark-overdue-invoices` does nothing on its own — you must point pg_cron, a Supabase Edge timer, or Vercel Cron at it with the `Authorization: Bearer $CRON_SECRET` header. Without a scheduler the client-side `OverdueChecker` still marks invoices overdue on page load.
* **Initial Health Score Fallback:** On a completely fresh database with zero entries, the main dashboard's Health Score will default to roughly **65–75%** due to optimistic fallback calculations. Don't worry—it automatically self-corrects the moment real attendance and task data begin flowing in.
* **Database Reset Cookie Lock:** If you manually purge or drop your local Supabase database while testing, your browser cookies will temporarily hold a dead session. The middleware catches this and redirects to `/login` gracefully. If you still see issues, clear browser cookies or use an incognito window.
* **`node-cache` / Upstash Redis (deployment-aware caching):** The app uses `src/lib/cache.ts` which auto-selects between `node-cache` (600s TTL, long-running/self-hosted) or **Upstash Redis** (when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, e.g., on Vercel). You can also force a driver with `CACHE_DRIVER=memory` or `CACHE_DRIVER=redis`. The dev server log will print a warning if Redis is unavailable and fall back gracefully. See `cache.ts` for the rational defaults.
* **Kanban Board:** A full drag-and-drop Kanban board is available at `/admin/kanban`. Tasks are grouped into **Pending**, **In Progress**, **Completed**, and **Blocked** columns. Drag cards between columns to update their status. Optimistic locking prevents duplicate updates when two admins modify the same task concurrently — conflicts show a toast with the server state.
* **Invoice Timeline:** Each invoice now has a visual timeline showing state transitions (Draft → Sent → Viewed → Paid/Overdue/Cancelled) with timestamps. Timeline entries are auto-inserted via a database trigger whenever the invoice status changes.
* **In-App Notifications + Email:** The notification system now supports email dispatch via Resend, SendGrid, or SMTP. When a leave request is approved/rejected, or a task is blocked, the assigned user receives an in-app notification and optionally an email. Configure via `EMAIL_PROVIDER` env var (see `.env.local.example`).
* **Insufficient Data State:** The admin dashboard now detects when the database has no meaningful data (0 employees, 0 invoices, 0 tasks) and shows a helpful "Insufficient Data" banner with quick-action links to get started, rather than showing misleading fallback health scores.
* **Equipment Manual Asset-ID Lookup:** Equipment can now be looked up by `serial_number` or `manual_asset_id` via the `lookupByAssetId` server action. This serves as a fallback when QR scanning is unavailable — admins can type in an asset ID to find equipment quickly.
* **Testing & CI:** The project now includes Vitest with a test setup file that mocks Supabase and Resend. Three test files cover: invoice number atomicity (10 concurrent calls, no collisions), checkout atomicity (5 concurrent checkouts, exactly 1 succeeds), and RLS access denial (employee cannot read admin data). A GitHub Actions CI pipeline runs lint, typecheck, and tests on every PR.
* **PDF Generation:** Invoice PDFs are generated **client-side** using `jspdf` + `html2canvas` (`npm install` already includes both). The `PrintButton` component on the invoice detail page renders the invoice content to a canvas and produces a downloadable PDF. All invoice math (subtotals, discount, tax, grand total, balance due) is computed server-side in the action and stored in the database — the PDF renderer reads the authoritative `grand_total`, `discount_amount`, `tax_amount`, `balance_due` columns, never the browser's computation.
* **Invoice `discount_amount` and `balance_due` columns:** These were added in migration 021. If you are upgrading from an earlier database state, ensure migration 021 is applied before creating invoices with discounts or advances.
* **checkout_equipment RPC fix:** Migration 019 accidentally replaced the `checkout_equipment` RPC with a **different signature** (`p_user_id`, `p_expected_return_date`, `p_purpose`) than what the server action calls (`p_checked_out_by`, `p_expected_return_at`, `p_condition`, `p_notes`). Migration 021 reverts this to match the server action, and migration 027 finalizes it. If you are on migration 019 or 020, applying migration 021 is **required** for equipment checkout to work. Note: because these migrations change the RPC's parameter defaults, 021 and 027 each `DROP FUNCTION IF EXISTS checkout_equipment(...)` before recreating it — Postgres rejects a plain `CREATE OR REPLACE` that alters parameter defaults (error `42P13`).
* **Storage bucket owner-scoping:** The `receipts` bucket was previously readable/writable by any authenticated user. Migration 021 restricts this so only admin/founder can view all receipts, and the bucket owner (the uploader) is the only one who can upload. The `equipment-photos` and `talent-photos` buckets remain public-read for display.
* **Soft-delete column additions:** Migration 021 adds `deleted_at` to `attendance`, `subtasks`, `sub_subtasks`, `equipment_checkouts`, `equipment_maintenance`, `client_meetings`, `expense_categories`, `equipment_categories`, `talent_types`, and `talent_bookings`. Employee-scoped SELECT RLS policies now filter out soft-deleted rows.
* **Audit logs expanded:** Migration 021 adds audit triggers for `equipment_checkouts`, `equipment_maintenance`, `clients`, `payments`, and `project_budgets` (in addition to the existing triggers from migration 019 for invoices, expenses, attendance, and leave_requests).
* **Category delete protection:** The `expense_categories` and `equipment_categories` tables now have a `BEFORE DELETE` trigger that prevents deleting a category if it is still in use by existing records.

---

## 📄 License

Internal proprietary software for E5 Chronicles. All rights reserved.
