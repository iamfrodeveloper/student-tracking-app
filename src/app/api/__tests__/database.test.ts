import { NextRequest } from 'next/server'
import { POST as testDatabasePOST } from '../test/database/route'
import { POST as setupSchemaPOST } from '../setup/schema/route'

// Mock the database clients
jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
}))

jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => ({
    getCollections: jest.fn(),
    createCollection: jest.fn(),
    getCollection: jest.fn(),
  })),
}))

const mockPgClient = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
}

const mockQdrantClient = {
  getCollections: jest.fn(),
  createCollection: jest.fn(),
  getCollection: jest.fn(),
}

// Mock the Client constructors to return our mocks
const { Client } = require('pg')
const { QdrantClient } = require('@qdrant/js-client-rest')

Client.mockImplementation(() => mockPgClient)
QdrantClient.mockImplementation(() => mockQdrantClient)

describe('/api/test/database', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully tests database connections', async () => {
    // Mock successful database operations
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] })
    mockPgClient.end.mockResolvedValue(undefined)
    
    mockQdrantClient.getCollections.mockResolvedValue({
      collections: [{ name: 'test_collection' }]
    })

    const request = new NextRequest('http://localhost:3000/api/test/database', {
      method: 'POST',
      body: JSON.stringify({
        neon: {
          connectionString: 'postgresql://test:test@localhost:5432/test'
        },
        qdrant: {
          url: 'http://localhost:6333',
          apiKey: 'test-key',
          collectionName: 'test_collection'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testDatabasePOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.results.neon.success).toBe(true)
    expect(data.results.qdrant.success).toBe(true)
  })

  it('handles PostgreSQL connection failure', async () => {
    mockPgClient.connect.mockRejectedValue(new Error('Connection failed'))

    const request = new NextRequest('http://localhost:3000/api/test/database', {
      method: 'POST',
      body: JSON.stringify({
        neon: {
          connectionString: 'postgresql://invalid:invalid@localhost:5432/invalid'
        },
        qdrant: {
          url: 'http://localhost:6333',
          apiKey: 'test-key',
          collectionName: 'test_collection'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testDatabasePOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(data.results.neon.success).toBe(false)
    expect(data.results.neon.message).toContain('Connection failed')
  })

  it('handles Qdrant connection failure', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] })
    mockPgClient.end.mockResolvedValue(undefined)
    
    mockQdrantClient.getCollections.mockRejectedValue(new Error('Qdrant connection failed'))

    const request = new NextRequest('http://localhost:3000/api/test/database', {
      method: 'POST',
      body: JSON.stringify({
        neon: {
          connectionString: 'postgresql://test:test@localhost:5432/test'
        },
        qdrant: {
          url: 'http://invalid:6333',
          apiKey: 'invalid-key',
          collectionName: 'test_collection'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testDatabasePOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(data.results.qdrant.success).toBe(false)
    expect(data.results.qdrant.message).toContain('Qdrant connection failed')
  })

  it('handles invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/test/database', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testDatabasePOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Failed to test database connections')
  })
})

describe('/api/setup/schema', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully sets up database schema', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rowCount: 1 })
    mockPgClient.end.mockResolvedValue(undefined)
    
    mockQdrantClient.getCollections.mockResolvedValue({
      collections: []
    })
    mockQdrantClient.createCollection.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/setup/schema', {
      method: 'POST',
      body: JSON.stringify({
        neon: {
          connectionString: 'postgresql://test:test@localhost:5432/test'
        },
        qdrant: {
          url: 'http://localhost:6333',
          apiKey: 'test-key',
          collectionName: 'student_notes'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await setupSchemaPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('Database schema setup completed successfully')
    expect(data.details.tables_created).toContain('students')
    expect(data.details.tables_created).toContain('payments')
  })

  it('handles schema setup failure', async () => {
    mockPgClient.connect.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/setup/schema', {
      method: 'POST',
      body: JSON.stringify({
        neon: {
          connectionString: 'postgresql://invalid:invalid@localhost:5432/invalid'
        },
        qdrant: {
          url: 'http://localhost:6333',
          apiKey: 'test-key',
          collectionName: 'student_notes'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await setupSchemaPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Failed to setup database schema')
  })

  it('creates Qdrant collection if it does not exist', async () => {
    mockPgClient.connect.mockResolvedValue(undefined)
    mockPgClient.query.mockResolvedValue({ rowCount: 1 })
    mockPgClient.end.mockResolvedValue(undefined)
    
    // Mock collection doesn't exist
    mockQdrantClient.getCollections.mockResolvedValue({
      collections: []
    })
    mockQdrantClient.createCollection.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/setup/schema', {
      method: 'POST',
      body: JSON.stringify({
        neon: {
          connectionString: 'postgresql://test:test@localhost:5432/test'
        },
        qdrant: {
          url: 'http://localhost:6333',
          apiKey: 'test-key',
          collectionName: 'new_collection'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await setupSchemaPOST(request)
    const data = await response.json()

    expect(mockQdrantClient.createCollection).toHaveBeenCalledWith('new_collection', expect.any(Object))
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
