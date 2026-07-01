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
* **In-Memory Caching:** This single RPC call is further wrapped in a `node-cache` layer with a 60-second TTL, serving repeated hits within the same minute directly from RAM.

### 👥 People, Attendance & Leave

* **Optimistic Check-ins:** Real-time employee check-in tracking with status variables (**Present**, **Late**, **Absent**, **Half-Day**) featuring instant Optimistic UI feedback.
* Visual admin panels showing yesterday-vs-today attendance trends and 30-day consistency rates.
* A clean leave request calendar view to prevent team scheduling conflicts.

### 🎬 Projects, Tasks & Equipment Inventory

* Kanban-style task lifecycles (**To Do → In Progress → Completed**) mapped directly to client projects.
* Live tracking of expensive gear with distinct statuses (**Available**, **Checked Out**, **In Maintenance**).
* **Atomic Checkouts:** Equipment checkout features robust Postgres RPC functions (`checkout_equipment`) preventing race conditions and keeping status perfectly synced.
* Built-in **QR scanning** via the device camera for instantaneous equipment check-ins/check-outs on set.

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
* **`node-cache` (in-memory cache):** The app uses `node-cache` with a 600s TTL in `src/lib/cache.ts` for dashboard analytics. This works well on Termux or any long-running Node process (e.g., self-hosted VPS), but **will not provide caching across cold starts on serverless platforms** (Vercel, Netlify). Each serverless instance starts with an empty cache. If deploying to serverless, either accept the cache is per-instance or swap in an external cache like Upstash Redis.
* **PDF Generation:** Invoice PDFs are generated **client-side** using `jspdf` + `html2canvas` (`npm install` already includes both). The `PrintButton` component on the invoice detail page renders the invoice content to a canvas and produces a downloadable PDF. This approach avoids a server-side PDF library dependency and works offline, but **cannot be used to e-mail invoices automatically** from the server. For automated PDF delivery, a server-side solution (e.g., `@react-pdf/renderer` or a Puppeteer-based worker) would need to be added separately.

---

## 📄 License

Internal proprietary software for E5 Chronicles. All rights reserved.
