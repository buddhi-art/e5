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
  itemsRaw: z.string().optional(), // Used to parse the JSON string from FormData
  items: z.array(z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_price: z.number().min(0, "Unit price cannot be negative")
  })).optional()
}).transform((data) => {
  if (data.itemsRaw && !data.items) {
    try {
      data.items = JSON.parse(data.itemsRaw);
    } catch (e) {
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
  // For a Company this is the Company Name; for a Personal client this is the individual's Name.
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
  // Company-only frequent contact person (mandatory when clientType === 'company').
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

// ── Employee (Admin) ──
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

// ── Expense ──
export const CreateExpenseSchema = formObject({
  project_id: z.string().optional(),
  client_id: z.string().optional(),
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

// ── Task (Admin) ──
export const AssignTaskSchema = formObject({
  project_id: z.string().uuid("Project is required"),
  phase: z.string().min(1, "Phase is required"),
  assigned_to: z.string().uuid("Employee is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  subtasksRaw: z.string().optional(),
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
});

// ── Project ──
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
  status: z.string().min(1),
});

// ── Equipment ──
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

// ── Talent ──
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
  project_id: z.string().optional(),
  booking_date: z.string().min(1, "Booking date is required"),
  end_date: z.string().optional(),
  rate_type: z.string().min(1, "Rate type is required"),
  rate_amount: z.number().positive("Rate amount is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// ── Calendar (Admin) ──
export const QuickUpdateTaskDateSchema = z.object({
  taskId: z.string().uuid(),
  startDate: z.string().nullable().optional(),
  deadline: z.string().min(1, "Deadline is required"),
});

// ── Login ──
export const LoginSchema = z.object({
  email: z.string().min(1, "Email or login ID is required"),
  password: z.string().min(1, "Password is required"),
});

export const ChangePasscodeSchema = z.object({
  newPasscode: z.string().min(8, "Passcode must be at least 8 characters"),
});

// ── Generic shared validators (used across all server actions) ──
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
