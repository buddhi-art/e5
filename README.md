# 🎬 E5 Chronicles — Production Management Portal

This is the all-in-one internal portal built to run a fast-paced production house. Instead of fragmenting our operations across a dozen messy Google Sheets and random apps, **E5 Chronicles** centralizes everything: employee attendance, client invoicing, project task lifecycles, equipment tracking (with live QR scanning), and financial health.

Built using **Next.js 16**, **React 19**, and **Supabase**.

---

## 🛠️ The Stack

* **Framework:** Next.js 16 (App Router + Turbopack)
* **Frontend:** React 19 + Framer Motion (for smooth layout transitions)
* **Styling:** Tailwind CSS v4 + shadcn/ui
* **Backend/Auth/DB:** PostgreSQL via Supabase (Cookie-based SSR sessions)
* **Forms & Validation:** React Hook Form + Zod

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
* Secure receipt image uploads mapped straight to Supabase Storage buckets.

---

## 🏗️ Project Structure

```
src/
├── middleware.ts              # Next.js middleware — session refresh & route protection
├── app/
│   ├── login/                 # Entry point
│   ├── admin/                 # Admin views (Powered by a single optimized RPC for dashboard analytics)
│   ├── employee/              # Employee self-service views
│   └── founder/               # Founder strategic overview
├── components/                # Navbars, sidebars, and modular client UI
├── lib/
│   ├── supabase/              # Supabase clients (browser, server, middleware, admin, storage)
│   └── cache.ts               # In-memory node-cache layer (Termux/self-hosted only)
└── types/                     # Shared TypeScript type definitions
```

---

## 🚀 Getting Started

### 1. Spin up the project locally

```bash
git clone https://github.com/buddhi-art/e5.git
cd e5-chronicles
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in your root folder and drop in your keys:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
ADMIN_EMAIL=your-admin-email@domain.com
ADMIN_PASSWORD=your-secure-password
```

### 3. Initialize the Database

Take the 16 structured migration files located inside `supabase/migrations/` and execute them sequentially against your Supabase project instance to build out the tables, relational indexes, **Row Level Security (RLS)** guardrails, and our **advanced RPC functions**.

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
* **checkout_equipment RPC fix:** Migration 019 accidentally replaced the `checkout_equipment` RPC with a **different signature** (`p_user_id`, `p_expected_return_date`, `p_purpose`) than what the server action calls (`p_checked_out_by`, `p_expected_return_at`, `p_condition`, `p_notes`). Migration 021 reverts this to match the server action. If you are on migration 019 or 020, applying migration 021 is **required** for equipment checkout to work.
* **Storage bucket owner-scoping:** The `receipts` bucket was previously readable/writable by any authenticated user. Migration 021 restricts this so only admin/founder can view all receipts, and the bucket owner (the uploader) is the only one who can upload. The `equipment-photos` and `talent-photos` buckets remain public-read for display.
* **Soft-delete column additions:** Migration 021 adds `deleted_at` to `attendance`, `subtasks`, `sub_subtasks`, `equipment_checkouts`, `equipment_maintenance`, `client_meetings`, `expense_categories`, `equipment_categories`, `talent_types`, and `talent_bookings`. Employee-scoped SELECT RLS policies now filter out soft-deleted rows.
* **Audit logs expanded:** Migration 021 adds audit triggers for `equipment_checkouts`, `equipment_maintenance`, `clients`, `payments`, and `project_budgets` (in addition to the existing triggers from migration 019 for invoices, expenses, attendance, and leave_requests).
* **Category delete protection:** The `expense_categories` and `equipment_categories` tables now have a `BEFORE DELETE` trigger that prevents deleting a category if it is still in use by existing records.

---

## 📄 License

Internal proprietary software for E5 Chronicles. All rights reserved.
