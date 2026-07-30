import { z } from 'zod';

/**
 * Wraps an object shape so it can safely validate data built from
 * `FormData.get()`. `FormData.get()` returns `null` for any absent field, but
 * Zod's `.optional()` (and `.default()`) only accept `undefined`, not `null` —
 * so a missing optional form field would fail with "expected string, received
 * null". This helper preprocesses the input, converting top-level `null` values
 * to `undefined` before the object schema runs. Use it for every schema whose
 * input comes from a form submission.
 */
export function formObject<T extends z.ZodRawShape>(shape: T) {
  return z.preprocess((val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const obj = val as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const key in obj) {
        cleaned[key] = obj[key] === null ? undefined : obj[key];
      }
      return cleaned;
    }
    return val;
  }, z.object(shape));
}

export const InvoiceSchema = formObject({
  client_id: z.string().uuid("Invalid client ID"),
  project_id: z.string().uuid("Invalid project ID").optional().or(z.literal('')),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  currency: z.string().default('NPR'),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  tax_rate: z.number().min(0).default(0),
  notes: z.string().optional(),
  advance_received: z.number().min(0).default(0),
  discount_type: z.enum(['fixed', 'percentage']).default('fixed'),
  discount_value: z.number().min(0).default(0),
  itemsRaw: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price cannot be negative")
  })).optional()
}).transform((data) => {
  if (data.itemsRaw && !data.items) {
    try {
      data.items = JSON.parse(data.itemsRaw);
    } catch {
      data.items = [];
    }
  }
  return data;
});

export const InvoicePaymentSchema = formObject({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_date: z.string(),
  payment_method: z.string().min(1),
  reference_number: z.string().optional(),
  notes: z.string().optional()
});

export const EquipmentCheckoutSchema = z.object({
  equipment_id: z.string().uuid(),
  project_id: z.string().uuid().optional().or(z.literal('')),
  expected_return_date: z.string().optional(),
  purpose: z.string().optional()
});

export const LeaveRequestSchema = z.object({
  leave_type_id: z.string().uuid("Invalid leave type"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
});

export const CheckOutSchema = z.object({
  daySummary: z.string().superRefine((val, ctx) => {
    if (!val || val.trim().split(/\s+/).filter(Boolean).length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please write a day summary of at least 20 words describing what you did today.",
      });
    }
  }),
});

export const EmployeeProfileSchema = formObject({
  location: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  cvUrl: z.string().optional().nullable(),
  tiktok: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  threads: z.string().optional()
});

export const TaskStatusUpdateSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked'])
});

export const SubtaskToggleSchema = z.object({
  subtaskId: z.string().uuid(),
  isCompleted: z.boolean()
});

export const ClientRecordSchema = formObject({
  clientType: z.enum(['personal', 'company']).default('company'),
  companyName: z.string().min(1, "Name is required"),
  natureOfCompany: z.string().optional(),
  newNatureOfCompany: z.string().optional(),
  referralSource: z.string().optional(),
  newReferralSource: z.string().optional(),
  owner: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  logoUrl: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  panNumber: z.string().optional(),
  vatId: z.string().optional(),
  frequentContactPerson: z.string().optional(),
  frequentContactNumber: z.string().optional(),
  tiktok: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  threads: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.clientType === 'company') {
    if (!data.frequentContactPerson || data.frequentContactPerson.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Frequent contact person is required for company clients',
        path: ['frequentContactPerson'],
      });
    }
    if (!data.frequentContactNumber || data.frequentContactNumber.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Frequent contact number is required for company clients',
        path: ['frequentContactNumber'],
      });
    }
  }
});

