# Not Implemented / Partially Implemented Features

This document catalogs every feature in the E5 Chronicles codebase that is either:
- **Not implemented** — infrastructure exists but no actual production usage
- **Partially implemented** — wired up in some places but broken or incomplete in others
- **Not configured** — requires env vars or service setup that hasn't been done

---

## ✅ Changelog — 2026-07-03 (full code session)

### New code written this session:

| # | Item | What was done |
|---|------|--------------|
| **#3** | Receipt URL (expense detail page) | Now generates a signed URL server-side via `getSignedUrl()`. **Done.** |
| **#7 / #4** | Expense status notification | `updateExpenseStatus()` notifies the submitter on approve/reject/reimburse with `sendEmailCopy=true`. **Done.** |
| **#2 / #11** | Env template | `CRON_SECRET` added; `NEXT_PUBLIC_SITE_URL` uncommented. **Done (template).** |
| **#6** | Timesheet approve/reject notifications | `approveTimesheet()` + `rejectTimesheet()` now `createNotification()` to the employee. **Done.** |
| **#14** | Booking status management UI | New `BookingStatusActions` component with Confirm/Complete/Cancel buttons wired into talent detail page. **Done.** |
| **#15** | Timesheet submit notification to admins | Already existed — confirmed `submitTimesheet()` in `employee/timesheets/actions.ts` notifies admins. **Already implemented.** |
| **#8** | Leave balance deduction | Already implemented — `employee/leave/actions.ts` decrements `used_days` on submit + refunds on reject/cancel. **Already implemented.** |
| **#20** | Employee search | Created `EmployeeTableClient` component with live search by name/designation/phone/location. **Done.** |
| **#20** | Client search | Created `ClientTableClient` component with live search by company/nature/contact/phone. **Done.** |
| **#4** | Talent photo signed URLs | Admin talent detail and employee talent directory now use `getSignedUrl()` instead of public URLs. **Done.** |
| **#5** | Expenses page text search | Already existed — `ExpenseTable` client component has search. **Already implemented.** |
| **#5** | Invoices page text search | Already existed — `InvoiceTable` client component has search. **Already implemented.** |

### Found already implemented (doc was stale):

- **"Mark as Reimbursed" button** — already present in `expense-actions.tsx` and `expense-table.tsx`.
- **Leave type name in employee history** — already rendered at `employee/leave/page.tsx`.
- **Equipment photo display** — `EquipmentList` already uses `StorageImage` which generates signed URLs client-side.
- **Task assigned notification** — `admin/tasks/actions.ts` `assignTask()` already calls `createNotification()` with `sendEmailCopy=true` to the assignee.
- **Overdue invoice notification** — `updateOverdueInvoices()` in `admin/invoices/actions.ts` already creates notifications for each admin.

> ⚠️ **Important side effect:** the new expense notifications call `createNotification(..., sendEmailCopy=true)`. In-app notifications work now, but **emails will only send once you complete #1 (email provider setup)**. Until then `EMAIL_PROVIDER=dev` just logs to console — no errors, no emails.

---

## 1. Email Notifications (Not Configured / Not Triggered)

**Status**: Infrastructure exists, never used in production

**Files**: `src/lib/email.ts`, `src/lib/notifications.ts`

**Problem**:
- `EMAIL_PROVIDER` defaults to `dev`, which only logs to console — no emails are ever sent.
- The `createNotification()` function accepts `sendEmailCopy` parameter. Many call sites now pass `true`, but without an email provider configured, the email branch just logs.
- The SMTP provider (`sendViaSmtp`) is a **stub** — logs to console and returns `success: true` without sending. It also requires `nodemailer` which is not installed.

