import { describe, it, expect } from 'vitest'
import {
    InvoiceSchema,
    InvoicePaymentSchema,
    EquipmentCheckoutSchema,
    LeaveRequestSchema,
    CheckOutSchema,
    EmployeeProfileSchema,
    TaskStatusUpdateSchema,
    SubtaskToggleSchema,
    ClientRecordSchema,
    ClientMeetingSchema,
    CreateEmployeeSchema,
    UpdateEmployeeSchema,
    CreateExpenseSchema,
    ExpenseStatusSchema,
    AssignTaskSchema,
    UpdateTaskSchema,
    CreateProjectSchema,
    ProjectBudgetSchema,
    ProjectStatusSchema,
    EquipmentSchema,
    MaintenanceSchema,
    TalentSchema,
    TalentBookingSchema,
    QuickUpdateTaskDateSchema,
    LoginSchema,
    UuidParamSchema,
    EquipmentCheckInSchema,
    MaintenanceStatusSchema,
} from '@/lib/validations'

// ──────────────────────────────────────────────
// Invoice
// ──────────────────────────────────────────────
describe('InvoiceSchema', () => {
    it('accepts a valid invoice', () => {
        const result = InvoiceSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: 'Development invoice',
            currency: 'NPR',
            issue_date: '2026-01-01',
            due_date: '2026-02-01',
            tax_rate: 13,
            advance_received: 0,
            discount_type: 'fixed',
            discount_value: 0,
            items: [{ description: 'Feature A', quantity: 1, unit_price: 5000 }],
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing title', () => {
        const result = InvoiceSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: '',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('required')
        }
    })

    it('rejects invalid client_id', () => {
        const result = InvoiceSchema.safeParse({
            client_id: 'not-a-uuid',
            title: 'Test',
        })
        expect(result.success).toBe(false)
    })

    it('parses itemsRaw into items via transform', () => {
        const raw = JSON.stringify([{ description: 'A', quantity: 2, unit_price: 100 }])
        const result = InvoiceSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: 'Test',
            issue_date: '2026-01-01',
            due_date: '2026-02-01',
            itemsRaw: raw,
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.items).toBeDefined()
            expect(result.data.items).toHaveLength(1)
            expect(result.data.items![0].quantity).toBe(2)
        }
    })
})

