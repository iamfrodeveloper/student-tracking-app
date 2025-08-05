/**
 * Security utilities and middleware for the Student Tracking App
 * Implements comprehensive security measures for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest) => {
    const ip = getClientIP(request)
    const key = `rate_limit:${ip}`
    const now = Date.now()
    
    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
    
    const current = rateLimitStore.get(key)
    
    if (!current || current.resetTime < now) {
      // Reset window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return null // Allow request
    }
    
    if (current.count >= config.maxRequests) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - current.count).toString(),
            'X-RateLimit-Reset': new Date(current.resetTime).toISOString()
          }
        }
      )
    }
    
    // Increment counter
    current.count++
    return null // Allow request
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

/**
 * CORS middleware with configurable origins
 */
export function corsMiddleware(allowedOrigins?: string[]) {
  return (request: NextRequest) => {
    const origin = request.headers.get('origin')
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Default allowed origins
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-domain.com',
      'https://your-domain.vercel.app'
    ]
    
    const origins = allowedOrigins || (isProduction ? 
      (process.env.ALLOWED_ORIGINS?.split(',') || defaultOrigins) : 
      ['*']
    )
    
    // Check if origin is allowed
    const isAllowed = origins.includes('*') || 
      (origin && origins.includes(origin)) ||
      !origin // Allow same-origin requests
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'CORS policy violation', message: 'Origin not allowed' },
        { status: 403 }
      )
    }
    
    return null // Allow request
  }
}

/**
 * Input validation and sanitization
 */
export function validateInput(data: any, schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic validation rules
  const validateField = (value: any, rules: any, fieldName: string) => {
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`)
      return
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`)
      }
      
      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push(`${fieldName} must be a number`)
      }
      
      if (rules.type === 'email' && !isValidEmail(value)) {
        errors.push(`${fieldName} must be a valid email`)
      }
      
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`)
      }
    }
  }
  
  // Validate each field
  for (const [fieldName, rules] of Object.entries(schema)) {
    validateField(data[fieldName], rules, fieldName)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * Email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * API key validation
 */
export function validateAPIKey(apiKey: string, provider: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }
  
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20
    case 'google':
      return apiKey.length >= 32 && /^[A-Za-z0-9_-]+$/.test(apiKey)
    case 'custom':
      return apiKey.length >= 8
    default:
      return apiKey.length >= 8
  }
}

/**
 * Database connection string validation
 */
export function validateConnectionString(connectionString: string): boolean {
  if (!connectionString || typeof connectionString !== 'string') {
    return false
  }
  
  // Basic PostgreSQL connection string validation
  const postgresRegex = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^?]+(\?.*)?$/
  return postgresRegex.test(connectionString)
}

/**
 * Security headers for API responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * Comprehensive API security middleware
 */
export function securityMiddleware(config?: {
  rateLimit?: RateLimitConfig
  allowedOrigins?: string[]
  requireAuth?: boolean
}) {
  return async (request: NextRequest) => {
    // Rate limiting
    if (config?.rateLimit) {
      const rateLimitResult = rateLimit(config.rateLimit)(request)
      if (rateLimitResult) {
        return rateLimitResult
      }
    }
    
    // CORS check
    const corsResult = corsMiddleware(config?.allowedOrigins)(request)
    if (corsResult) {
      return corsResult
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      })
    }
    
    return null // Allow request to continue
  }
}

/**
 * Environment variable validation
 */
export function validateEnvironmentVariables(): { isValid: boolean; missing: string[] } {
  const required = [
    'NODE_ENV',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ]
  
  const optional = [
    'NEON_DATABASE_URL',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_GEMINI_API_KEY'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  return {
    isValid: missing.length === 0,
    missing
  }
}
