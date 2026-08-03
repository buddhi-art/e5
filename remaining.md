# Remaining Work — E5 Chronicles

Status of the audit-driven cleanup. Tasks 1–2 are **done and verified** (typecheck clean,
105/105 tests pass). Everything below is what's left. Line numbers are accurate as of
this writing; re-grep before editing since earlier edits shift them.

Baseline to keep green after every change:
```
npm run lint && npm run typecheck && npm test
```

---

## ✅ Already done (do not redo)

1. **Shared page guard + broken-redirect fix.** Created `src/lib/auth/page-guard.ts`
   (`requireAdminOrFounder`, `requireFounder`). Replaced the 21 inline
   `if (profile?.role !== 'admin') redirect('/employee/dashboard')` blocks (the target
   route `/employee/dashboard` never existed → 404, and the check locked out Founders).
   Layouts and `proxy.ts` now route through `isFounder` from `src/lib/auth/roles.ts`.
2. **Auth consolidation.** `src/lib/auth/roles.ts` is the single source of truth for the
   founder rule. `src/lib/auth-utils.ts` (`verifyAdminOrFounder`, used by 14 action files)
   now delegates to `isAdminOrFounder`. Dead modules `src/lib/auth/auth-utils.ts` and
   `src/lib/errors/*` were removed. `src/app/actions/notifications.ts` and
   `src/app/actions/subtask-comments.ts` inline founder checks now use the helper.
3. **Fixed latent bug** in `src/lib/action-error.ts`: `_Sentry` was initialised to `null`
   but the guard checked `=== undefined`, so the Sentry import never ran. Now `undefined`
   = not-yet-attempted, `null` = unavailable.

---

## 3. Route remaining caught errors to Sentry (IN PROGRESS)

Helper already exists: `captureActionError(context, caught)` in
[src/lib/action-error.ts](e5-chronicles/src/lib/action-error.ts) — logs a structured line
**and** calls `Sentry.captureException`, returns the user-safe message string. Pattern:

```ts
} catch (err: unknown) {
    return { error: await captureActionError('actionName', err) }
}
```

### 3a. `src/app/admin/packages/actions.ts` — no import yet, 19 top-level catches
Add `import { captureActionError } from '@/lib/action-error'` and migrate the top-level
catches. **Preserve return shape per action** — they are not uniform:
- L163 → `return { data: [], total: 0, error: await captureActionError('getPackages', err) }`
- L197, 379, 464, 498, 616, 639, 703, 788, 863, 897, 933, 1006, 1044, 1149, 1205, 1273, 1336
  → all `return { error: ... }` shape.
- **L1399 rethrows** (`throw err`) — keep the throw, but call `captureActionError` first
  (or `Sentry.captureException`) so it's still reported before rethrow. Do NOT convert to
  an `{ error }` return; caller (`getPendingFounderReviews`) depends on the throw.

Intermediate (non-top-level) `console.error` in this file — decide per case, low priority:
- L158 (`Error fetching packages`) — before an early `return {..., error}`.
- L405 (`getPackageWorkspace` main fetch) — before early return.
- L423 (project assets) — non-fatal, logs only, continues. Leave or downgrade.
- L1394 — before the `throw new Error(...)` in `getPendingFounderReviews`.

### 3b. Non-fatal intermediate logs in already-migrated files (lower priority)
These files' **top-level** catches already call `captureActionError`. The lines below are
secondary/non-fatal branches (return early with a specific message, or log-and-continue).
Route to Sentry only if you want visibility on them:
- `src/app/admin/tasks/actions.ts:107` (deliverable sync, non-fatal), `:163` (subtask parse), `:400` (per-item sync, continues)
- `src/app/admin/invoices/actions.ts:347` (bulk overdue update), `:372` (overdue notifications, non-fatal)
- `src/app/admin/expenses/actions.ts:64` (receipt upload → returns error)
- `src/app/admin/employees/kpi-actions.ts:18` (rpc error → returns error)

### 3c. Not `{ error }` contract — leave as-is
- `src/app/actions/storage.ts:43,49` — `getStorageSignedUrl` returns `null`, not `{ error }`.
- `src/app/employee/actions.ts:164` — inside **private** helper
  `triggerTaskCompletionNotifications` (best-effort, deliberately void). Optional.

---

## 4. Add `.catch` to signed-URL call sites

