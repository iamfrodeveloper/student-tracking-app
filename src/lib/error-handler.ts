/**
 * Comprehensive error handling system for the Student Tracking App
 * Provides standardized error responses and logging
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'

// Error types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Base application error class
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly context: Record<string, any>
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {},
    isOperational: boolean = true
  ) {
    super(message)
    
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.severity = severity
    this.context = context
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, ErrorType.VALIDATION_ERROR, 400, ErrorSeverity.LOW, context)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context: Record<string, any> = {}) {
    super(message, ErrorType.AUTHENTICATION_ERROR, 401, ErrorSeverity.MEDIUM, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context: Record<string, any> = {}) {
    super(message, ErrorType.AUTHORIZATION_ERROR, 403, ErrorSeverity.MEDIUM, context)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, context: Record<string, any> = {}) {
    super(`${resource} not found`, ErrorType.NOT_FOUND_ERROR, 404, ErrorSeverity.LOW, context)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context: Record<string, any> = {}) {
    super(message, ErrorType.RATE_LIMIT_ERROR, 429, ErrorSeverity.MEDIUM, context)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, ErrorType.DATABASE_ERROR, 500, ErrorSeverity.HIGH, context)
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, message: string, context: Record<string, any> = {}) {
    super(`${service} API error: ${message}`, ErrorType.EXTERNAL_API_ERROR, 502, ErrorSeverity.MEDIUM, context)
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(message, ErrorType.CONFIGURATION_ERROR, 500, ErrorSeverity.HIGH, context)
  }
}

// Error response interface
interface ErrorResponse {
  success: false
  error: {
    type: string
    message: string
    code?: string
    details?: any
    timestamp: string
    requestId?: string
  }
}

// Error handler class
export class ErrorHandler {
  static handle(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    // Log the error
    logger.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      requestId
    }, error)

    // Handle different error types
    if (error instanceof AppError) {
      return this.handleAppError(error, requestId)
    }

    // Handle known error types
    if (error.name === 'ValidationError') {
      return this.handleValidationError(error, requestId)
    }

    if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
      return this.handleJSONError(error, requestId)
    }

    if (error.name === 'TypeError') {
      return this.handleTypeError(error, requestId)
    }

    // Handle database errors
    if (this.isDatabaseError(error)) {
      return this.handleDatabaseError(error, requestId)
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, requestId)
    }

    // Default to internal server error
    return this.handleInternalServerError(error, requestId)
  }

  private static handleAppError(error: AppError, requestId?: string): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        type: error.type,
        message: this.sanitizeErrorMessage(error.message),
        timestamp: error.timestamp,
        requestId
      }
    }

    // Add details for development environment
    if (process.env.NODE_ENV === 'development') {
      response.error.details = error.context
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  private static handleValidationError(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Validation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status: 400 })
  }

  private static handleJSONError(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid JSON format',
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status: 400 })
  }

  private static handleTypeError(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Invalid data type',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status: 400 })
  }

  private static handleDatabaseError(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    logger.error('Database error occurred', { requestId }, error)

    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.DATABASE_ERROR,
        message: 'Database operation failed',
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status: 500 })
  }

  private static handleNetworkError(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    logger.error('Network error occurred', { requestId }, error)

    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.EXTERNAL_API_ERROR,
        message: 'External service unavailable',
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status: 502 })
  }

  private static handleInternalServerError(error: Error, requestId?: string): NextResponse<ErrorResponse> {
    logger.error('Internal server error', { requestId }, error)

    const response: ErrorResponse = {
      success: false,
      error: {
        type: ErrorType.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString(),
        requestId
      }
    }

    return NextResponse.json(response, { status: 500 })
  }

  private static isDatabaseError(error: Error): boolean {
    const dbErrorIndicators = [
      'connection',
      'timeout',
      'constraint',
      'duplicate',
      'foreign key',
      'syntax error',
      'relation',
      'column',
      'table'
    ]

    return dbErrorIndicators.some(indicator => 
      error.message.toLowerCase().includes(indicator)
    )
  }

  private static isNetworkError(error: Error): boolean {
    const networkErrorIndicators = [
      'fetch',
      'network',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET'
    ]

    return networkErrorIndicators.some(indicator => 
      error.message.includes(indicator) || error.name.includes(indicator)
    )
  }

  private static sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    const sensitivePatterns = [
      /password[=:]\s*\S+/gi,
      /api[_-]?key[=:]\s*\S+/gi,
      /token[=:]\s*\S+/gi,
      /secret[=:]\s*\S+/gi,
      /postgresql:\/\/[^@]+@[^\/]+/gi
    ]

    let sanitized = message
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]')
    })

    return sanitized
  }
}

// Async wrapper for error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      
      // Wrap unknown errors
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        ErrorType.INTERNAL_SERVER_ERROR,
        500,
        ErrorSeverity.HIGH,
        { originalError: error }
      )
    }
  }
}

// Middleware for API routes
export function apiErrorHandler(handler: Function) {
  return async (request: Request, context?: any) => {
    const requestId = request.headers.get('x-request-id') || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    logger.setRequestId(requestId)

    try {
      const result = await handler(request, context)
      logger.clearRequestId()
      return result
    } catch (error) {
      logger.clearRequestId()
      return ErrorHandler.handle(error as Error, requestId)
    }
  }
}
