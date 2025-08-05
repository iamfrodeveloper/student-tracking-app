/**
 * Monitoring and analytics utilities for the Student Tracking App
 * Provides performance tracking, error monitoring, and usage analytics
 */

import { logger } from './logger'
import { productionConfig } from './env-config'

// Performance metrics interface
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  context?: Record<string, any>
}

// User analytics event interface
export interface AnalyticsEvent {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp: string
}

// System health metrics
export interface SystemMetrics {
  memory: {
    used: number
    total: number
    percentage: number
  }
  uptime: number
  responseTime: number
  errorRate: number
  requestCount: number
}

class MonitoringService {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private events: AnalyticsEvent[] = []
  private systemMetrics: SystemMetrics | null = null
  private startTime: number = Date.now()

  constructor() {
    // Initialize monitoring if enabled
    if (productionConfig.monitoring.enablePerformanceMonitoring) {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)

    // Clean up old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics()
    }, 300000)
  }

  private collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage()
      const uptime = process.uptime()

      this.systemMetrics = {
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        uptime: Math.round(uptime),
        responseTime: 0, // Will be updated by request tracking
        errorRate: 0, // Will be calculated from error logs
        requestCount: 0 // Will be updated by request tracking
      }

      logger.performance('system_metrics', this.systemMetrics.memory.percentage, '%', {
        type: 'memory_usage',
        ...this.systemMetrics
      })
    } catch (error) {
      logger.error('Failed to collect system metrics', {}, error as Error)
    }
  }

  private cleanupOldMetrics() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    
    for (const [key, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(metric => 
        new Date(metric.timestamp).getTime() > cutoff
      )
      this.metrics.set(key, filtered)
    }

    // Clean up old events
    this.events = this.events.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    )
  }

  // Record performance metric
  recordMetric(name: string, value: number, unit: string, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    this.metrics.get(name)!.push(metric)

    // Log performance metric
    logger.performance(name, value, unit, context)

    // Send to external monitoring service if configured
    this.sendToExternalService('metric', metric)
  }

  // Record analytics event
  recordEvent(event: string, properties?: Record<string, any>, userId?: string, sessionId?: string) {
    if (!productionConfig.monitoring.enableAnalytics) {
      return
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      userId,
      sessionId,
      properties,
      timestamp: new Date().toISOString()
    }

    this.events.push(analyticsEvent)

    // Log user action
    logger.userAction(event, userId, { sessionId, ...properties })

    // Send to external analytics service
    this.sendToExternalService('event', analyticsEvent)
  }

  // Track API request
  trackRequest(method: string, path: string, statusCode: number, duration: number, userId?: string) {
    this.recordMetric('api_request_duration', duration, 'ms', {
      method,
      path,
      statusCode,
      userId
    })

    // Update system metrics
    if (this.systemMetrics) {
      this.systemMetrics.requestCount++
      this.systemMetrics.responseTime = duration
      
      if (statusCode >= 400) {
        this.systemMetrics.errorRate = (this.systemMetrics.errorRate + 1) / this.systemMetrics.requestCount
      }
    }

    // Record analytics event
    this.recordEvent('api_request', {
      method,
      path,
      statusCode,
      duration
    }, userId)
  }

  // Track database operation
  trackDatabaseOperation(operation: string, duration: number, success: boolean, context?: Record<string, any>) {
    this.recordMetric('database_operation_duration', duration, 'ms', {
      operation,
      success,
      ...context
    })

    this.recordEvent('database_operation', {
      operation,
      duration,
      success,
      ...context
    })
  }

  // Track AI API call
  trackAIAPICall(provider: string, model: string, duration: number, success: boolean, context?: Record<string, any>) {
    this.recordMetric('ai_api_duration', duration, 'ms', {
      provider,
      model,
      success,
      ...context
    })

    this.recordEvent('ai_api_call', {
      provider,
      model,
      duration,
      success,
      ...context
    })
  }

  // Get metrics summary
  getMetricsSummary(metricName: string, timeRange: number = 3600000): {
    count: number
    average: number
    min: number
    max: number
    latest: number
  } | null {
    const metrics = this.metrics.get(metricName)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const cutoff = Date.now() - timeRange
    const recentMetrics = metrics.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoff
    )

    if (recentMetrics.length === 0) {
      return null
    }

    const values = recentMetrics.map(m => m.value)
    
    return {
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    }
  }

  // Get system health
  getSystemHealth(): SystemMetrics | null {
    return this.systemMetrics
  }

  // Get recent events
  getRecentEvents(limit: number = 100): AnalyticsEvent[] {
    return this.events.slice(-limit)
  }

  // Send data to external monitoring service
  private async sendToExternalService(type: 'metric' | 'event', data: any) {
    if (!productionConfig.monitoring.sentryDSN) {
      return
    }

    try {
      // Send to external service (e.g., Sentry, DataDog, etc.)
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      logger.error('Failed to send monitoring data to external service', {}, error as Error)
    }
  }

  // Generate monitoring report
  generateReport(): {
    systemHealth: SystemMetrics | null
    topMetrics: Array<{ name: string; summary: any }>
    recentEvents: AnalyticsEvent[]
    uptime: number
  } {
    const topMetrics = Array.from(this.metrics.keys())
      .slice(0, 10)
      .map(name => ({
        name,
        summary: this.getMetricsSummary(name)
      }))
      .filter(item => item.summary !== null)

    return {
      systemHealth: this.systemMetrics,
      topMetrics,
      recentEvents: this.getRecentEvents(50),
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    }
  }
}

// Create singleton monitoring service
export const monitoring = new MonitoringService()

// Middleware for automatic request tracking
export function withMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const start = performance.now()
    let success = true
    
    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = performance.now() - start
      monitoring.recordMetric(`${operation}_duration`, duration, 'ms', { success })
    }
  }
}

// React hook for client-side monitoring
export function useMonitoring() {
  const trackEvent = (event: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      monitoring.recordEvent(event, properties)
    }
  }

  const trackPerformance = (name: string, value: number, unit: string = 'ms') => {
    if (typeof window !== 'undefined') {
      monitoring.recordMetric(name, value, unit)
    }
  }

  return {
    trackEvent,
    trackPerformance
  }
}

// Error boundary with monitoring
export function withErrorMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => R | Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      const result = await fn(...args)
      monitoring.recordEvent('operation_success', { operation })
      return result
    } catch (error) {
      monitoring.recordEvent('operation_error', { 
        operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      logger.error(`Operation ${operation} failed`, { operation }, error as Error)
      throw error
    }
  }
}
