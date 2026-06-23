# Graph Report - .  (2026-06-18)

## Corpus Check
- 203 files · ~71,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 646 nodes · 1937 edges · 37 communities (25 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Components|UI Components]]
- [[_COMMUNITY_Forms and Modals|Forms and Modals]]
- [[_COMMUNITY_Task and Leave Dashboard|Task and Leave Dashboard]]
- [[_COMMUNITY_Actions and Backend|Actions and Backend]]
- [[_COMMUNITY_Table and Lists|Table and Lists]]
- [[_COMMUNITY_Dependencies|Dependencies]]
- [[_COMMUNITY_Calendar View|Calendar View]]
- [[_COMMUNITY_Backend Actions|Backend Actions]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_TSConfig|TSConfig]]
- [[_COMMUNITY_Sidebar and Layout|Sidebar and Layout]]
- [[_COMMUNITY_Talent Types and Forms|Talent Types and Forms]]
- [[_COMMUNITY_Storage and Photos|Storage and Photos]]
- [[_COMMUNITY_Core Layout|Core Layout]]
- [[_COMMUNITY_Invoice Actions|Invoice Actions]]
- [[_COMMUNITY_Talent Types|Talent Types]]
- [[_COMMUNITY_Templates|Templates]]
- [[_COMMUNITY_Client Actions|Client Actions]]
- [[_COMMUNITY_Expense Actions|Expense Actions]]
- [[_COMMUNITY_Leave Types|Leave Types]]
- [[_COMMUNITY_Equipment Modals|Equipment Modals]]
- [[_COMMUNITY_Invoice Pages|Invoice Pages]]
- [[_COMMUNITY_Proxies and Middleware|Proxies and Middleware]]
- [[_COMMUNITY_Timesheet Actions|Timesheet Actions]]
- [[_COMMUNITY_Check-in Actions|Check-in Actions]]
- [[_COMMUNITY_Check-out Actions|Check-out Actions]]
- [[_COMMUNITY_Create Admin Script|Create Admin Script]]
- [[_COMMUNITY_Leave Requests|Leave Requests]]
- [[_COMMUNITY_Supabase Storage|Supabase Storage]]
- [[_COMMUNITY_Leave Manager Types|Leave Manager Types]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_NextJS Config|NextJS Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 148 edges
2. `cn()` - 91 edges
3. `Button()` - 71 edges
4. `Badge()` - 34 edges
5. `Input()` - 33 edges
6. `SelectValue()` - 30 edges
7. `SelectTrigger()` - 30 edges
8. `SelectContent()` - 30 edges
9. `SelectItem()` - 30 edges
10. `CardContent()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `getSubtaskComments()` --calls--> `createClient()`  [EXTRACTED]
  src/app/actions/subtask-comments.ts → src/lib/supabase/server.ts
- `ClientsPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/clients/page.tsx → src/lib/supabase/server.ts
- `CheckinEquipmentPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/equipment/checkin/page.tsx → src/lib/supabase/server.ts
- `CheckoutEquipmentPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/equipment/checkout/page.tsx → src/lib/supabase/server.ts
- `MaintenancePage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/admin/equipment/maintenance/page.tsx → src/lib/supabase/server.ts

## Import Cycles
- None detected.

## Communities (37 total, 12 thin omitted)

### Community 0 - "UI Components"
Cohesion: 0.05
Nodes (61): archiveEmployee(), createEmployee(), restoreEmployee(), updateEmployee(), EditEmployeeDialogProps, Employee, cn(), Client (+53 more)

### Community 1 - "Forms and Modals"
Cohesion: 0.10
Nodes (34): ClientFormProps, Client, EditClientDialogProps, EmployeeFormProps, EquipmentList(), createExpense(), ExpenseForm(), InvoiceItem (+26 more)

### Community 2 - "Task and Leave Dashboard"
Cohesion: 0.07
Nodes (40): addSubtaskComment(), getSubtaskComments(), AttendanceRecord, MONTH_NAMES, BudgetChart(), BudgetChartProps, BudgetForm(), ProjectBudgetPage() (+32 more)

### Community 3 - "Actions and Backend"
Cohesion: 0.05
Nodes (32): EditBalanceCell(), SeedBalancesButton(), Holiday, LeaveCalendar(), LeaveDay, updateMaintenanceStatus(), ExpenseTable(), PrintButton() (+24 more)

### Community 4 - "Table and Lists"
Cohesion: 0.10
Nodes (33): AttendanceForm(), ClientActions(), ClientForm(), EditClientDialog(), ClientsPage(), ReceiptLink(), EditEmployeeDialog(), EmployeeActions() (+25 more)

### Community 5 - "Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, @base-ui/react, class-variance-authority, clsx, date-fns, framer-motion, @hookform/resolvers, lucide-react (+32 more)

### Community 6 - "Calendar View"
Cohesion: 0.07
Nodes (23): CalendarHoliday, CalendarLeave, CalendarMeeting, CalendarMonthGrid(), CalendarTask, ClientInfo, EmployeeInfo, ProjectInfo (+15 more)

### Community 7 - "Backend Actions"
Cohesion: 0.10
Nodes (27): AdminDashboard(), markAttendance(), AdminLeaveBalancesPage(), BookingsPage(), getCalendarData(), quickUpdateTaskDate(), EmployeesPage(), addEquipmentCategory() (+19 more)

### Community 8 - "Tailwind Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "TSConfig"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Sidebar and Layout"
Cohesion: 0.15
Nodes (12): logout(), AdminLayout(), adminLinks, AdminSidebar(), equipmentLinks, financeLinks, talentLinks, employeeLinks (+4 more)

### Community 11 - "Talent Types and Forms"
Cohesion: 0.17
Nodes (10): addTalentType(), archiveTalent(), createBooking(), createTalent(), updateBookingStatus(), updateTalent(), CURRENCIES, GENDERS (+2 more)

### Community 12 - "Storage and Photos"
Cohesion: 0.22
Nodes (5): getStorageSignedUrl(), StorageImage(), StorageImageProps, EquipmentPhoto(), EquipmentPhoto()

### Community 13 - "Core Layout"
Cohesion: 0.28
Nodes (5): geistMono, geistSans, metadata, ThemeProvider(), Toaster()

### Community 14 - "Invoice Actions"
Cohesion: 0.25
Nodes (7): createInvoice(), deleteInvoice(), getProjectDates(), recordPayment(), sendInvoice(), updateInvoice(), updateInvoiceStatus()

### Community 15 - "Talent Types"
Cohesion: 0.29
Nodes (6): BookingStatus, Talent, TalentBooking, TalentGender, TalentProjectHistory, TalentType

### Community 17 - "Client Actions"
Cohesion: 0.33
Nodes (5): archiveClient(), createClientMeeting(), createClientRecord(), restoreClient(), updateClientRecord()

### Community 18 - "Expense Actions"
Cohesion: 0.40
Nodes (4): addExpenseCategory(), deleteExpense(), updateExpenseStatus(), ExpenseActions()

### Community 19 - "Leave Types"
Cohesion: 0.33
Nodes (5): Holiday, LeaveBalance, LeaveRequest, LeaveStatus, LeaveType

### Community 22 - "Proxies and Middleware"
Cohesion: 0.60
Nodes (3): config, proxy(), updateSession()

### Community 23 - "Timesheet Actions"
Cohesion: 0.83
Nodes (3): approveTimesheet(), checkAdmin(), rejectTimesheet()

## Knowledge Gaps
- **154 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Backend Actions` to `Forms and Modals`, `Task and Leave Dashboard`, `Actions and Backend`, `Table and Lists`, `Calendar View`, `Sidebar and Layout`, `Talent Types and Forms`, `Storage and Photos`, `Invoice Actions`, `Client Actions`, `Expense Actions`, `Equipment Modals`, `Invoice Pages`, `Timesheet Actions`, `Check-in Actions`, `Check-out Actions`, `Leave Requests`, `Supabase Storage`, `Leave Manager Types`, `Equipment Categories API`, `Expenses Categories API`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Why does `cn()` connect `UI Components` to `Forms and Modals`, `Task and Leave Dashboard`, `Actions and Backend`, `Table and Lists`, `Sidebar and Layout`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `Button()` connect `Actions and Backend` to `UI Components`, `Forms and Modals`, `Task and Leave Dashboard`, `Table and Lists`, `Calendar View`, `Sidebar and Layout`, `Talent Types and Forms`, `Storage and Photos`, `Expense Actions`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _154 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.052184769038701624 - nodes in this community are weakly interconnected._
- **Should `Forms and Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.09702660406885759 - nodes in this community are weakly interconnected._
- **Should `Task and Leave Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.06990622335890878 - nodes in this community are weakly interconnected._