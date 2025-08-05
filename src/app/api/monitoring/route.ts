/**
 * Monitoring dashboard API endpoint
 * Provides system metrics, performance data, and health information
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { monitoring } from '@/lib/monitoring'
import { ErrorHandler } from '@/lib/error-handler'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') || 
                   `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  logger.setRequestId(requestId)
  
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || 'dashboard'
    const timeRange = parseInt(url.searchParams.get('timeRange') || '3600000') // 1 hour default
    
    switch (type) {
      case 'dashboard':
        return handleDashboard(timeRange, requestId)
      case 'metrics':
        return handleMetrics(url.searchParams, timeRange, requestId)
      case 'events':
        return handleEvents(url.searchParams, requestId)
      case 'health':
        return handleHealthMetrics(requestId)
      default:
        return NextResponse.json(
          { error: 'Invalid monitoring type' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.clearRequestId()
    return ErrorHandler.handle(error as Error, requestId)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') || 
                   `monitor_post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  logger.setRequestId(requestId)
  
  try {
    const body = await request.json()
    const { type, data } = body
    
    switch (type) {
      case 'metric':
        return handleMetricSubmission(data, requestId)
      case 'event':
        return handleEventSubmission(data, requestId)
      case 'error':
        return handleErrorSubmission(data, requestId)
      default:
        return NextResponse.json(
          { error: 'Invalid submission type' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.clearRequestId()
    return ErrorHandler.handle(error as Error, requestId)
  }
}

async function handleDashboard(timeRange: number, requestId: string): Promise<NextResponse> {
  const report = monitoring.generateReport()
  const systemHealth = monitoring.getSystemHealth()
  
  // Get key performance metrics
  const apiResponseTime = monitoring.getMetricsSummary('api_request_duration', timeRange)
  const databasePerformance = monitoring.getMetricsSummary('database_operation_duration', timeRange)
  const aiApiPerformance = monitoring.getMetricsSummary('ai_api_duration', timeRange)
  
  const dashboard = {
    timestamp: new Date().toISOString(),
    timeRange,
    systemHealth,
    performance: {
      apiResponseTime,
      databasePerformance,
      aiApiPerformance
    },
    summary: {
      uptime: report.uptime,
      totalMetrics: report.topMetrics.length,
      recentEvents: report.recentEvents.length,
      systemStatus: systemHealth ? 
        (systemHealth.memory.percentage > 90 ? 'critical' :
         systemHealth.memory.percentage > 75 ? 'warning' : 'healthy') : 'unknown'
    },
    topMetrics: report.topMetrics.slice(0, 5),
    recentEvents: report.recentEvents.slice(-10),
    requestId
  }
  
  logger.info('Monitoring dashboard accessed', { requestId, timeRange })
  logger.clearRequestId()
  
  return NextResponse.json(dashboard)
}

async function handleMetrics(searchParams: URLSearchParams, timeRange: number, requestId: string): Promise<NextResponse> {
  const metricName = searchParams.get('name')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  if (metricName) {
    // Get specific metric
    const summary = monitoring.getMetricsSummary(metricName, timeRange)
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Metric not found or no data available' },
        { status: 404 }
      )
    }
    
    const response = {
      metric: metricName,
      timeRange,
      summary,
      requestId
    }
    
    logger.clearRequestId()
    return NextResponse.json(response)
  } else {
    // Get all metrics summary
    const report = monitoring.generateReport()
    
    const response = {
      timeRange,
      metrics: report.topMetrics.slice(0, limit),
      requestId
    }
    
    logger.clearRequestId()
    return NextResponse.json(response)
  }
}

async function handleEvents(searchParams: URLSearchParams, requestId: string): Promise<NextResponse> {
  const limit = parseInt(searchParams.get('limit') || '50')
  const eventType = searchParams.get('type')
  
  let events = monitoring.getRecentEvents(limit * 2) // Get more to filter
  
  if (eventType) {
    events = events.filter(event => event.event === eventType)
  }
  
  const response = {
    events: events.slice(0, limit),
    total: events.length,
    requestId
  }
  
  logger.clearRequestId()
  return NextResponse.json(response)
}

async function handleHealthMetrics(requestId: string): Promise<NextResponse> {
  const systemHealth = monitoring.getSystemHealth()
  
  if (!systemHealth) {
    return NextResponse.json(
      { error: 'System health data not available' },
      { status: 503 }
    )
  }
  
  // Calculate health score
  const memoryScore = Math.max(0, 100 - systemHealth.memory.percentage)
  const responseTimeScore = systemHealth.responseTime < 1000 ? 100 : 
                           systemHealth.responseTime < 2000 ? 75 : 
                           systemHealth.responseTime < 5000 ? 50 : 25
  const errorRateScore = Math.max(0, 100 - (systemHealth.errorRate * 100))
  
  const overallScore = Math.round((memoryScore + responseTimeScore + errorRateScore) / 3)
  
  const response = {
    ...systemHealth,
    healthScore: overallScore,
    status: overallScore > 80 ? 'healthy' : 
            overallScore > 60 ? 'warning' : 'critical',
    timestamp: new Date().toISOString(),
    requestId
  }
  
  logger.clearRequestId()
  return NextResponse.json(response)
}

async function handleMetricSubmission(data: any, requestId: string): Promise<NextResponse> {
  const { name, value, unit, context } = data
  
  if (!name || typeof value !== 'number') {
    return NextResponse.json(
      { error: 'Invalid metric data' },
      { status: 400 }
    )
  }
  
  monitoring.recordMetric(name, value, unit || 'count', context)
  
  logger.info('Metric submitted', { name, value, unit, requestId })
  logger.clearRequestId()
  
  return NextResponse.json({ success: true, requestId })
}

async function handleEventSubmission(data: any, requestId: string): Promise<NextResponse> {
  const { event, properties, userId, sessionId } = data
  
  if (!event) {
    return NextResponse.json(
      { error: 'Event name is required' },
      { status: 400 }
    )
  }
  
  monitoring.recordEvent(event, properties, userId, sessionId)
  
  logger.info('Event submitted', { event, userId, sessionId, requestId })
  logger.clearRequestId()
  
  return NextResponse.json({ success: true, requestId })
}

async function handleErrorSubmission(data: any, requestId: string): Promise<NextResponse> {
  const { error, context, userId, sessionId } = data
  
  if (!error) {
    return NextResponse.json(
      { error: 'Error information is required' },
      { status: 400 }
    )
  }
  
  // Log the error
  logger.error('Client error reported', {
    clientError: error,
    userId,
    sessionId,
    requestId,
    ...context
  })
  
  // Record as event
  monitoring.recordEvent('client_error', {
    error: typeof error === 'string' ? error : error.message,
    ...context
  }, userId, sessionId)
  
  logger.clearRequestId()
  return NextResponse.json({ success: true, requestId })
}
