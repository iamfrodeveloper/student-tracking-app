/**
 * Health check endpoint for monitoring and deployment verification
 * Provides comprehensive system status information
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { ErrorHandler } from '@/lib/error-handler'
import { productionConfig } from '@/lib/env-config'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: HealthCheck
    vectorDatabase: HealthCheck
    aiServices: HealthCheck
    memory: HealthCheck
    disk: HealthCheck
  }
  metadata: {
    nodeVersion: string
    platform: string
    requestId: string
  }
}

interface HealthCheck {
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  message?: string
  details?: Record<string, any>
}

// Cache health check results to avoid overwhelming services
const healthCache = new Map<string, { result: HealthCheck; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

async function checkDatabase(): Promise<HealthCheck> {
  const cacheKey = 'database'
  const cached = healthCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const start = performance.now()
  
  try {
    // Check if database configuration exists
    if (!process.env.NEON_DATABASE_URL) {
      const result: HealthCheck = {
        status: 'warn',
        message: 'Database not configured'
      }
      healthCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    }

    // Simple connection test (you can expand this)
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.NEON_DATABASE_URL,
      connectionTimeoutMillis: 5000
    })

    await client.connect()
    await client.query('SELECT 1')
    await client.end()

    const responseTime = performance.now() - start
    const result: HealthCheck = {
      status: 'pass',
      responseTime: Math.round(responseTime),
      message: 'Database connection successful'
    }
    
    healthCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  } catch (error) {
    const responseTime = performance.now() - start
    const result: HealthCheck = {
      status: 'fail',
      responseTime: Math.round(responseTime),
      message: 'Database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    healthCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  }
}

async function checkVectorDatabase(): Promise<HealthCheck> {
  const cacheKey = 'vectorDatabase'
  const cached = healthCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const start = performance.now()
  
  try {
    if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
      const result: HealthCheck = {
        status: 'warn',
        message: 'Vector database not configured'
      }
      healthCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    }

    // Simple Qdrant health check
    const response = await fetch(`${process.env.QDRANT_URL}/health`, {
      method: 'GET',
      headers: {
        'api-key': process.env.QDRANT_API_KEY
      },
      signal: AbortSignal.timeout(5000)
    })

    const responseTime = performance.now() - start
    
    if (response.ok) {
      const result: HealthCheck = {
        status: 'pass',
        responseTime: Math.round(responseTime),
        message: 'Vector database connection successful'
      }
      healthCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    } else {
      const result: HealthCheck = {
        status: 'fail',
        responseTime: Math.round(responseTime),
        message: 'Vector database connection failed',
        details: { statusCode: response.status }
      }
      healthCache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    }
  } catch (error) {
    const responseTime = performance.now() - start
    const result: HealthCheck = {
      status: 'fail',
      responseTime: Math.round(responseTime),
      message: 'Vector database connection failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    healthCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  }
}

async function checkAIServices(): Promise<HealthCheck> {
  const cacheKey = 'aiServices'
  const cached = healthCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const start = performance.now()
  const services = []
  
  try {
    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          signal: AbortSignal.timeout(5000)
        })
        services.push({ name: 'OpenAI', status: response.ok ? 'pass' : 'fail' })
      } catch {
        services.push({ name: 'OpenAI', status: 'fail' })
      }
    }

    // Check Google Gemini
    if (process.env.GOOGLE_GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`, {
          signal: AbortSignal.timeout(5000)
        })
        services.push({ name: 'Google Gemini', status: response.ok ? 'pass' : 'fail' })
      } catch {
        services.push({ name: 'Google Gemini', status: 'fail' })
      }
    }

    const responseTime = performance.now() - start
    const allPassed = services.every(s => s.status === 'pass')
    const anyFailed = services.some(s => s.status === 'fail')
    
    const result: HealthCheck = {
      status: services.length === 0 ? 'warn' : (allPassed ? 'pass' : (anyFailed ? 'fail' : 'warn')),
      responseTime: Math.round(responseTime),
      message: services.length === 0 ? 'No AI services configured' : 
               allPassed ? 'All AI services accessible' : 'Some AI services failed',
      details: { services }
    }
    
    healthCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  } catch (error) {
    const responseTime = performance.now() - start
    const result: HealthCheck = {
      status: 'fail',
      responseTime: Math.round(responseTime),
      message: 'AI services check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    healthCache.set(cacheKey, { result, timestamp: Date.now() })
    return result
  }
}

function checkMemory(): HealthCheck {
  try {
    const memUsage = process.memoryUsage()
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const usagePercent = Math.round((usedMB / totalMB) * 100)
    
    const status = usagePercent > 90 ? 'fail' : usagePercent > 75 ? 'warn' : 'pass'
    
    return {
      status,
      message: `Memory usage: ${usedMB}MB / ${totalMB}MB (${usagePercent}%)`,
      details: {
        heapUsed: usedMB,
        heapTotal: totalMB,
        usagePercent,
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Memory check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

function checkDisk(): HealthCheck {
  try {
    // Basic disk space check (simplified for this example)
    // In production, you might want to use a more sophisticated approach
    return {
      status: 'pass',
      message: 'Disk space check not implemented',
      details: { note: 'Running on serverless platform' }
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Disk check failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') || 
                   `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  logger.setRequestId(requestId)
  
  try {
    const startTime = performance.now()
    
    // Run all health checks in parallel
    const [database, vectorDatabase, aiServices] = await Promise.all([
      checkDatabase(),
      checkVectorDatabase(),
      checkAIServices()
    ])
    
    const memory = checkMemory()
    const disk = checkDisk()
    
    // Determine overall status
    const checks = { database, vectorDatabase, aiServices, memory, disk }
    const hasFailures = Object.values(checks).some(check => check.status === 'fail')
    const hasWarnings = Object.values(checks).some(check => check.status === 'warn')
    
    const overallStatus = hasFailures ? 'unhealthy' : hasWarnings ? 'degraded' : 'healthy'
    
    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: Math.round(process.uptime()),
      checks,
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        requestId
      }
    }
    
    const responseTime = performance.now() - startTime
    
    // Log health check
    logger.info('Health check completed', {
      status: overallStatus,
      responseTime: Math.round(responseTime),
      requestId
    })
    
    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503
    
    logger.clearRequestId()
    return NextResponse.json(healthStatus, { status: statusCode })
    
  } catch (error) {
    logger.clearRequestId()
    return ErrorHandler.handle(error as Error, requestId)
  }
}
