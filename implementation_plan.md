# Implementation Plan

## Overview

Comprehensive fix of three core systems: (1) archived employee data cleanup, (2) calendar redesign from Gantt-style timeline to traditional month grid, and (3) general bug fixes across the application.

The current production calendar uses a horizontal timeline/Gantt layout with employee rows and day columns — this is being replaced entirely with a standard month grid where each day is a cell containing task/leave/meeting/holiday indicators. The archive system currently does not clean up employee data (tasks, leave, etc.) when an employee is soft-deleted — archive will now nullify `assigned_to` on tasks and cascade properly. Various small bugs (placeholder labels in selects, employee filtering, calendar task visibility) will be fixed.

---

## Types

Type definitions for the new calendar data model — replaces the current Gantt-oriented `CalendarTask`/`CalendarLeave`/`CalendarMeeting` interfaces with grid-oriented ones containing day-cell groupings.

**New interfaces (in `production-calendar.tsx`):**
```typescript
interface CalendarDayCell {
  date: Date
  dateKey: string // yyyy-MM-dd
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  isHoliday: boolean
  holidayName: string | null
  tasks: GridTask[]
  leaves: GridLeave[]
  meetings: GridMeeting[]
}

interface GridTask {
  id: string
  title: string
  projectTitle: string
  projectId: string
  clientName: string | null
  phase: string
  status: string
  assignedTo: string
  employeeName: string
  projectColor: string
}

interface GridLeave {
  id: string
  employeeName: string
  leaveTypeName: string
}

interface GridMeeting {
  id: string
  title: string
  clientName: string | null
  location: string | null
  durationMinutes: number | null
}
```

**Existing types — no changes needed:** All existing table schemas (profiles, tasks, subtasks, sub_subtasks, leave_requests, holidays, client_meetings) remain unchanged.

---

## Files

Seven files modified, one new SQL migration, one new file created.

| File | Action | Purpose |
|------|--------|---------|
| `src/app/admin/calendar/production-calendar.tsx` | **Overwrite** | Replace Gantt timeline with month grid layout |
| `src/app/admin/calendar/page.tsx` | **Modify** | Change data fetch to group tasks by date for grid |
| `src/app/admin/calendar/actions.ts` | **Modify** | Add server action for nullifying tasks on employee archive |
| `src/app/admin/employees/actions.ts` | **Modify** | Extend `archiveEmployee()` to nullify assigned tasks |
| `src/app/admin/tasks/page.tsx` | **Modify** | Add `.is('deleted_at', null)` filter to employee fetch |
| `src/app/admin/tasks/task-form.tsx` | **Modify** | Add `.is('deleted_at', null)` filter to employee select |
| `src/app/admin/tasks/task-actions-menu.tsx` | **Modify** | Add `.is('deleted_at', null)` filter to employee select |
| `supabase_migration_013_employee_archive.sql` | **Create** | Add trigger for auto-nullifying tasks on archive |
| `src/app/admin/calendar/calendar-month-grid.tsx` | **Create** | New client component: the month grid layout |

---

## Functions

### 1. `archiveEmployee(employeeId)` — `src/app/admin/employees/actions.ts`
- **Signature:** `export async function archiveEmployee(employeeId: string)`
- **Current behavior:** Sets `deleted_at` on profile
- **New behavior:** Before setting `deleted_at`, runs `UPDATE tasks SET assigned_to = NULL WHERE assigned_to = employeeId AND status != 'completed'`. Uses `supabaseAdmin` to bypass RLS.
- **Error handling:** If task nullification fails, log but continue with archive. Return error if archive itself fails.

### 2. `getCalendarData(startDate, endDate)` — `src/app/admin/calendar/actions.ts`
- **Signature:** `export async function getCalendarData(startDate: string, endDate: string)`
- **New behavior:** Add employee `deleted_at` filter to leave query: `.is('profiles.deleted_at', null)` to exclude archived employees' leave.
- **Error handling:** Return empty arrays on error, log to console.

### 3. `CalendarMonthGrid` - new client component — `src/app/admin/calendar/calendar-month-grid.tsx`
- **Signature:** `export function CalendarMonthGrid({ currentDate, tasks, leaves, holidays, meetings, allEmployees, allProjects, allClients, projectFilter, employeeFilter, clientFilter, onNavigate, onToday })`
- **Purpose:** Renders a traditional month grid with day cells. Each cell shows: day number, task indicators (colored dots/bars), leave indicators, meeting indicators, holiday name.
- **Layout:** 7-column grid (Sun–Sat), ~5–6 rows. Sticky header with abbreviated day names. Empty cells for padding days from previous/next month.
- **Interaction:** Click day → navigate to tasks for that day (popover or link). Hover → tooltip with details.
- **Error handling:** Show "No data" in empty cells gracefully. Handle null/undefined field access with fallbacks.

### 4. `CalendarPage` (server component) — `src/app/admin/calendar/page.tsx`
- **Signature:** `export default async function CalendarPage()`
- **New behavior:** Fetch all tasks (completed + non-completed) with date info. Group by `deadline` and `start_date` so each day knows which tasks fall on it. Filter out tasks assigned to archived employees server-side.
- **Key change:** Instead of passing per-employee-row data, pass flat arrays of tasks grouped by date to the grid component.

