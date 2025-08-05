import { NextRequest } from 'next/server'
import { POST as studentsPOST } from '../students/route'
import { POST as paymentsPOST } from '../payments/route'
import { POST as testsPOST } from '../tests/route'
import { configManager } from '@/lib/config'

// Mock the database client
jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

// Mock the config manager
jest.mock('@/lib/config', () => ({
  configManager: {
    getConfig: jest.fn(),
  },
}))

const mockPgClient = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}

const { Client } = require('pg')
Client.mockImplementation(() => mockPgClient)

const mockConfig = {
  database: {
    neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
    qdrant: { url: 'http://localhost:6333', apiKey: 'test-key', collectionName: 'student_notes' }
  }
}

describe('/api/setup/sample-data/students', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(configManager.getConfig as jest.Mock).mockReturnValue(mockConfig)
  })

  it('successfully loads sample students', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rowCount: 1 })
    mockPgClient.end.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/students', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await studentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBeGreaterThan(0)
    expect(data.message).toContain('Successfully loaded')
    expect(mockPgClient.connect).toHaveBeenCalled()
    expect(mockPgClient.query).toHaveBeenCalled()
    expect(mockPgClient.end).toHaveBeenCalled()
  })

  it('uses connection string from request body when provided', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rowCount: 1 })
    mockPgClient.end.mockResolvedValue(undefined)

    const customConnectionString = 'postgresql://custom:custom@localhost:5432/custom'

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/students', {
      method: 'POST',
      body: JSON.stringify({
        connectionString: customConnectionString
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await studentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Client).toHaveBeenCalledWith({
      connectionString: customConnectionString
    })
  })

  it('handles missing database configuration', async () => {
    ;(configManager.getConfig as jest.Mock).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/students', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await studentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Database configuration not found')
  })

  it('handles database connection failure', async () => {
    mockPgClient.connect.mockRejectedValue(new Error('Connection failed'))

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/students', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await studentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Failed to load sample students')
  })

  it('handles database query failure', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockRejectedValue(new Error('Query failed'))
    mockPgClient.end.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/students', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await studentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.count).toBe(0)
  })
})

describe('/api/setup/sample-data/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(configManager.getConfig as jest.Mock).mockReturnValue(mockConfig)
  })

  it('successfully loads sample payments', async () => {
    // Mock student IDs query
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query
      .mockResolvedValueOnce({ rows: [{ student_id: 1 }, { student_id: 2 }] }) // Student IDs query
      .mockResolvedValue({ rowCount: 1 }) // Payment insert queries
    mockPgClient.end.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/payments', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await paymentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBeGreaterThan(0)
    expect(data.message).toContain('Successfully loaded')
  })

  it('handles no existing students', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rows: [] }) // No students found
    mockPgClient.end.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/payments', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await paymentsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('No students found')
  })
})

describe('/api/setup/sample-data/tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(configManager.getConfig as jest.Mock).mockReturnValue(mockConfig)
  })

  it('successfully loads sample test records', async () => {
    // Mock student IDs query
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query
      .mockResolvedValueOnce({ rows: [{ student_id: 1 }, { student_id: 2 }] }) // Student IDs query
      .mockResolvedValue({ rowCount: 1 }) // Test insert queries
    mockPgClient.end.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/tests', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBeGreaterThan(0)
    expect(data.message).toContain('Successfully loaded')
  })

  it('handles database error during test loading', async () => {
    mockPgClient.connect.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/setup/sample-data/tests', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testsPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Failed to load sample test records')
  })
})