**Solution**:
1. Sign up for Resend (or SendGrid/SMTP) and set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`
2. To actually use SMTP: `npm install nodemailer` then set `EMAIL_PROVIDER=smtp` + `SMTP_*` env vars
3. Implement actual `sendViaSmtp()` function body in `src/lib/email.ts`

---

## 2. CRON Job Secret (Not Configured)

**Status**: Code exists, env var in template

**File**: `src/app/api/cron/mark-overdue-invoices/route.ts`

**Problem**:
- The only API cron route checks for `CRON_SECRET` bearer token, which is now in `.env.local.example`.
- There's only **one** cron endpoint. Additional useful cron jobs are missing:
  - Daily attendance status auto-marking
  - Weekly KPI recomputation
  - Invoice overdue reminders
  - Leave balance accrual
  - Equipment checkout overdue notifications

**Solution**:
1. ✅ `CRON_SECRET` is now in `.env.local.example` (with generation instructions).
2. ⬜ **YOU:** copy it into your real `.env.local` with an actual secret value — generate one with `openssl rand -hex 32`.
3. ⬜ **YOU:** set up a scheduler (Vercel Cron, GitHub Actions, or external) that hits `https://<your-domain>/api/cron/mark-overdue-invoices` with header `Authorization: Bearer <secret>`.
4. ⬜ Additional cron routes — requires new code.

---

## 3. Receipt Storage URLs (✅ FIXED 2026-07-03)

**Status**: ✅ Fixed — expense detail page now uses a signed URL

**Files**:
- `src/app/admin/expenses/actions.ts` (upload — stores storage path)
- `src/app/admin/expenses/[id]/page.tsx` (display — uses signed URL)
- `src/components/receipt-link.tsx` (client component — properly uses signed URLs)

**Solution**:
1. ✅ **DONE** — `src/app/admin/expenses/[id]/page.tsx` now calls `getSignedUrl('receipts', expense.receipt_url)` server-side and uses the result for both the `<img>` preview and the "Open Full Size" link.
2. ⬜ **YOU (verify only):** confirm the `receipts` bucket exists in Supabase and is **private** with RLS policies allowing signed-URL access for admins/founders. If the bucket doesn't exist yet, uploads will fail — create it in the Supabase dashboard → Storage.

---

## 4. Equipment / Talent Photo Storage (✅ FIXED 2026-07-03)

**Status**: ✅ Talent photos now use signed URLs. Equipment already used `StorageImage`.

**Files**:
- `src/app/admin/talents/[id]/page.tsx` — now uses `getSignedUrl()` server-side
- `src/app/employee/talents/page.tsx` — now uses `getSignedUrl()` server-side
- `src/app/admin/equipment/equipment-list.tsx` — already uses `StorageImage` with signed URLs
- `src/app/employee/equipment/equipment-photo.tsx` — already uses `getStorageSignedUrl` client-side

**What's still needed**:
- ⬜ The admin talents grid (`talents-grid.tsx`) still constructs a hardcoded public URL — should be refactored to a server component that generates signed URLs, OR use a `StorageImage` client component.
- ⬜ **YOU:** verify if `talent-photos` and `equipment-photos` buckets are public or private in Supabase dashboard. If public, hardcoded URLs will work (but signed URLs still function). If private, the grid needs fixing.

---

## 5. Notification Coverage (Incomplete)

**Status**: System exists, 6 event types now generate notifications

**Files**: `src/lib/notifications.ts`, `src/app/actions/notifications.ts`, `src/components/notification-dropdown.tsx`

**Notifications now created in these places:**
1. ✅ Invoice overdue (in `admin/invoices/actions.ts`)
2. ✅ Task blocked on Kanban (in `admin/kanban/actions.ts`)
3. ✅ Leave approved (in `admin/leave/actions.ts`)
4. ✅ Leave rejected (in `admin/leave/actions.ts`)
5. ✅ Expense approved / rejected / reimbursed (in `admin/expenses/actions.ts`)
6. ✅ Task assigned to employee (in `admin/tasks/actions.ts`)
7. ✅ Timesheet submitted (in `employee/timesheets/actions.ts`)
8. ✅ Timesheet approved / rejected (in `admin/timesheets/actions.ts`)

**Still missing notification triggers**:
- Task deadline approaching (1-day and 1-week reminders) — needs a cron job
- Equipment checkout assigned to you (already has `sendEmailCopy=true`; notification created in `admin/equipment/actions.ts`)
- Equipment return overdue — needs a cron job
- New invoice created (notify client contact)
- Attendance check-in reminder (if not checked in by 10 AM) — needs a cron job
- Project status change
- Talent booking confirmed / cancelled — could be added to `updateBookingStatus()`
- Leave request submitted (notify admins)