// ──────────────────────────────────────────────
// InvoicePaymentSchema
// ──────────────────────────────────────────────
describe('InvoicePaymentSchema', () => {
    it('accepts valid payment', () => {
        const result = InvoicePaymentSchema.safeParse({
            invoice_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            amount: 1000,
            payment_date: '2026-01-15',
            payment_method: 'bank_transfer',
        })
        expect(result.success).toBe(true)
    })

    it('rejects negative amount', () => {
        const result = InvoicePaymentSchema.safeParse({
            invoice_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            amount: -100,
            payment_date: '2026-01-15',
            payment_method: 'cash',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// EquipmentCheckoutSchema
// ──────────────────────────────────────────────
describe('EquipmentCheckoutSchema', () => {
    it('accepts checkout with required field', () => {
        const result = EquipmentCheckoutSchema.safeParse({
            equipment_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing equipment_id', () => {
        const result = EquipmentCheckoutSchema.safeParse({})
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// LeaveRequestSchema
// ──────────────────────────────────────────────
describe('LeaveRequestSchema', () => {
    it('accepts valid leave request', () => {
        const result = LeaveRequestSchema.safeParse({
            leave_type_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            start_date: '2026-03-01',
            end_date: '2026-03-05',
            reason: 'Family event',
        })
        expect(result.success).toBe(true)
    })

    it('rejects empty reason', () => {
        const result = LeaveRequestSchema.safeParse({
            leave_type_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            start_date: '2026-03-01',
            end_date: '2026-03-05',
            reason: '',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// CheckOutSchema (day summary)
// ──────────────────────────────────────────────
describe('CheckOutSchema', () => {
    it('accepts a valid 20+ word summary', () => {
        const summary =
            'Worked on the dashboard redesign, fixed three bugs in the checkout flow, documented the new API endpoints, and reviewed two pull requests from the team today.'
        const result = CheckOutSchema.safeParse({ daySummary: summary })
        expect(result.success).toBe(true)
    })

    it('rejects a summary with fewer than 20 words', () => {
        const result = CheckOutSchema.safeParse({
            daySummary: 'Fixed some bugs today.',
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('20 words')
        }
    })

    it('rejects an empty summary', () => {
        const result = CheckOutSchema.safeParse({ daySummary: '' })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// EmployeeProfileSchema
// ──────────────────────────────────────────────
describe('EmployeeProfileSchema', () => {
    it('accepts an empty profile (all optional)', () => {
        const result = EmployeeProfileSchema.safeParse({})
        expect(result.success).toBe(true)
    })

    it('accepts a full profile', () => {
        const result = EmployeeProfileSchema.safeParse({
            location: 'Kathmandu',
            dob: '1990-01-01',
            cvUrl: 'https://example.com/cv.pdf',
            tiktok: '@user',
            facebook: 'user',
            instagram: '@user',
            threads: '@user',
        })
        expect(result.success).toBe(true)
    })

    it('accepts null fields', () => {
        const result = EmployeeProfileSchema.safeParse({
            location: null,
            dob: null,
        })
        expect(result.success).toBe(true)
    })
})

// ──────────────────────────────────────────────
// TaskStatusUpdateSchema
// ──────────────────────────────────────────────
describe('TaskStatusUpdateSchema', () => {
    it('accepts valid status', () => {
        const result = TaskStatusUpdateSchema.safeParse({
            taskId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            status: 'in_progress',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
        const result = TaskStatusUpdateSchema.safeParse({
            taskId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            status: 'archived',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// ClientRecordSchema
// ──────────────────────────────────────────────
describe('ClientRecordSchema', () => {
    it('accepts valid client', () => {
        const result = ClientRecordSchema.safeParse({
            companyName: 'Acme Corp',
            contactEmail: 'acme@example.com',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
        const result = ClientRecordSchema.safeParse({
            companyName: 'Acme Corp',
            contactEmail: 'not-an-email',
        })
        expect(result.success).toBe(false)
    })

    it('allows empty email', () => {
        const result = ClientRecordSchema.safeParse({
            companyName: 'Acme Corp',
            contactEmail: '',
        })
        expect(result.success).toBe(true)
    })
})

// ──────────────────────────────────────────────
// ClientMeetingSchema
// ──────────────────────────────────────────────
describe('ClientMeetingSchema', () => {
    it('accepts valid meeting', () => {
        const result = ClientMeetingSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: 'Sprint planning',
            meeting_date: '2026-04-01',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing title', () => {
        const result = ClientMeetingSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: '',
            meeting_date: '2026-04-01',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// CreateEmployeeSchema
// ──────────────────────────────────────────────
describe('CreateEmployeeSchema', () => {
    it('accepts valid employee', () => {
        const result = CreateEmployeeSchema.safeParse({
            loginId: 'john.doe',
            password: 'password123',
            fullName: 'John Doe',
            designation: 'Engineer',
        })
        expect(result.success).toBe(true)
    })

    it('rejects short password', () => {
        const result = CreateEmployeeSchema.safeParse({
            loginId: 'john.doe',
            password: '12345',
            fullName: 'John Doe',
            designation: 'Engineer',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// UpdateEmployeeSchema
// ──────────────────────────────────────────────
describe('UpdateEmployeeSchema', () => {
    it('accepts valid update', () => {
        const result = UpdateEmployeeSchema.safeParse({
            full_name: 'John Doe',
            login_id: 'john.doe',
            designation: 'Senior Engineer',
        })
        expect(result.success).toBe(true)
    })

    it('allows nullable email', () => {
        const result = UpdateEmployeeSchema.safeParse({
            full_name: 'John Doe',
            login_id: 'john.doe',
            designation: 'Engineer',
            contact_email: null,
        })
        expect(result.success).toBe(true)
    })
})

// ──────────────────────────────────────────────
// CreateExpenseSchema
// ──────────────────────────────────────────────
describe('CreateExpenseSchema', () => {
    it('accepts valid expense', () => {
        const result = CreateExpenseSchema.safeParse({
            category: 'Travel',
            amount: 500,
            description: 'Flight to Delhi',
        })
        expect(result.success).toBe(true)
    })

    it('rejects zero amount', () => {
        const result = CreateExpenseSchema.safeParse({
            category: 'Travel',
            amount: 0,
            description: 'Flight',
        })
        expect(result.success).toBe(false)
    })

    it('rejects negative amount', () => {
        const result = CreateExpenseSchema.safeParse({
            category: 'Travel',
            amount: -100,
            description: 'Flight',
        })
        expect(result.success).toBe(false)
    })

    it('rejects missing description', () => {
        const result = CreateExpenseSchema.safeParse({
            category: 'Travel',
            amount: 500,
            description: '',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// ExpenseStatusSchema
// ──────────────────────────────────────────────
describe('ExpenseStatusSchema', () => {
    it('accepts valid status', () => {
        const result = ExpenseStatusSchema.safeParse({
            expenseId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            status: 'approved',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
        const result = ExpenseStatusSchema.safeParse({
            expenseId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            status: 'paid',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// AssignTaskSchema
// ──────────────────────────────────────────────
describe('AssignTaskSchema', () => {
    it('accepts valid task assignment', () => {
        const result = AssignTaskSchema.safeParse({
            project_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            phase: 'Development',
            assigned_to: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: 'Fix login bug',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing phase', () => {
        const result = AssignTaskSchema.safeParse({
            project_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            phase: '',
            assigned_to: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: 'Fix login bug',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// CreateProjectSchema
// ──────────────────────────────────────────────
describe('CreateProjectSchema', () => {
    it('accepts valid project', () => {
        const result = CreateProjectSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: 'Website redesign',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing title', () => {
        const result = CreateProjectSchema.safeParse({
            client_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            title: '',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// ProjectBudgetSchema
// ──────────────────────────────────────────────
describe('ProjectBudgetSchema', () => {
    it('accepts valid budget', () => {
        const result = ProjectBudgetSchema.safeParse({
            budget_amount: 100000,
            contingency_percent: 15,
        })
        expect(result.success).toBe(true)
    })

    it('rejects zero budget', () => {
        const result = ProjectBudgetSchema.safeParse({ budget_amount: 0 })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// EquipmentSchema
// ──────────────────────────────────────────────
describe('EquipmentSchema', () => {
    it('accepts valid equipment', () => {
        const result = EquipmentSchema.safeParse({
            name: 'MacBook Pro',
            category: 'Laptop',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing name', () => {
        const result = EquipmentSchema.safeParse({ name: '', category: 'Laptop' })
        expect(result.success).toBe(false)
    })

    it('allows null purchase_price', () => {
        const result = EquipmentSchema.safeParse({
            name: 'Keyboard',
            category: 'Accessories',
            purchase_price: null,
        })
        expect(result.success).toBe(true)
    })
})

// ──────────────────────────────────────────────
// MaintenanceSchema
// ──────────────────────────────────────────────
describe('MaintenanceSchema', () => {
    it('accepts valid maintenance', () => {
        const result = MaintenanceSchema.safeParse({
            equipment_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            description: 'Screen replacement',
            scheduled_date: '2026-05-01',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing description', () => {
        const result = MaintenanceSchema.safeParse({
            equipment_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            description: '',
            scheduled_date: '2026-05-01',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// TalentSchema
// ──────────────────────────────────────────────
describe('TalentSchema', () => {
    it('accepts valid talent', () => {
        const result = TalentSchema.safeParse({
            full_name: 'Jane Smith',
            talent_type: 'Model',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing talent_type', () => {
        const result = TalentSchema.safeParse({
            full_name: 'Jane Smith',
            talent_type: '',
        })
        expect(result.success).toBe(false)
    })

    it('allows empty email', () => {
        const result = TalentSchema.safeParse({
            full_name: 'Jane Smith',
            talent_type: 'Model',
            email: '',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
        const result = TalentSchema.safeParse({
            full_name: 'Jane Smith',
            talent_type: 'Model',
            email: 'bad-email',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// TalentBookingSchema
// ──────────────────────────────────────────────
describe('TalentBookingSchema', () => {
    it('accepts valid booking', () => {
        const result = TalentBookingSchema.safeParse({
            talent_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            booking_date: '2026-06-01',
            rate_type: 'per_project',
            rate_amount: 5000,
        })
        expect(result.success).toBe(true)
    })

    it('rejects zero rate_amount', () => {
        const result = TalentBookingSchema.safeParse({
            talent_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            booking_date: '2026-06-01',
            rate_type: 'per_project',
            rate_amount: 0,
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// LoginSchema
// ──────────────────────────────────────────────
describe('LoginSchema', () => {
    it('accepts valid login', () => {
        const result = LoginSchema.safeParse({
            email: 'user@example.com',
            password: 'password123',
        })
        expect(result.success).toBe(true)
    })

    it('accepts login ID without domain', () => {
        const result = LoginSchema.safeParse({
            email: 'john.doe',
            password: 'password123',
        })
        expect(result.success).toBe(true)
    })

    it('rejects empty email', () => {
        const result = LoginSchema.safeParse({ email: '', password: 'password123' })
        expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
        const result = LoginSchema.safeParse({ email: 'user@example.com', password: '' })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// UuidParamSchema
// ──────────────────────────────────────────────
describe('UuidParamSchema', () => {
    it('accepts valid UUID', () => {
        const result = UuidParamSchema.safeParse({
            id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
        })
        expect(result.success).toBe(true)
    })

    it('rejects non-UUID string', () => {
        const result = UuidParamSchema.safeParse({ id: 'not-a-uuid' })
        expect(result.success).toBe(false)
    })

    it('rejects empty string', () => {
        const result = UuidParamSchema.safeParse({ id: '' })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// EquipmentCheckInSchema
// ──────────────────────────────────────────────
describe('EquipmentCheckInSchema', () => {
    it('accepts valid check-in', () => {
        const result = EquipmentCheckInSchema.safeParse({
            checkout_id: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing checkout_id', () => {
        const result = EquipmentCheckInSchema.safeParse({})
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// MaintenanceStatusSchema
// ──────────────────────────────────────────────
describe('MaintenanceStatusSchema', () => {
    it('accepts valid status', () => {
        const result = MaintenanceStatusSchema.safeParse({
            maintenanceId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            status: 'in_progress',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid status', () => {
        const result = MaintenanceStatusSchema.safeParse({
            maintenanceId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            status: 'cancelled',
        })
        expect(result.success).toBe(false)
    })
})

// ──────────────────────────────────────────────
// QuickUpdateTaskDateSchema
// ──────────────────────────────────────────────
describe('QuickUpdateTaskDateSchema', () => {
    it('accepts valid date update', () => {
        const result = QuickUpdateTaskDateSchema.safeParse({
            taskId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            deadline: '2026-07-01',
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing deadline', () => {
        const result = QuickUpdateTaskDateSchema.safeParse({
            taskId: 'd9c5c7c0-6bb1-4f96-9a67-3f0c5b3f1e2a',
            deadline: '',
        })
        expect(result.success).toBe(false)
    })
})
