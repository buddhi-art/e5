/**
 * Application Error Hierarchy
 *
 * Standardized error classes for consistent error handling across the application.
 */

// Base error class
export class AppError extends Error {
    constructor(
        public readonly name: string,
        public readonly message: string,
        public readonly statusCode: number,
        public readonly isOperational: boolean = true,
        public readonly details?: any
    ) {
        super(message)
        Error.captureStackTrace(this, this.constructor)
    }

    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                statusCode: this.statusCode,
                details: this.details
            }
        }
    }
}

// Authentication errors
export class AuthError extends AppError {
    constructor(message: string, details?: any) {
        super('AuthError', message, 401, true, details)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', details?: any) {
        super('UnauthorizedError', message, 401, true, details)
    }
}

export class PermissionDeniedError extends AppError {
    constructor(message: string = 'Permission denied', details?: any) {
        super('PermissionDeniedError', message, 403, true, details)
    }
}

// Validation errors
export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: any) {
        super('ValidationError', message, 400, true, details)
    }
}

export class InvalidInputError extends AppError {
    constructor(message: string = 'Invalid input', details?: any) {
        super('InvalidInputError', message, 400, true, details)
    }
}

// Database errors
export class DatabaseError extends AppError {
    constructor(message: string = 'Database error', details?: any) {
        super('DatabaseError', message, 500, true, details)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', details?: any) {
        super('NotFoundError', message, 404, true, details)
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict', details?: any) {
        super('ConflictError', message, 409, true, details)
    }
}

// Transaction errors
export class TransactionError extends AppError {
    constructor(message: string = 'Transaction failed', details?: any) {
        super('TransactionError', message, 400, true, details)
    }
}

export class DeadlockError extends AppError {
    constructor(message: string = 'Deadlock detected', details?: any) {
        super('DeadlockError', message, 409, true, details)
    }
}

// Service errors
export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service unavailable', details?: any) {
        super('ServiceUnavailableError', message, 503, true, details)
    }
}

export class ExternalServiceError extends AppError {
    constructor(message: string = 'External service error', details?: any) {
        super('ExternalServiceError', message, 502, true, details)
    }
}

// Rate limiting
export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests', details?: any) {
        super('RateLimitError', message, 429, true, details)
    }
}

// File/Storage errors
export class FileUploadError extends AppError {
    constructor(message: string = 'File upload failed', details?: any) {
        super('FileUploadError', message, 400, true, details)
    }
}

export class FileSizeError extends AppError {
    constructor(message: string = 'File too large', details?: any) {
        super('FileSizeError', message, 400, true, details)
    }
}

export class FileTypeError extends AppError {
    constructor(message: string = 'Invalid file type', details?: any) {
        super('FileTypeError', message, 400, true, details)
    }
}

// Business logic errors
export class BusinessRuleViolationError extends AppError {
    constructor(message: string = 'Business rule violation', details?: any) {
        super('BusinessRuleViolationError', message, 400, true, details)
    }
}

// Helper functions
export function isAppError(error: any): error is AppError {
    return error instanceof AppError
}

export function isOperationalError(error: any): boolean {
    return isAppError(error) && error.isOperational
}

export function createErrorFromSupabase(error: any): AppError {
    if (!error) return new DatabaseError('Unknown database error')

    // Handle specific Supabase error codes
    switch (error.code) {
        case '23505': // Unique violation
            return new ConflictError(error.message, {
                code: error.code,
                details: error.details,
                hint: error.hint
            })
        case '23503': // Foreign key violation
            return new NotFoundError(error.message, {
                code: error.code,
                details: error.details,
                hint: error.hint
            })
        case '42501': // Permission denied
            return new PermissionDeniedError(error.message, {
                code: error.code,
                details: error.details
            })
        case 'P0001': // Raise exception
            if (error.message.includes('already booked')) {
                return new ConflictError(error.message)
            }
            return new BusinessRuleViolationError(error.message, {
                code: error.code,
                details: error.details
            })
        case '40P01': // Deadlock detected
            return new DeadlockError(error.message, {
                code: error.code,
                details: error.details
            })
        default:
            return new DatabaseError(error.message, {
                code: error.code,
                details: error.details,
                hint: error.hint
            })
    }
}

export function createErrorFromZod(error: any): ValidationError {
    const issues = error.issues?.map((issue: any) => ({
        path: issue.path?.join('.'),
        message: issue.message,
        code: issue.code
    })) || []

    return new ValidationError('Validation failed', {
        issues,
        originalError: error.message
    })
}

export function createErrorFromFileUpload(error: any): AppError {
    if (error.includes('size')) {
        return new FileSizeError(error)
    }
    if (error.includes('type') || error.includes('MIME')) {
        return new FileTypeError(error)
    }
    return new FileUploadError(error)
}