export const ClientMeetingSchema = formObject({
  client_id: z.string().uuid("Invalid client ID"),
  title: z.string().min(1, "Title is required"),
  meeting_date: z.string().min(1, "Date is required"),
  duration_minutes: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const CreateEmployeeSchema = formObject({
  loginId: z.string().min(1, "Login ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  designation: z.string().min(1, "Designation is required"),
  newDesignation: z.string().optional(),
  contactEmail: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  joiningDate: z.string().optional(),
  dob: z.string().optional(),
  cvUrl: z.string().optional(),
  tiktok: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  threads: z.string().optional(),
  vehicle: z.string().optional(),
  vehicleDetails: z.string().optional(),
});

export const UpdateEmployeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  login_id: z.string().min(1, "Login ID is required"),
  contact_email: z.string().nullable().optional(),
  password: z.string().min(6).nullable().optional(),
  designation: z.string().min(1, "Designation is required"),
  phone_number: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  joining_date: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  cv_url: z.string().nullable().optional(),
  social_urls: z.record(z.string(), z.string()).nullable().optional(),
});

export const CreateExpenseSchema = formObject({
  project_id: z.string().uuid().optional().or(z.literal('')),
  client_id: z.string().uuid().optional().or(z.literal('')),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().min(1, "Description is required"),
  expense_date: z.string().optional(),
  is_billable: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const ExpenseStatusSchema = z.object({
  expenseId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'reimbursed']),
});

/** A single generic checklist item shared by the Phase 1/4/5 workspaces. */
export const ChecklistItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  done: z.boolean(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

/** Lenient URL check: http(s) links only, empty strings normalised away by callers. */
const httpUrl = z
  .string()
  .refine((v) => /^https?:\/\/.+/i.test(v), { message: 'Must be an http(s) link' });

/** One immutable QA review record. The latest entry is the current verdict. */
export const QaHistoryEntrySchema = z.object({
  round: z.number().int().min(1),
  reviewer: z.string().optional(),
  verdict: z.enum(['passed', 'changes_requested']),
  notes: z.string().optional(),
  blockingIssues: z.array(z.string()).optional(),
  reviewLink: httpUrl.optional(),
  reviewedAt: z.string(),
});

export type QaHistoryEntry = z.infer<typeof QaHistoryEntrySchema>;

export const TaskLogisticsSchema = z.object({
  // --- Phase 2 (shoot) ---
  locationAddress: z.string().optional(),
  locations: z.array(z.string()).optional(),
  shootDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  assignedStaffIds: z.array(z.string()).optional(),
  vehiclesTaken: z.array(z.string()).optional(),
  equipmentsTaken: z.array(z.string()).optional(),

  // --- Shared (Phase 1/4/5 workspaces) ---
  workspaceVersion: z.number().int().optional(),
  checklist: z.array(ChecklistItemSchema).optional(),

  // --- Phase 1: Concept & Scripting ---
  conceptBrief: z.string().optional(),
  scriptLink: httpUrl.optional(),
  storyboardLink: httpUrl.optional(),
  moodboardLink: httpUrl.optional(),
  referenceLinks: z.array(z.string()).optional(),
  deliverableFormat: z.string().optional(),
  targetDuration: z.string().optional(),
  conceptStatus: z.enum(['drafting', 'internal_review', 'client_review', 'approved']).optional(),

  // --- Phase 4: QA & Revision ---
  qaReviewer: z.string().optional(),
  reviewRound: z.number().int().min(0).optional(),
  qaVerdict: z.enum(['pending', 'passed', 'changes_requested']).optional(),
  qaNotes: z.string().optional(),
  blockingIssues: z.array(z.string()).optional(),
  reviewLink: httpUrl.optional(),
  qaHistory: z.array(QaHistoryEntrySchema).optional(),

  // --- Phase 5: Delivery ---
  finalDeliveryLink: httpUrl.optional(),
  deliveryDate: z.string().optional(),
  deliveryChannel: z.string().optional(),
  clientContact: z.string().optional(),
  archiveLink: httpUrl.optional(),
  deliveryNotes: z.string().optional(),
  clientReceiptConfirmed: z.boolean().optional(),
  clientAcceptanceStatus: z.enum(['pending', 'accepted', 'changes_requested']).optional(),
}).passthrough(); // preserve unknown/legacy keys (e.g. editing* fields) instead of silently stripping them

export type TaskLogistics = z.infer<typeof TaskLogisticsSchema>;

/**
 * Employee-side patch for the Phase 1/4/5 workspaces. Deliberately narrow:
 * only the fields an assignee may change. Admin-owned fields (brief, format,
 * duration, client contact, archive location, ...) are NOT accepted here —
 * the server action further merges this patch into the existing logistics
 * JSON rather than overwriting it.
 */
export const UpdateTaskPhaseWorkspaceSchema = z.object({
  taskId: z.string().uuid(),
  patch: z.object({
    checklist: z.array(ChecklistItemSchema).optional(),
    // Phase-specific primary working links
    scriptLink: httpUrl.optional().or(z.literal('')),
    reviewLink: httpUrl.optional().or(z.literal('')),
    finalDeliveryLink: httpUrl.optional().or(z.literal('')),
    // Phase 4 QA fields (assignee of the QA task only)
    qaVerdict: z.enum(['pending', 'passed', 'changes_requested']).optional(),
    qaNotes: z.string().optional(),
    blockingIssues: z.array(z.string()).optional(),
  }).strict(),
});

export type AssignTaskData = z.infer<typeof AssignTaskSchema>;
export type UpdateTaskData = z.infer<typeof UpdateTaskSchema>;

export const AssignTaskSchema = formObject({
  project_id: z.string().uuid("Project is required"),
  phase: z.string().min(1, "Phase is required"),
  assigned_to: z.string().uuid("Employee is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  subtasksRaw: z.string().optional(),
  logistics: z.string().optional().nullable(),
}).transform((data) => {
  const result: {
    project_id: string;
    phase: string;
    assigned_to: string;
    title: string;
    description?: string;
    start_date?: string;
    deadline?: string;
    subtasksRaw?: string;
    logistics: z.infer<typeof TaskLogisticsSchema> | null;
  } = {
    ...data,
    logistics: null,
  };

  if (data.logistics) {
    try {
      const parsed = JSON.parse(data.logistics);
      result.logistics = TaskLogisticsSchema.parse(parsed);
    } catch {
      result.logistics = null;
    }
  }

  return result;
});

export const UpdateTaskSchema = formObject({
  project_id: z.string().uuid("Project is required"),
  phase: z.string().min(1, "Phase is required"),
  assigned_to: z.string().uuid("Employee is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  logistics: z.string().optional().nullable(),
}).transform((data) => {
  const result: {
    project_id: string;
    phase: string;
    assigned_to: string;
    title: string;
    description?: string;
    start_date?: string;
    deadline?: string;
    status?: string;
    logistics: z.infer<typeof TaskLogisticsSchema> | null;
  } = {
    ...data,
    logistics: null,
  };

  if (data.logistics) {
    try {
      const parsed = JSON.parse(data.logistics);
      result.logistics = TaskLogisticsSchema.parse(parsed);
    } catch {
      result.logistics = null;
    }
  }

  return result;
});

export const CreateProjectSchema = formObject({
  client_id: z.string().uuid("Client is required"),
  title: z.string().min(1, "Project title is required"),
  package: z.string().max(100).optional().or(z.literal('')),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const ProjectBudgetSchema = z.object({
  budget_amount: z.number().positive("Budget amount is required"),
  contingency_percent: z.number().min(0).default(10),
  notes: z.string().optional().nullable(),
});

export const ProjectStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled']),
});

export const EquipmentSchema = formObject({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  purchase_date: z.string().optional(),
  purchase_price: z.number().optional().nullable(),
  current_value: z.number().optional().nullable(),
  location: z.string().optional(),
  notes: z.string().optional(),
  vendor_name: z.string().optional(),
  vendor_phone: z.string().optional(),
  vendor_location: z.string().optional(),
});

export const MaintenanceSchema = z.object({
  equipment_id: z.string().uuid(),
  description: z.string().min(1, "Description is required"),
  scheduled_date: z.string().min(1, "Scheduled date is required"),
  vendor: z.string().optional(),
  vendor_phone: z.string().optional(),
  vendor_location: z.string().optional(),
  cost: z.number().optional().nullable(),
  notes: z.string().optional(),
});

export const TalentSchema = formObject({
  full_name: z.string().min(1, "Full name is required"),
  stage_name: z.string().optional(),
  talent_type: z.string().min(1, "Talent type is required"),
  phone_number: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  location: z.string().optional(),
  height_cm: z.number().optional().nullable(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  rate_type: z.string().default('per_project'),
  rate_amount: z.number().optional().nullable(),
  notes: z.string().optional(),
});

export const TalentBookingSchema = formObject({
  talent_id: z.string().uuid("Talent is required"),
  project_id: z.string().uuid().optional().or(z.literal('')),
  booking_date: z.string().min(1, "Booking date is required"),
  end_date: z.string().optional(),
  rate_type: z.string().min(1, "Rate type is required"),
  rate_amount: z.number().positive("Rate amount is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const QuickUpdateTaskDateSchema = z.object({
  taskId: z.string().uuid(),
  startDate: z.string().nullable().optional(),
  deadline: z.string().min(1, "Deadline is required"),
});

export const LoginSchema = z.object({
  email: z.string().min(1, "Email or login ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const ChangePasscodeSchema = z.object({
  currentPasscode: z.string().min(1, "Current passcode is required"),
  newPasscode: z.string().min(8, "Passcode must be at least 8 characters"),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID"),
});

export const EquipmentCheckInSchema = z.object({
  checkout_id: z.string().uuid("Invalid checkout ID"),
  condition_at_check_in: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const MaintenanceStatusSchema = z.object({
  maintenanceId: z.string().uuid(),
  status: z.enum(['scheduled', 'in_progress', 'completed']),
  completed_date: z.string().optional().nullable(),
});

export const InvoiceStatusUpdateSchema = z.object({
  invoiceId: z.string().uuid(),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled']),
});

export const BookingStatusUpdateSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(['proposed', 'confirmed', 'completed', 'cancelled']),
});

export const PackageItemSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit_cost: z.number().min(0, "Unit cost cannot be negative").nullable(),
  total_cost: z.number().min(0, "Total cost cannot be negative"),
});

export const PackageSchema = formObject({
  client_id: z.string().uuid("Please select a client"),
  title: z.string().min(1, "Package title is required"),
  preset_template: z.string().optional(),
  creation_date: z.string().min(1, "Creation date is required"),
  status: z.enum(['in_progress', 'completed', 'cancelled']).default('in_progress'),
  payment_status: z.enum(['unpaid', 'partially_paid', 'paid']).default('unpaid'),
  payment_method: z.enum(['bank_transfer', 'cash', 'qr_code', 'cheque', 'esewa', 'khalti', 'other']).default('bank_transfer'),
  discount_amount: z.number().min(0, "Discount cannot be negative").default(0),
  tax_percent: z.number().min(0, "Tax percentage cannot be negative").default(0),
  notes: z.string().optional(),
  itemsRaw: z.string().optional(),
  items: z.array(PackageItemSchema).min(1, "At least one line item is required").optional()
}).transform((data) => {
  if (data.itemsRaw && !data.items) {
    try {
      data.items = JSON.parse(data.itemsRaw);
    } catch {
      data.items = [];
    }
  }
  return data;
});

export const PackagePaymentSchema = z.object({
  package_id: z.string().uuid(),
  amount: z.number().positive("Amount must be greater than zero"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});