### 5. SQL Trigger — `supabase_migration_013_employee_archive.sql`
- **Purpose:** Provide a database-level safety net so that even if the server action fails, assigning a task to a deleted employee reference is not possible.
- **Trigger:** `before update of deleted_at on profiles` — for each row where `new.deleted_at is not null`, set `assigned_to = null` on all tasks assigned to that profile.

---

## Changes

### Step 1: Database — Create archive cleanup migration
Create `supabase_migration_013_employee_archive.sql`:
```sql
-- When an employee is soft-deleted, nullify their task assignments
CREATE OR REPLACE FUNCTION public.nullify_employee_tasks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE public.tasks 
    SET assigned_to = NULL 
    WHERE assigned_to = OLD.id 
      AND status != 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_nullify_tasks_on_archive ON public.profiles;
CREATE TRIGGER trg_nullify_tasks_on_archive
  BEFORE UPDATE OF deleted_at ON public.profiles
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION public.nullify_employee_tasks();
```

### Step 2: Extend `archiveEmployee()` server action
In `src/app/admin/employees/actions.ts`, add the task nullification before the profile update. This ensures the frontend immediately sees the change, while the DB trigger is a safety net.

### Step 3: Fix employee filtering in Tasks section
In `src/app/admin/tasks/page.tsx`, add `.is('deleted_at', null)` to the employee fetch query. Same for `task-form.tsx` and `task-actions-menu.tsx` — filter archived employees from the assignee dropdown.

### Step 4: Fix "All" labels in calendar filters
The production-calendar.tsx already uses correct `placeholder="All Projects"`, `placeholder="All Clients"`, `placeholder="All Employees"` strings. Investigate why the user sees "all all all" — likely an issue with the Select component not rendering the placeholder when value is set to an initial empty state. Fix: ensure the Select trigger shows placeholder text when `value === 'all'` by conditionally rendering it. This is a UI rendering bug in shadcn Select when the value string is empty on first render.

### Step 5: Build the month grid component
Create `src/app/admin/calendar/calendar-month-grid.tsx`:
- Takes `currentDate`, arrays of tasks/leaves/holidays/meetings, filter values
- Computes the 6-week grid (42 cells) using `date-fns` (`startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`, `eachDayOfInterval`)
- Groups incoming tasks by `deadline` date (the primary date) and by `start_date` (for date range tasks)
- Renders as CSS Grid: `grid-template-columns: repeat(7, 1fr)`
- Each cell: bordered box with day number (top-left), colored dot indicators below
- Today's cell: highlighted with a ring
- Non-current-month cells: dimmed
- Popover on click: shows full list of items for that day
- Filter integration: tasks/leaves already filtered before being passed in

### Step 6: Rewrite CalendarPage data fetching
Modify `src/app/admin/calendar/page.tsx`:
- Fetch all tasks (including completed ones if within date range) — not just non-completed
- Fetch employees filter: `.is('deleted_at', null)` for active employees list
- Pass data as flat arrays to the CalendarMonthGrid
- Remove employee-row grouping from the server side (grid component handles display)

### Step 7: Remove Gantt code
Delete the old section in `production-calendar.tsx` that renders the Gantt rows and replace with `CalendarMonthGrid` component.

### Step 8: Bug fixes
- **Calendar not showing employee tasks**: In the current code, tasks without `start_date` or `deadline` are moved to "In Progress Tasks" section and never appear on the grid. Fix: show undated tasks in a dedicated "Unscheduled Tasks" sidebar/panel above the grid.
- **Employee task visibility on calendar**: The `.not('status', 'eq', 'completed')` filter excludes completed tasks from calendar view — completed tasks should still be visible (maybe dimmed) for historical reference.
- **Select placeholder bug**: The shadcn Select component in production-calendar.tsx doesn't show placeholder when `value` is `'all'` initially. Fix: ensure the SelectTrigger correctly renders placeholder text.

### Step 9: Verify and test
- Start dev server
- Check Tasks page: archived employees should not appear in assignee dropdown
- Archive an employee with existing tasks — verify tasks still exist but `assigned_to` is null
- Check calendar: should render as month grid, not Gantt
- Check filters: should read "All Projects", "All Clients", "All Employees"
- Check task visibility: employee tasks should appear on correct dates

---

## Tests

No formal test framework is set up in this project (Next.js App Router with no jest/cypress config). Testing will be manual via browser:

1. **Employee Archive Test:**
   - Archive employee "Ram" who has 3 assigned tasks + 1 completed task
   - Verify: "Ram" not in task dropdown, 3 non-completed tasks show `assigned_to=null`, 1 completed task keep's Ram's assignment
   - Restore employee — verify tasks remain null (they're not re-assigned)

2. **Calendar Grid Test:**
   - View calendar in month view — should be a traditional 7-column grid
   - Each day cell shows correct day number
   - Tasks with deadlines appear under correct dates
   - Hovering shows tooltip
   - Leave entries show on correct dates
   - Meetings show on correct dates
   - Holidays show with red text
   - Navigation (prev/next month, today button) works
   - Filters correctly limit visible data

3. **Bug Fix Verification:**
   - Select placeholders show "All Projects", "All Clients", "All Employees"
   - Undated tasks appear in a section (not lost)
   - Completed tasks visible on calendar
