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

* Uses Supabase Auth under the hood with automatic, role-based routing.
* **Admin Role:** Full dashboard access, global financial metrics, and operational overviews.
* **Employee Role:** Self-service portal focused strictly on their own check-ins, tasks, leave balances, and profile updates.

### 📊 The Operations Dashboard

* **The Health Score:** A real-time, weighted ring gauge that scores the entire company's operational health based on attendance, overdue tasks, active cash flow, and equipment status.
* **Smart Performance Windows:** A unique dual-window approach. Top stat cards show **historical lifetime data** (always cumulative), while the lower domain blocks show **isolated monthly metrics** that reset every month. This keeps performance tracking highly relevant to the current month without losing historical context.
* Optimized via **Incremental Static Regeneration (ISR)** to auto-refresh the data every 5 minutes, preventing constant, heavy DB reads on complex analytics.
* **In-Memory Caching:** The admin dashboard's 35 parallel Supabase queries are wrapped in a `node-cache` layer with 60-second TTL, so repeated hits within the same minute serve data from RAM instead of the database.

### 👥 People, Attendance & Leave

* Real-time employee check-in tracking with status variables (**Present**, **Late**, **Absent**, **Half-Day**).
* Visual admin panels showing yesterday-vs-today attendance trends and 30-day consistency rates.
* A clean leave request calendar view to prevent team scheduling conflicts.

### 🎬 Projects, Tasks & Equipment Inventory

* Kanban-style task lifecycles (**To Do → In Progress → Completed**) mapped directly to client projects.
* Live tracking of expensive gear with distinct statuses (**Available**, **Checked Out**, **In Maintenance**).
* Built-in **QR scanning** via the device camera for instantaneous equipment check-ins/check-outs on set.

### 💰 Invoicing & Expense Tracking

* Complete billing lifecycles from Draft to Paid/Overdue, including native **PDF invoice generation** with custom branding.
* Tracks localized payment routes like Cash, Bank, eSewa, Khalti, and ConnectIPS.
* Secure receipt image uploads mapped straight to Supabase Storage buckets.

---

## 🏗️ Architecture Note: The Routing Proxy

If you look at the root directory, you’ll notice we aren't using a standard Next.js `middleware.ts` file.

Instead, session refreshes and strict admin route protection are handled cleanly by **`src/proxy.ts`**. This acts as a highly optimized middleware replacement engineered specifically to interface flawlessly with Next.js 16’s SSR cookie handshakes.

```
src/
├── proxy.ts                  # Handles session refreshes & route security
├── app/
│   ├── login/                # Entry point
│   ├── admin/                # Admin views (Runs 33 parallel Supabase queries on the main page)
│   └── employee/             # Employee self-service views
├── components/               # Navbars, sidebars, and modular client UI
└── lib/                      # Supabase clients, caching layers, and storage drivers

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

Take the 15 structured migration files located inside `supabase/migrations/` and execute them sequentially against your Supabase project instance to build out the tables, relational indexes, and **Row Level Security (RLS)** guardrails.

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
* **Database Reset Cookie Lock:** If you manually purge or drop your local Supabase database while testing, your browser cookies will temporarily hold a dead session. If the app throws a refresh loop error, simply clear your browser cookies or use an incognito window to log back in.

---

## 📄 License

Internal proprietary software for E5 Chronicles. All rights reserved.
