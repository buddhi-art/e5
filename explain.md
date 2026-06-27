# E5 Chronicles — Operations Dashboard: Complete Reference

> **Source files:** `src/app/admin/page.tsx` (server — data fetching & aggregation)  
> `src/components/admin-dashboard-client.tsx` (client — rendering & animations)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Header & Health Score Ring](#2-header--health-score-ring)
3. [People & Attendance Section](#3-people--attendance-section)
4. [Production & Tasks Section](#4-production--tasks-section)
5. [Finance & Operations Section](#5-finance--operations-section)
6. [Equipment & Resources Section](#6-equipment--resources-section)
7. [Bottom Row — Panels](#7-bottom-row--panels)
   - 7.1 Today's Attendance Panel
   - 7.2 Recent Tasks Panel
   - 7.3 Quick Actions
   - 7.4 Ecosystem Summary
8. [Domain Score Blocks — Why 0/1, 0/8, 0/5, 0/10?](#8-domain-score-blocks--why-01-08-05-010)
9. [Health Score Calculation](#9-health-score-calculation)
10. [Data Flow & Lifecycle](#10-data-flow--lifecycle)

---

## 1. Architecture Overview

The dashboard is a **React Server Component + Client Component** split:

- **`admin/page.tsx`** (Server Component, ISR every 5 minutes): Makes ~30 parallel Supabase queries, computes all derived metrics, and passes them as a flat `HealthMetrics` object to the client.
- **`admin-dashboard-client.tsx`** ('use client'): Receives the data and renders all the cards, charts, animations, and progress bars.

The split exists because:
- **Why server?** Supabase queries need the service role key and RLS bypass. Running them server-side keeps secrets safe and reduces client bundle size.
- **Why client?** The animated counters (`AnimatedNumber`), morph animations, and interactive hover states need browser APIs.

---

## 2. Header & Health Score Ring

### What you see
- Title: "Operations Dashboard"
- Subtitle: "{month} ecosystem analysis — {N} employees, {N} active projects, {N} active clients"
- A circular ring gauge showing a **Health Score** percentage (0–100%).

### How it is computed
```typescript
const healthScore = Math.round(
  attendanceRate * 0.25 +
  taskHealth * 0.25 +
  financeHealth * 0.20 +
  projectHealthPercent * 0.15 +
  equipHealth * 0.15
)
```
Each sub-score is computed from live database data (see §9 for full breakdown).

### Why it exists
Provides a single-glance "temperature check" of the entire operation. The colour bands are:
- ≥ 80 → **Emerald** (Healthy)
- 60–79 → **Amber** (Needs attention)
- 40–59 → **Orange** (Concerning)
- < 40 → **Red** (Critical)

### Why it might show an unexpected value
- If attendance, tasks, finance, projects, or equipment have no data yet, the fallback values push the health toward 70–85 rather than 0 (see §9 fallback logic). An empty system will show a **misleadingly high** health score.

---

## 3. People & Attendance Section

### Stat Cards (6 cards in a grid)

| Card | Data Source | Formula |
|------|-------------|---------|
| **Total Employees** | `profiles WHERE role='employee' AND deleted_at IS NULL` | Raw count |
| **Checked In** | `attendance WHERE date=today AND status NOT IN ('absent','on_leave')` | Count + suffix `"/{total}"` |
| **On Leave** | `leave_requests WHERE status='approved' AND start_date<=today AND end_date>=today` | Count |
| **Late** | `attendance WHERE date=today AND status='late'` | Count |
| **Absent** | `attendance WHERE date=today AND status='absent'` | Count |
| **Attendance Rate** | Last 30 days: `(present + late records) / (total working days × total employees)` × 100 | Percentage (1 decimal) |

### Domain Score blocks below the cards

| Block | Score | Max | Logic |
|-------|-------|-----|-------|
| **Attendance Health** | `Math.round(attendanceRate)` | 100 | Direct percentage |
| **Check-in Compliance** | `checkedInToday` | `totalEmployees` | Raw count vs headcount |
| **Leave Utilization** | `onLeaveToday` | `Math.max(totalEmployees, 1)` | How many used leave today |

### Trend
The **Total Employees** card shows `+N` or `-N` for employee count change — computed by comparing current count to employees created before 30 days ago.

### Why 0/8 for Check-in Compliance?
If you have **8 employees** and **none have checked in today**, the score is **0/8**. This is correct behaviour for a system that isn't operational yet. Once people start checking in, the numerator will increase.

---

## 4. Production & Tasks Section

### Stat Cards (6 cards)

| Card | Data Source | Notes |
|------|-------------|-------|
| **Active Projects** | `projects WHERE status != 'completed'` | Shows `{X}% healthy` subtitle |
| **Total Tasks** | Sum of pending + in_progress + completed | |
| **In Progress** | `tasks WHERE status='in_progress'` | |
| **Completed** | `tasks WHERE status='completed'` | |
| **Overdue** | `tasks WHERE deadline < today AND status != 'completed'` | |
| **On-Time Rate** | `completed / max(completed + overdue, 1) × 100` | Has trend arrow |

### Domain Score blocks

| Block | Score | Max | Logic |
|-------|-------|-----|-------|
| **Task Completion (This Month)** | `completedTasksThisMonth` | `Math.max(tasksThisMonth, 1)` | Tasks completed this month ÷ tasks created this month (see note below) |
| **Project Health** | `projectHealthPercent` | 100 | % of projects with status `in_progress` or `not_started` (not stuck/broken) |
| **On-Time Delivery** | `Math.round(onTimeCompletion)` | 100 | Mirrors the On-Time Rate stat |

### Why "Task Completion = 0/1"?
`Math.max(tasksThisMonth, 1)` ensures the denominator is **never zero** (to avoid division by zero). When there are zero tasks created this month:
- Completed = 0
- Max = max(0, 1) = 1
- Score = 0/1

### Monthly window for Task Completion
This metric now uses a **monthly window** — it only counts tasks created within the current calendar month (filtered by `created_at >= startOfMonth AND <= endOfMonth`). The stat card above ("Total Tasks" / "Completed") still shows **lifetime** totals for historical reference, but the Domain Score block resets to 0 each month.

If you create 7 tasks this month and complete 3, it will show **3/7**. Next month it resets to 0/0 → displayed as 0/1.

---

## 5. Finance & Operations Section

### Stat Cards (6 cards)

| Card | Data Source | Notes |
|------|-------------|-------|
| **Draft Invoices** | `invoices WHERE status='draft'` | Not yet sent |
| **Active (Sent)** | `invoices WHERE status IN ('sent','partially_paid')` | Awaiting payment |
| **Overdue** | `invoices WHERE status='overdue'` | Past due |
| **Paid** | `invoices WHERE status='paid'` | Fully settled |
| **Revenue** | Sum of `grand_total` for invoices issued this month (`status NOT IN cancelled, draft`) | Compared to last month for trend |
| **Budget Used** | `(totalExpenses / totalBudget) × 100` | Expenses ÷ project budget allocations |

### Total Receivables
`SUM(grand_total - paid_amount) for invoices with status sent/overdue/partially_paid`

### Domain Score blocks

| Block | Score | Max | Logic |
|-------|-------|-----|-------|
| **Collection Rate (This Month)** | `monthlyInvoicesPaid` | `Math.max(monthlyInvoicesTotal, 1)` | Paid invoices issued this month ÷ all invoices issued this month |
| **Budget Discipline** | `100 - min(budgetUtilization, 100)` | 100 | Inverse — higher = more budget remaining |
| **Pending Approvals** | `pendingExpenses + pendingLeaveRequests` | `max(actual, 5)` | Items awaiting manager approval |

### Monthly window for Collection Rate
This metric now uses a **monthly window** — it only considers invoices issued within the current calendar month (filtered by `issue_date >= startOfMonth AND <= endOfMonth`). The stat cards above still show **lifetime** totals (Draft / Active / Overdue / Paid), but this Domain Score resets to 0 each month.

### Why "Pending Approvals = 0/5"?
The max is `max(actualPendingCount, 5)` — when pending approvals is 0, it shows `0/5` to give visual context. 5 is an arbitrary "ceiling for display purposes." Once you have 12 pending approvals, it would show `12/12` (since max(12, 5) = 12).

---

## 6. Equipment & Resources Section

### Stat Cards (4 cards)

| Card | Data Source |
|------|-------------|
| **Available** | `equipment WHERE status='available'` |
| **Checked Out** | `equipment WHERE status='checked_out'` |
| **In Maintenance** | `equipment WHERE status='maintenance'` |
| **Total Clients** | `clients` count + `{N} meetings` subtitle |

### Domain Score blocks

| Block | Score | Max | Logic |
|-------|-------|-----|-------|
| **Equipment Availability** | `equipmentAvailable` | `max(available + checkedOut + inMaintenance, 1)` | Available ÷ total equipment |
| **Client Engagements (This Month)** | `meetingsThisMonth` | `Math.max(meetingsThisMonth, 10)` | Meetings this month vs floor of 10 |

### Why "Equipment Availability = 0/1"?
Same pattern — when there are zero equipment items, the denominator is `max(0, 1) = 1`, so it shows 0/1. Once equipment is added, it shows the real ratio.

### Monthly window for Client Engagements
This metric now uses a **monthly window** — it only counts meetings with `meeting_date` in the current calendar month. This resets to 0 each month. The stat card subtitle ("{N} meetings") still shows the **lifetime** total for historical reference.

### Why "Client Engagements = 0/10"?
When meetings this month = 0, the denominator is `max(0, 10) = 10`. This gives a visual "out of 10" reference. If you have 3 meetings this month, it would show 3/10. If you have 15 meetings, it shows 15/15 (full bar).

---

## 7. Bottom Row — Panels

### 7.1 Today's Attendance Panel
- Shows the first 7 attendance entries for today (with avatar initials and check-in time).
- If no entries, shows an empty state: "No attendance records for today."
- **Use case:** Quick morning check — who's in the office right now.

### 7.2 Recent Tasks Panel
- Lists the 5 most recently created tasks, grouped under their project name.
- Shows task status with colour-coded badges (Completed = green, In Progress = orange, To Do = grey).
- **Use case:** See what just landed on people's plates.

### 7.3 Quick Actions
Four shortcut buttons:
1. **Record Attendance** → `/admin/attendance`
2. **Create Invoice** → `/admin/invoices/new`
3. **Assign Task** → `/admin/tasks`
4. **Add Employee** → `/admin/employees`

### 7.4 Ecosystem Summary
The gradient card with four progress bars:

| Metric | Percentage Logic |
|--------|-----------------|
| **People** | `checkedInToday / totalEmployees × 100` |
| **Tasks** | `completedTasks / totalTasks × 100` (or 0 if no tasks) |
| **Revenue** | `revenueThisMonth / revenueLastMonth × 100`, capped at 100% (or **0** if no last-month revenue — this was the bug that showed half-green) |
| **Equipment** | `available / (available + checkedOut + inMaintenance) × 100` |

Bottom shows "System health score" with the same colour-coding as the health ring.

---

## 8. Domain Score Blocks — Why 0/1, 0/8, 0/5, 0/10?

Every `DomainScore` block uses this pattern:

```tsx
function DomainScore({ label, score, max, icon }) {
  const pct = max > 0 ? Math.min(Math.round((score / max) * 100), 100) : 0
  // ...
}
```

| Display | Actual `score` | Actual `max` | Why |
|---------|---------------|--------------|-----|
| **0/1** | 0 | `Math.max(realValue, 1)` | Avoids division by zero. Real data hasn't been entered yet. |
| **0/8** | 0 | 8 | 8 employees exist, 0 checked in. Correct — no one's clocked in. |
| **0/5** | 0 | `Math.max(pendingApprovals, 5)` | Floor of 5 for visual scale. Zero pending items naturally. |
| **0/10** | 0 | `Math.max(totalMeetings, 10)` | Floor of 10 for visual scale. No meetings recorded yet. |

**The key insight:** When the system is new and empty, these denominators create artificial "maximums" for the progress bar to render against. They are **display defaults**, not data. Once real data flows in, the denominators become actual values.

---

## 9. Health Score Calculation

```
healthScore = attendanceRate × 0.25
            + taskHealth × 0.25
            + financeHealth × 0.20
            + projectHealthPercent × 0.15
            + equipHealth × 0.15
```

### Sub-score formulas

| Component | Formula | Fallback (if no data) |
|-----------|---------|-----------------------|
| **Attendance Health** | `attendanceRate` (already 0–100) | N/A — rate handles 0 |
| **Task Health** | `Math.round((onTimeCompletion / 100) × 100)` | **50** if no completed tasks |
| **Finance Health** | `Math.round((1 - min(budgetUtilization / 100, 1)) × 100)` | **70** if no expenses |
| **Project Health** | `projectHealthPercent` (healthy / total × 100) | 100 if no projects |
| **Equipment Health** | `available / total × 100` | **80** if no equipment |

### Why an empty system scores high (~65–75%)
Three of the five sub-scores have **optimistic fallbacks**:
- Task Health defaults to **50** (not 0)
- Finance Health defaults to **70** (not 0)
- Equipment Health defaults to **80** (not 0)

This means a brand-new system with no data shows a health score around 65–75 ("Needs attention" / borderline "Healthy"), even though nothing is actually running. This is intentional design — the health score is meant to track **deviation from normal operations**, not absolute readiness. As real data populates, the score will reflect actual conditions.

---

## 10. Data Flow & Lifecycle

```
Browser request → Next.js Server
                       │
                 src/app/admin/page.tsx
                       │
                 33 concurrent Supabase queries (Promise.all) — including 4 new monthly-windowed queries for Domain Scores
                       │
                 Derived metrics computed
                       │
                 <AdminDashboardClient data={...}>
                       │
                 Animated counters start
                       │
                 ISR revalidates every 300 seconds (5 min)
```

### ISR note
The page uses `export const revalidate = 300` — **Incremental Static Regeneration**. Every 5 minutes, the server re-fetches all data and re-renders the page. Users see the cached version between revalidations. This means:
- Dashboard data is **at most 5 minutes stale**
- To see fresh data immediately after making changes, you need to wait for revalidation or do a manual page refresh