---

## 6. Timesheet Approval Workflow (✅ DONE 2026-07-03)

**Status**: ✅ Fully implemented

- Approve/reject buttons on admin timesheet detail page: **already existed**
- Server actions `approveTimesheet()` / `rejectTimesheet()` in `admin/timesheets/actions.ts`: **already existed**
- `createNotification()` calls now added to both actions: **DONE**
- Employee timesheet submission already notifies admins: **DONE**

---

## 7. Expense Reimbursement Tracking (Partially Implemented)

**Status**:
- ✅ "Mark as Reimbursed" button — already present
- ✅ Expense status notification via `createNotification()` — done
- ⬜ **Needs code + migration:** add reimbursement metadata fields (`reimbursed_at`, `reimbursed_by`, `payment_method`, `payment_reference`) via a Supabase migration, plus a small form to capture them.

---

## 8. Leave Balance Deduction (✅ ALREADY IMPLEMENTED)

**Status**: ✅ Already implemented in `employee/leave/actions.ts`

- `requestLeave()` decrements `used_days` optimistically on submit
- `cancelLeave()` refunds balance
- `rejectLeave()` in admin actions refunds balance

---

## 9. Attendance Auto-Late Detection (Not Implemented)

**Status**: Attendance is recorded manually, no automated late/absent marking

**Files**: `src/app/employee/attendance/attendance-form.tsx`

**Problem**:
- Attendance records are created with a status (`present`, `absent`, `late`, `half-day`)
- The status must be set manually during check-in
- There's no automatic detection of late arrivals or absent employees at end of day

**Solution**:
1. Add a cron job that runs at end of day (e.g., 6 PM) and marks any employee without a check-in record as `absent`
2. Add configurable late threshold (e.g., check-in after 10 AM = `late`)
3. Send `createNotification()` for missed check-ins

---

## 10. Founders Cannot Take Actions (By Design but Limiting)

**Status**: Read-only dashboard, no action capabilities

**Files**: `src/app/founder/page.tsx`, `src/app/founder/founder-dashboard-client.tsx`

**Problem**:
- The founder dashboard is view-only. Founders cannot approve expenses, manage budgets, or take actions without logging in as admin.

**Solution**:
1. Add action buttons to founder dashboard for key operations (approve expenses, manage budgets)
2. Create shared server actions that check `role = 'founder' OR role = 'admin'`
3. Add a "Take Action" section to the founder dashboard with quick links

---

## 11. `NEXT_PUBLIC_SITE_URL` Not in Env Template (✅ FIXED 2026-07-03)

**Status**: ✅ Fixed in template — you must still set the real value.

---

## 12. Insufficient Test Coverage

**Status**: Only 3 test files with limited scope

**Files**: `src/lib/__tests__/invoice-numbering.test.ts`, `src/lib/__tests__/checkout-atomicity.test.ts`, `src/lib/__tests__/rls-access.test.ts`

**Problem**:
- No tests for server actions, validation schemas, component tests, or API route tests

**Solution**:
1. Add unit tests for all Zod validation schemas in `src/lib/validations.ts`
2. Add integration tests for each server action
3. Add component tests for critical UI (forms, dialogs, data tables)
4. Set up Supabase local for test database
5. Add GitHub Actions CI to run `npm test`

---

## 13. Database Migration Rollbacks (Partial)

**Status**: Rollback SQL files exist for 018-027 only

**Files**: `supabase/rollbacks/*.sql`

**Solution**:
1. Create rollback scripts for migrations 01-017
2. Add a `npm run rollback:last` script

---

## 14. Talent Booking Status Management (✅ DONE 2026-07-03)

**Status**: ✅ Fully implemented.

- New `BookingStatusActions` component wired into each booking on the talent detail page
- Actions: Confirm Booking (proposed → confirmed), Mark Completed (confirmed → completed), Cancel Booking (proposed/confirmed → cancelled)
- Calls existing `updateBookingStatus()` server action

---

## 15. Timesheet Entry Validation (Not Implemented)

**Status**: Employees can submit overlapping timesheet entries

