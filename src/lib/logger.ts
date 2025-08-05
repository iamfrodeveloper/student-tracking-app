/**
 * Production-ready logging system for the Student Tracking App
 * Provides structured logging with different levels and output formats
 */

import { productionConfig } from './env-config'

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Log entry interface
export interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: Record<string, any>
  error?: Error
  requestId?: string
  userId?: string
  sessionId?: string
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  remoteEndpoint?: string
  sensitiveFields: string[]
}

class Logger {
  private config: LoggerConfig
  private requestId: string | null = null

  constructor() {
    this.config = {
      level: this.getLogLevel(),
      enableConsole: true,
      enableFile: process.env.NODE_ENV === 'production',
      enableRemote: !!productionConfig.monitoring.sentryDSN,
      remoteEndpoint: productionConfig.monitoring.sentryDSN,
      sensitiveFields: [
        'password',
        'apiKey',
        'token',
        'secret',
        'connectionString',
        'authorization',
        'cookie'
      ]
    }
  }

  private getLogLevel(): LogLevel {
    const level = productionConfig.monitoring.logLevel
    switch (level) {
      case 'error': return LogLevel.ERROR
      case 'warn': return LogLevel.WARN
      case 'info': return LogLevel.INFO
      case 'debug': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  setRequestId(requestId: string) {
    this.requestId = requestId
  }

  clearRequestId() {
    this.requestId = null
  }

  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item))
    }

    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = this.config.sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      )

      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private formatLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context: context ? this.sanitizeData(context) : undefined,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as any : undefined,
      requestId: this.requestId || undefined
    }

    return entry
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level
  }

  private writeToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return

    const colorMap = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[37m'  // White
    }

    const reset = '\x1b[0m'
    const color = colorMap[entry.level as keyof typeof colorMap] || reset

    const logMessage = `${color}[${entry.timestamp}] ${entry.level}: ${entry.message}${reset}`
    
    if (entry.level === 'ERROR') {
      console.error(logMessage, entry.context, entry.error)
    } else if (entry.level === 'WARN') {
      console.warn(logMessage, entry.context)
    } else {
      console.log(logMessage, entry.context)
    }
  }

  private async writeToRemote(entry: LogEntry) {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return

    try {
      // Send to external logging service (e.g., Sentry, LogRocket, etc.)
      await fetch('/api/logging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entry)
      })
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote service:', error)
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry = this.formatLogEntry(level, message, context, error)

    // Write to console
    this.writeToConsole(entry)

    // Write to remote service
    this.writeToRemote(entry).catch(err => {
      console.error('Remote logging failed:', err)
    })
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, statusCode: number, duration: number, context?: Record<string, any>) {
    this.info(`API ${method} ${url} - ${statusCode} (${duration}ms)`, {
      type: 'api_request',
      method,
      url,
      statusCode,
      duration,
      ...context
    })
  }

  apiError(method: string, url: string, error: Error, context?: Record<string, any>) {
    this.error(`API ${method} ${url} failed`, {
      type: 'api_error',
      method,
      url,
      ...context
    }, error)
  }

  databaseQuery(query: string, duration: number, context?: Record<string, any>) {
    this.debug(`Database query executed (${duration}ms)`, {
      type: 'database_query',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      ...context
    })
  }

  databaseError(query: string, error: Error, context?: Record<string, any>) {
    this.error('Database query failed', {
      type: 'database_error',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      ...context
    }, error)
  }

  userAction(action: string, userId?: string, context?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      type: 'user_action',
      action,
      userId,
      ...context
    })
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>) {
    const logMethod = severity === 'high' ? this.error : severity === 'medium' ? this.warn : this.info
    logMethod.call(this, `Security event: ${event}`, {
      type: 'security_event',
      event,
      severity,
      ...context
    })
  }

  performance(metric: string, value: number, unit: string, context?: Record<string, any>) {
    this.info(`Performance metric: ${metric} = ${value}${unit}`, {
      type: 'performance_metric',
      metric,
      value,
      unit,
      ...context
    })
  }
}

// Create singleton logger instance
export const logger = new Logger()

// Request ID middleware for tracking requests
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Error boundary for React components
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, any>,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'ErrorBoundary'
    
    // Log the error
    logger.error(message, context, originalError)
  }
}

// Async error handler
export function handleAsyncError<T>(
  promise: Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return promise.catch(error => {
    logger.error('Async operation failed', context, error)
    throw error
  })
}

// Performance monitoring
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>,
  context?: Record<string, any>
): T | Promise<T> {
  const start = performance.now()
  
  try {
    const result = fn()
    
    if (result instanceof Promise) {
      return result
        .then(value => {
          const duration = performance.now() - start
          logger.performance(operation, duration, 'ms', context)
          return value
        })
        .catch(error => {
          const duration = performance.now() - start
          logger.error(`Operation ${operation} failed after ${duration}ms`, context, error)
          throw error
        })
    } else {
      const duration = performance.now() - start
      logger.performance(operation, duration, 'ms', context)
      return result
    }
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`Operation ${operation} failed after ${duration}ms`, context, error as Error)
    throw error
  }
}
