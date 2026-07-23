/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Centralized Error Handling Middleware
 *
 * Provides consistent error handling, logging, and response formatting
 * across the application.
 */

import { NextResponse } from 'next/server'
import React from 'react'
import { AppError, isAppError, isOperationalError } from './app-errors'
import { logAuditEvent } from '@/lib/auth/auth-utils'

/**
 * Error handling middleware for API routes
 */
export function handleApiError(error: unknown): NextResponse {
    const { response, logData } = processError(error)

    // Log the error
    if (logData) {
        console.error('API Error:', logData)
        // Log to audit system for critical errors
        if (logData.isCritical) {
            logAuditEvent(
                'SYSTEM_ERROR',
                'error',
                logData.errorId || 'unknown',
                {
                    errorName: logData.errorName,
                    errorMessage: logData.errorMessage,
                    statusCode: logData.statusCode,
                    isOperational: logData.isOperational
                }
            ).catch(console.error)
        }
    }

    return response
}

/**
 * Error handling for server actions
 */

/**
 * Process error and generate response
 */
function processError(error: unknown): { response: NextResponse, logData: ErrorLogData } {
    // Generate unique error ID
    const errorId = generateErrorId()

    if (isAppError(error)) {
        // Handle known application errors
        const logData = createErrorLogData(error, errorId)
        const response = createErrorResponse(error, errorId)
        return { response, logData }
    } else if (error instanceof Error) {
        // Handle generic errors
        const appError = new AppError(
            'InternalServerError',
            error.message || 'An unexpected error occurred',
            500,
            false,
            { originalError: error.name }
        )
        const logData = createErrorLogData(appError, errorId, true)
        const response = createErrorResponse(appError, errorId)
        return { response, logData }
    } else {
        // Handle unknown errors
        const appError = new AppError(
            'InternalServerError',
            'An unknown error occurred',
            500,
            false
        )
        const logData = createErrorLogData(appError, errorId, true)
        const response = createErrorResponse(appError, errorId)
        return { response, logData }
    }
}

/**
 * Create error response
 */
function createErrorResponse(error: AppError, errorId: string): NextResponse {
    const responseData = {
        error: {
            id: errorId,
            name: error.name,
            message: error.message,
            ...(process.env.NODE_ENV === 'development' ? { details: error.details as Record<string, unknown> | undefined } : {}),
            ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
        }
    }

    return NextResponse.json(responseData, { status: error.statusCode })
}

/**
 * Error log data structure
 */
interface ErrorLogData {
    errorId: string
    errorName: string
    errorMessage: string
    statusCode: number
    isOperational: boolean
    isCritical: boolean
    timestamp: string
    details?: Record<string, unknown>
}

/**
 * Create error log data
 */
function createErrorLogData(error: AppError, errorId: string, isCritical: boolean = false): ErrorLogData {
    return {
        errorId,
        errorName: error.name,
        errorMessage: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        isCritical: isCritical || !error.isOperational,
        timestamp: new Date().toISOString(),
        details: error.details as Record<string, unknown> | undefined
    }
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Error boundary component for React
 */
export function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
    try {
        return React.createElement(React.Fragment, null, children)
    } catch (error: unknown) {
        console.error('ErrorBoundary caught error:', error)
        return React.createElement(React.Fragment, null, fallback)
    }
}

/**
 * Async error boundary for React components
 */
export function withErrorBoundary<Props extends object>(
    Component: React.ComponentType<Props>,
    FallbackComponent: React.ComponentType<{ error: AppError }>
): React.ComponentType<Props> {
    return function WrappedComponent(props: Props) {
        try {
            return React.createElement(Component, props)
        } catch (error: unknown) {
            const appError = isAppError(error)
                ? error
                : new AppError(
                    'ComponentError',
                    error instanceof Error ? error.message : 'Component rendering failed',
                    500,
                    false
                )
            return React.createElement(FallbackComponent, { error: appError })
        }
    }
}

/**
 * Error handling for server actions
 */
export async function handleActionError(error: unknown): Promise<{ error: string | Record<string, unknown> }> {
    const { response, logData } = processError(error)

    // Log the error
    if (logData) {
        console.error('Action Error:', logData)
        // Log to audit system for critical errors
        if (logData.isCritical) {
            logAuditEvent(
                'SYSTEM_ERROR',
                'error',
                logData.errorId || 'unknown',
                {
                    errorName: logData.errorName,
                    errorMessage: logData.errorMessage,
                    statusCode: logData.statusCode,
                    isOperational: logData.isOperational
                }
            ).catch(console.error)
        }
    }

    // Extract error data from response
    const responseData = await response.json() as { error: string | Record<string, unknown> }
    return { error: responseData.error }
}
/**
 * Error handler for async operations
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: AppError) => T
): Promise<T> {
    try {
        return await operation()
    } catch (error: unknown) {
        if (isAppError(error)) {
            if (errorHandler) {
                return errorHandler(error)
            }
            throw error
        } else {
            const appError = new AppError(
                'OperationError',
                error instanceof Error ? error.message : 'Operation failed',
                500,
                false
            )
            if (errorHandler) {
                return errorHandler(appError)
            }
            throw appError
        }
    }
}

/**
 * Convert error to AppError
 */
export function normalizeError(error: unknown): AppError {
    if (isAppError(error)) {
        return error
    } else if (error instanceof Error) {
        return new AppError(
            'NormalizedError',
            error.message,
            500,
            false,
            { originalError: error.name }
        )
    } else {
        const errorMessage = typeof error === 'string' ? error : 'An unknown error occurred'
        return new AppError(
            'UnknownError',
            errorMessage,
            500,
            false
        )
    }
}

/**
 * Error handler for Next.js middleware
 */
export function handleMiddlewareError(error: unknown): NextResponse {
    return handleApiError(error)
}