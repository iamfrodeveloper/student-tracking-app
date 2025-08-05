import { NextRequest } from 'next/server'
import { POST as testAPIPOST } from '../test/api/route'

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn(),
      },
    },
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }))
})

// Mock fetch for external API calls
global.fetch = jest.fn()

describe('/api/test/api', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('successfully tests all API connections', async () => {
    // Mock successful OpenAI responses
    const mockOpenAI = require('openai')
    const mockOpenAIInstance = new mockOpenAI()
    
    mockOpenAIInstance.audio.transcriptions.create.mockResolvedValue({
      text: 'Test transcription'
    })
    
    mockOpenAIInstance.embeddings.create.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }]
    })
    
    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: 'Test response' } }]
    })

    // Mock Google Gemini API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{ content: { parts: [{ text: 'Test Gemini response' }] } }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: JSON.stringify({
        transcription: {
          provider: 'openai',
          apiKey: 'test-openai-key',
          model: 'whisper-1'
        },
        llm: {
          provider: 'google',
          apiKey: 'test-gemini-key',
          model: 'gemini-pro'
        },
        embeddings: {
          provider: 'openai',
          apiKey: 'test-openai-key',
          model: 'text-embedding-ada-002'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.results.transcription.success).toBe(true)
    expect(data.results.llm.success).toBe(true)
    expect(data.results.embeddings.success).toBe(true)
  })

  it('handles OpenAI transcription API failure', async () => {
    const mockOpenAI = require('openai')
    const mockOpenAIInstance = new mockOpenAI()
    
    mockOpenAIInstance.audio.transcriptions.create.mockRejectedValue(
      new Error('Invalid API key')
    )

    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: JSON.stringify({
        transcription: {
          provider: 'openai',
          apiKey: 'invalid-key',
          model: 'whisper-1'
        },
        llm: {
          provider: 'google',
          apiKey: 'test-gemini-key',
          model: 'gemini-pro'
        },
        embeddings: {
          provider: 'openai',
          apiKey: 'test-openai-key',
          model: 'text-embedding-ada-002'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(data.results.transcription.success).toBe(false)
    expect(data.results.transcription.message).toContain('Invalid API key')
  })

  it('handles Google Gemini API failure', async () => {
    // Mock failed Gemini API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({
        error: { message: 'Invalid API key' }
      })
    })

    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: JSON.stringify({
        transcription: {
          provider: 'openai',
          apiKey: 'test-openai-key',
          model: 'whisper-1'
        },
        llm: {
          provider: 'google',
          apiKey: 'invalid-gemini-key',
          model: 'gemini-pro'
        },
        embeddings: {
          provider: 'openai',
          apiKey: 'test-openai-key',
          model: 'text-embedding-ada-002'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(data.results.llm.success).toBe(false)
    expect(data.results.llm.message).toContain('failed')
  })

  it('handles custom endpoint configuration', async () => {
    // Mock successful custom endpoint response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        text: 'Custom transcription result'
      })
    })

    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: JSON.stringify({
        transcription: {
          provider: 'custom',
          apiKey: 'custom-key',
          customEndpoint: 'https://custom-transcription.example.com/api',
          model: 'custom-model'
        },
        llm: {
          provider: 'custom',
          apiKey: 'custom-key',
          customEndpoint: 'https://custom-llm.example.com/api',
          model: 'custom-model'
        },
        embeddings: {
          provider: 'custom',
          apiKey: 'custom-key',
          customEndpoint: 'https://custom-embeddings.example.com/api',
          model: 'custom-model'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(global.fetch).toHaveBeenCalledWith(
      'https://custom-transcription.example.com/api',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer custom-key'
        })
      })
    )
  })

  it('handles missing API keys', async () => {
    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: JSON.stringify({
        transcription: {
          provider: 'openai',
          apiKey: '',
          model: 'whisper-1'
        },
        llm: {
          provider: 'google',
          apiKey: '',
          model: 'gemini-pro'
        },
        embeddings: {
          provider: 'openai',
          apiKey: '',
          model: 'text-embedding-ada-002'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(data.results.transcription.success).toBe(false)
    expect(data.results.llm.success).toBe(false)
    expect(data.results.embeddings.success).toBe(false)
  })

  it('handles invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Failed to test API connections')
  })

  it('tests embeddings with different providers', async () => {
    const mockOpenAI = require('openai')
    const mockOpenAIInstance = new mockOpenAI()
    
    mockOpenAIInstance.embeddings.create.mockResolvedValue({
      data: [{ embedding: new Array(1536).fill(0.1) }]
    })

    const request = new NextRequest('http://localhost:3000/api/test/api', {
      method: 'POST',
      body: JSON.stringify({
        transcription: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'whisper-1'
        },
        llm: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'gpt-3.5-turbo'
        },
        embeddings: {
          provider: 'openai',
          apiKey: 'test-key',
          model: 'text-embedding-3-small'
        }
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await testAPIPOST(request)
    const data = await response.json()

    expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'This is a test embedding request to verify the API connection.'
    })
  })
})
