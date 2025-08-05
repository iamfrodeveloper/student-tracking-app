import { NextRequest } from 'next/server'
import { POST as chatPOST } from '../chat/route'
import { configManager } from '@/lib/config'
import { databaseManager } from '@/lib/database'

// Mock dependencies
jest.mock('@/lib/config', () => ({
  configManager: {
    getConfig: jest.fn(),
  },
}))

jest.mock('@/lib/database', () => ({
  databaseManager: {
    initialize: jest.fn(),
    searchStudents: jest.fn(),
  },
}))

// Mock fetch for external API calls
global.fetch = jest.fn()

const mockConfig = {
  database: {
    neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
    qdrant: { url: 'http://localhost:6333', apiKey: 'test-key', collectionName: 'student_notes' }
  },
  api: {
    transcription: { provider: 'openai', apiKey: 'test-key', model: 'whisper-1' },
    llm: { provider: 'google', apiKey: 'test-gemini-key', model: 'gemini-1.5-flash' },
    embeddings: { provider: 'openai', apiKey: 'test-key', model: 'text-embedding-3-small' }
  },
  isSetupComplete: true
}

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    ;(configManager.getConfig as jest.Mock).mockReturnValue(mockConfig)
    ;(databaseManager.initialize as jest.Mock).mockResolvedValue(undefined)
    ;(databaseManager.searchStudents as jest.Mock).mockResolvedValue([])
  })

  it('successfully processes chat message with Google Gemini', async () => {
    // Mock successful Gemini API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: 'I can help you with student information. What would you like to know?' }]
          }
        }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, can you help me with student information?',
        isAudio: false
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.response).toContain('help you with student information')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    )
  })

  it('handles missing message in request', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Message is required')
  })

  it('handles empty message in request', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Message is required')
  })

  it('handles missing configuration', async () => {
    ;(configManager.getConfig as jest.Mock).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, can you help me?'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Application not configured')
  })

  it('continues without database when database initialization fails', async () => {
    ;(databaseManager.initialize as jest.Mock).mockRejectedValue(new Error('Database connection failed'))
    
    // Mock successful Gemini API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: 'I can help you, but database is not available.' }]
          }
        }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, can you help me?'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.response).toContain('help you')
  })

  it('handles OpenAI provider configuration', async () => {
    const openAIConfig = {
      ...mockConfig,
      api: {
        ...mockConfig.api,
        llm: { provider: 'openai', apiKey: 'test-openai-key', model: 'gpt-4' }
      }
    }
    ;(configManager.getConfig as jest.Mock).mockReturnValue(openAIConfig)

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, can you help me?'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.response).toContain('OpenAI integration is available but not implemented')
  })

  it('handles unsupported LLM provider', async () => {
    const unsupportedConfig = {
      ...mockConfig,
      api: {
        ...mockConfig.api,
        llm: { provider: 'unsupported', apiKey: 'test-key', model: 'test-model' }
      }
    }
    ;(configManager.getConfig as jest.Mock).mockReturnValue(unsupportedConfig)

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, can you help me?'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.response).toContain('configured LLM provider is not yet supported')
  })

  it('handles Gemini API error', async () => {
    // Mock failed Gemini API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, can you help me?'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to process message')
  })

  it('includes student context when database is available', async () => {
    ;(databaseManager.searchStudents as jest.Mock).mockResolvedValue([
      { name: 'John Doe', class: 'Grade 10A', student_id: 1 }
    ])

    // Mock successful Gemini API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{ text: 'Based on the student data, John Doe is in Grade 10A.' }]
          }
        }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Tell me about John Doe'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(databaseManager.searchStudents).toHaveBeenCalledWith('John Doe')
  })

  it('handles invalid JSON in request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await chatPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to process message')
  })
})