**Files**: `src/app/employee/timesheets/new/timesheet-form.tsx`

**Solution**:
1. Add validation in the timesheet creation action to check for overlapping entries
2. Add configurable maximum weekly hours (e.g., 48 hours)

---

## 16. Client Meeting Reminders (Not Implemented)

**Status**: Meetings can be scheduled but no reminders are sent

**Files**: `src/app/admin/clients/[id]/client-meeting-dialog.tsx`

**Solution**:
1. Add a cron job that checks for upcoming meetings (within 24 hours) and sends notifications
2. Add email reminder sending via `sendEmail` in `src/lib/email.ts`
3. Add a "Mark as Completed" button after the meeting date passes

---

## 17. Equipment Maintenance Scheduling (Incomplete)

**Status**: Maintenance records exist but no recurring schedule

**Files**: `src/app/admin/equipment/maintenance/*`

**Solution**:
1. Add `recurring_days` field to maintenance schema for recurring maintenance
2. Add a cron job that creates maintenance records automatically based on recurrence

---

## 18. Invoice Auto-Numbering Edge Cases (Partial)

**Status**: Basic numbering works via `generate_invoice_number` RPC

**Solution**:
1. Use database-level locking or a `SELECT ... FOR UPDATE` pattern to prevent duplicate numbers
2. Add client-level invoice prefix option
3. Add separate counter for credit notes

---

## 19. No Data Export / Reporting

**Status**: No CSV, Excel, or PDF export for any data tables

**Problem**:
- Users cannot export employee lists, invoices, expenses, or attendance data
- The only PDF export is for individual invoices (`print-button.tsx`)

**Solution**:
1. Add CSV export buttons to data tables (employees, invoices, expenses, attendance)
2. Add a Reports page with aggregatable data (profit & loss, project profitability, etc.)

---

## 20. Search / Filtering Consistency (Partially Implemented)

**Status**: Some pages have search, others don't

| Page | Search | Status |
|------|--------|--------|
| Talents (admin grid) | ✅ Text search + type/status filters | Already existed |
| Employees | ✅ Text search | **DONE 2026-07-03** |
| Clients | ✅ Text search | **DONE 2026-07-03** |
| Expenses | ✅ Text search + status/project filters | Already existed |
| Invoices | ✅ Text search + status/client filters | Already existed |
| Equipment | ✅ Text search + category/status filters | Already existed |

---

## Summary Priority Matrix

| Priority | Feature | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| 🔴 High | Email provider setup + enable `sendEmailCopy` | Small | Critical — notifications don't send emails | ⬜ **YOU** (needs account/API key) |
| 🔴 High | Receipt URL fix for expense detail page | Small | Feature broken | ✅ Done |
| 🔴 High | Add `CRON_SECRET` + cron job setup | Small | Invoice overdue auto-marking broken | 🟨 Template done; ⬜ **YOU** schedule cron |
| 🟡 Medium | Notification coverage for missing events | Medium | Inconsistent UX | 🟨 8/12 event types done |
| 🟡 Medium | Timesheet approval workflow | Medium | Missing workflow | ✅ Done |
| 🟡 Medium | Booking status management | Small | Missing UI | ✅ Done |
| 🟡 Medium | Talent photo signed URLs (detail + employee) | Small | Potential broken images | ✅ Done |
| 🟡 Medium | Expense reimbursement payment fields | Small | Missing workflow | ⬜ Needs migration + code |
| 🟡 Medium | Employee + client search bars | Small | UX improvement | ✅ Done |
| 🟢 Low | Equipment/talent photo bucket verification | Small | Potential future breakage | ⬜ **YOU** (dashboard check) |
| 🟢 Low | Test coverage | Large | Code quality | ⬜ Needs code |
| 🟢 Low | Data export / reporting | Large | Nice-to-have | ⬜ Needs code |
| 🟢 Low | Search/filter consistency | Medium | UX improvement | 🟨 6/6 pages done |

---

## 🚦 Your Next Steps (what I couldn't do in code)

These require **your accounts, secrets, or hosting/dashboard access** — they can't be done from the codebase alone. Ordered by priority.

