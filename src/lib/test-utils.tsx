/**
 * Test utilities and helpers for the Student Tracking App
 * This file provides mock data, helper functions, and custom render methods for testing
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AppConfig } from '@/types/config'

// Mock configuration for testing
export const mockConfig: AppConfig = {
  database: {
    neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
    qdrant: { url: 'http://localhost:6333', apiKey: 'test-key', collectionName: 'student_notes' }
  },
  api: {
    transcription: { provider: 'openai', apiKey: 'test-key', model: 'whisper-1' },
    llm: { provider: 'google', apiKey: 'test-key', model: 'gemini-1.5-flash' },
    embeddings: { provider: 'openai', apiKey: 'test-key', model: 'text-embedding-3-small' }
  },
  isSetupComplete: true
}

// Mock incomplete configuration for testing setup flows
export const mockIncompleteConfig: AppConfig = {
  database: {
    neon: { connectionString: '' },
    qdrant: { url: '', apiKey: '', collectionName: 'student_notes' }
  },
  api: {
    transcription: { provider: 'openai', apiKey: '', model: 'whisper-1' },
    llm: { provider: 'google', apiKey: '', model: 'gemini-1.5-flash' },
    embeddings: { provider: 'openai', apiKey: '', model: 'text-embedding-3-small' }
  },
  isSetupComplete: false
}

// Mock student data for testing
export const mockStudents = [
  {
    student_id: 1,
    name: 'Alice Johnson',
    class: 'Grade 10A',
    contact_info: {
      phone: '+1-555-0101',
      email: 'alice.johnson@email.com',
      parent_name: 'Robert Johnson',
      address: '123 Oak Street, Springfield'
    }
  },
  {
    student_id: 2,
    name: 'Bob Smith',
    class: 'Grade 10A',
    contact_info: {
      phone: '+1-555-0102',
      email: 'bob.smith@email.com',
      parent_name: 'Mary Smith',
      address: '456 Pine Avenue, Springfield'
    }
  }
]

// Test wrapper component for providers
interface TestWrapperProps {
  children: React.ReactNode
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return <div data-testid="test-wrapper">{children}</div>
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options })

// Helper function to create mock API responses
export const createMockResponse = (data: any, status = 200, ok = true) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

// Helper function to create mock fetch implementation
export const createMockFetch = (responses: any[]) => {
  let callCount = 0
  return jest.fn(() => {
    const response = responses[callCount] || responses[responses.length - 1]
    callCount++
    return Promise.resolve(response)
  })
}

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper function to create mock file for testing file uploads
export const createMockFile = (name: string, content: string, type = 'text/plain') => {
  const file = new File([content], name, { type })
  return file
}

// Helper function to create mock audio blob for testing audio recording
export const createMockAudioBlob = () => {
  const audioData = new Uint8Array([1, 2, 3, 4, 5])
  return new Blob([audioData], { type: 'audio/wav' })
}

// Helper function to mock localStorage
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  }
}

// Helper function to create mock database client
export const createMockDatabaseClient = () => ({
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
})

// Helper function to create mock Qdrant client
export const createMockQdrantClient = () => ({
  getCollections: jest.fn(),
  createCollection: jest.fn(),
  getCollection: jest.fn(),
  upsert: jest.fn(),
  search: jest.fn(),
})

// Helper function to create mock OpenAI client
export const createMockOpenAIClient = () => ({
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
})

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom render
export { customRender as render }
