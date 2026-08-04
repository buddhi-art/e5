import { z } from 'zod';
import {
  InvoiceStatusUpdateSchema,
  ExpenseStatusSchema,
  ProjectStatusSchema,
  PackageSchema,
} from '@/lib/validations';

// ---------------------------------------------------------------------------
// INVOICE
// ---------------------------------------------------------------------------

export type InvoiceStatus = z.infer<typeof InvoiceStatusUpdateSchema>['status'];

export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'paid',
  'partially_paid',
  'overdue',
  'cancelled',
] as const satisfies readonly InvoiceStatus[];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// ---------------------------------------------------------------------------
// EXPENSE
// ---------------------------------------------------------------------------

export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>['status'];

export const EXPENSE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'reimbursed',
] as const satisfies readonly ExpenseStatus[];

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  reimbursed: 'Reimbursed',
};

// ---------------------------------------------------------------------------
// PROJECT
// ---------------------------------------------------------------------------

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>['status'];

export const PROJECT_STATUSES = [
  'not_started',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const satisfies readonly ProjectStatus[];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ---------------------------------------------------------------------------
// PACKAGE
// ---------------------------------------------------------------------------

export type PackageStatus = z.infer<typeof PackageSchema>['status'];

export const PACKAGE_STATUSES = [
  'in_progress',
  'completed',
  'cancelled',
] as const satisfies readonly PackageStatus[];

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ---------------------------------------------------------------------------
// PACKAGE PAYMENT STATUS
// ---------------------------------------------------------------------------

export type PackagePaymentStatus = z.infer<typeof PackageSchema>['payment_status'];

export const PACKAGE_PAYMENT_STATUSES = [
  'unpaid',
  'partially_paid',
  'paid',
] as const satisfies readonly PackagePaymentStatus[];

export const PACKAGE_PAYMENT_STATUS_LABELS: Record<PackagePaymentStatus, string> = {
  unpaid: 'Unpaid',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
};

// ---------------------------------------------------------------------------
// PACKAGE PAYMENT METHOD
// ---------------------------------------------------------------------------

export type PackagePaymentMethod = z.infer<typeof PackageSchema>['payment_method'];

export const PACKAGE_PAYMENT_METHODS = [
  'bank_transfer',
  'cash',
  'qr_code',
  'cheque',
  'esewa',
  'khalti',
  'other',
] as const satisfies readonly PackagePaymentMethod[];

export const PACKAGE_PAYMENT_METHOD_LABELS: Record<PackagePaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  qr_code: 'QR Code',
  cheque: 'Cheque',
  esewa: 'eSewa',
  khalti: 'Khalti',
  other: 'Other',
};