Three `.then(...)` without `.catch`. Mirror the correct pattern already in
[src/components/storage-image.tsx:42-56](e5-chronicles/src/components/storage-image.tsx#L42)
(`.catch` sets a failed state, `.finally` clears loading, guarded by `cancelled`):
- [src/components/receipt-link.tsx:14](e5-chronicles/src/components/receipt-link.tsx#L14)
- [src/app/admin/equipment/[id]/equipment-photo.tsx:20](e5-chronicles/src/app/admin/equipment/[id]/equipment-photo.tsx#L20)
- [src/app/employee/equipment/equipment-photo.tsx:20](e5-chronicles/src/app/employee/equipment/equipment-photo.tsx#L20)

Low impact — `getStorageSignedUrl` has an internal try/catch returning `null`, so a
rejection only occurs on transport-level failure. Still worth a `.catch` to avoid an
unhandled rejection and a stuck "Loading…" state.

---

## 5. Parallelize independent sequential queries

Request waterfalls (independent queries `await`ed in series). Wrap in `Promise.all`.
NOTE: this is **not** N+1 — do not try to "join" these; e.g. `designations` is a form
lookup list, not a relation on `profiles`.
- [src/app/admin/employees/page.tsx:16-32](e5-chronicles/src/app/admin/employees/page.tsx#L16)
  — active employees, archived employees, designations (3 independent queries).
- Sweep other list pages for the same shape:
  `grep -rn "await supabase" src/app/admin/*/page.tsx` and look for consecutive
  independent awaits with no data dependency between them.

---

## 6. Centralize magic status strings

~119 occurrences of `'draft' | 'sent' | 'paid' | 'overdue' | 'partially_paid' | 'cancelled'`
across ~8 files (heaviest: `src/app/admin/invoices/`). No `src/lib/constants/` dir exists.

The Zod enums in [src/lib/validations.ts](e5-chronicles/src/lib/validations.ts) already
define the canonical value sets — reuse/derive from them rather than inventing new ones:
- invoice status — validations.ts:493 `['draft','sent','viewed','paid','partially_paid','overdue','cancelled']`
- expense status — :206 `['pending','approved','rejected','reimbursed']`
- project status — :400, package status — :514, payment_status — :515

Suggested: create `src/lib/constants/statuses.ts` exporting `const` objects (or `z.infer`
types off the existing enums) and replace the string literals in comparisons/switches.
Lowest priority — behaviour is already correct; this is typo-safety only.

---

## 7. Remove blanket eslint-disable headers, fix hidden `any` / dead imports

- **98 files** carry a whole-file `/* eslint-disable ... */` header (run
  `grep -rln "^/\* eslint-disable" src` for the current list).
- `eslint.config.mjs` sets `no-explicit-any` to `error`, but the headers void it —
  ~229 `any` annotations and dead imports hide behind them.
- Do this **file-by-file**: remove the header, run `npm run lint` on that file, fix what
  surfaces (type the `any`s properly, delete unused imports), keep tests green. Do NOT bulk-
  delete all headers at once — you'll get an unreviewable wall of errors.
- Known dead imports to catch: `ShieldAlert`, `Printer` in
  `src/app/admin/packages/[id]/page.tsx`.
- Standing lint warning to clear: `InvoiceStatusUpdateSchema` unused in
  [src/app/admin/invoices/actions.ts:6](e5-chronicles/src/app/admin/invoices/actions.ts#L6).

---

## 8. (Optional, larger) Split the two very large files

Not required for correctness — readability only. Threshold in the original audit ("150
lines") is arbitrary and not a repo convention.
- `src/app/admin/packages/[id]/page.tsx` — 1380 lines. Split by tab (logistics / post-prod
  / payments are already separate state groups).
- `src/app/admin/packages/actions.ts` — ~1400 lines, 19 exported actions. Split by domain
  (CRUD vs workspace-fetch vs audit/review).

---

## Verification checklist for the auth change (task 1, already done — re-confirm if touched)

Manual, against a running app:
- Log in as **admin** → lands on `/admin`, can reach `/admin/talents`, `/admin/equipment`.
- Log in as **Founder** (`designation='Founder'`, `role='employee'`) → reaches `/founder`
  AND is allowed into `/admin/*` pages (was previously locked out by the `role !== 'admin'`
  check).
- Log in as **plain employee** → `/admin/*` redirects to `/employee` (not a 404).

---

## Rejected suggestions from the original audit (do not implement)

- **"CRITICAL: updateInvoice missing permission check"** — false. `updateInvoice` checks
  `verifyAdminOrFounder` at actions.ts:239 and enforces `status === 'draft'` at :251.
- **Rename `getProjectDates` → `fetchProjectDates`** — `get` is already the repo convention.
- **`useRequireAdmin()` hook** — these are async server components; hooks don't apply.
- **Enable `noImplicitAny`** — `strict: true` is already set (includes it).
- **"employees/actions.ts is ~1400 lines"** — it's 279.