### Step 1 — 🔴 Set up the email provider (unblocks ALL email notifications)

Right now `EMAIL_PROVIDER=dev`, which only logs to the console. In-app notifications work, but **no emails are sent** until this is done. Multiple notification points now request email copies (`sendEmailCopy=true`), so they'll start working automatically once this is configured.

**Recommended: Resend (easiest)**
1. Create an account at [resend.com](https://resend.com) and verify your sending domain (e.g. `e5chronicles.com`).
2. Create an API key (starts with `re_`).
3. In `.env.local` (and your hosting env vars) set:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY="re_xxxxxxxxxxxx"
   EMAIL_FROM="E5 Chronicles <notifications@e5chronicles.com>"
   ```
4. Redeploy / restart the dev server.
5. Test: approve an expense as admin — the submitter should receive an email.

**Alternative: SMTP** (only if you already have an SMTP server)
- Requires code work first: `sendViaSmtp()` in `src/lib/email.ts` is a **stub** and `nodemailer` is **not installed**. Run `npm install nodemailer`, then ask me to implement the `sendViaSmtp()` body. Then set `EMAIL_PROVIDER=smtp` + `SMTP_HOST/PORT/USER/PASS`.

### Step 2 — 🔴 Set real env values + schedule the invoice cron

The template now has `CRON_SECRET` and `NEXT_PUBLIC_SITE_URL`, but you must set real values and wire the scheduler.

1. In `.env.local` (and hosting env vars) set:
   ```env
   CRON_SECRET="<output of: openssl rand -hex 32>"
   NEXT_PUBLIC_SITE_URL="https://your-real-domain.com"
   ```
2. Schedule the existing route `/api/cron/mark-overdue-invoices` to run daily. Pick one:
   - **Vercel Cron** — add to `vercel.json`:
     ```json
     { "crons": [{ "path": "/api/cron/mark-overdue-invoices", "schedule": "0 6 * * *" }] }
     ```
     Set `CRON_SECRET` in Vercel project env; Vercel automatically sends the bearer token.
   - **GitHub Actions** — a scheduled workflow that runs:
     ```bash
     curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/mark-overdue-invoices
     ```
   - **External cron** (cron-job.org, EasyCron, etc.) — same curl with the header.
3. Verify: create/backdate an overdue invoice, trigger the endpoint, confirm it flips to overdue.

### Step 3 — 🟢 Verify Supabase storage buckets (dashboard check, ~5 min)

In Supabase dashboard → **Storage**, confirm these buckets exist and note public vs private:
- `receipts` — should be **private** (code now uses signed URLs). ✅ handled in code.
- `talent-photos` — check public vs private. Code now uses signed URLs.
- `equipment-photos` — check public vs private. `StorageImage` handles signed URLs client-side.

If any bucket is **private**, the signed URL code handles it. If **public**, the code still works (signed URL generation falls back to public URL). No action needed regardless — but verify the admin talent grid (`talents-grid.tsx`) still needs to be updated to use signed URLs if the bucket is private.

### Step 4 — Optional: pick the next feature for me to build

Everything below is **pure code** (no accounts needed) — just tell me which to start:
- **#7 Expense reimbursement payment fields** — `reimbursed_at` / `payment_method` / `payment_reference` (needs a migration)
- **#5 Notification triggers for equipment return overdue, booking status changes, and leave request submitted**
- **#15 Validate overlapping timesheet entries + weekly hour cap**
- **#9 Attendance auto-late/absent cron job**
- **#19 CSV/Excel export on data tables (employees, invoices, expenses, attendance)**
- **#10 Founder action capabilities (approve expenses, manage budgets)**
- **#5 Admin talent grid signed URLs** (small fix to `talents-grid.tsx`)
- **#16 Client meeting reminders cron**
- **#17 Recurring equipment maintenance scheduling**
- **#18 Invoice auto-numbering edge cases (concurrent creation guard)**
- **#12 Test coverage**
- **#13 Missing migration rollbacks (01-017)**

Recommended order: **#7 (payment fields)** → **#5 (remaining notifications)** → **#15 (timesheet validation)** — completing the finance and HR workflows that everything else hooks into.
