import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConnectionTest from '../ConnectionTest'

// Mock fetch globally
global.fetch = jest.fn()

const mockConfig = {
  database: {
    neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
    qdrant: { url: 'https://test.qdrant.tech', apiKey: 'test-key', collectionName: 'student_notes' }
  },
  api: {
    transcription: { provider: 'openai', apiKey: 'test-key', model: 'whisper-1' },
    llm: { provider: 'google', apiKey: 'test-key', model: 'gemini-pro' },
    embeddings: { provider: 'openai', apiKey: 'test-key', model: 'text-embedding-ada-002' }
  },
  isSetupComplete: false
}

const mockOnComplete = jest.fn()

describe('ConnectionTest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders connection test interface', () => {
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    expect(screen.getByText('Connection Testing')).toBeInTheDocument()
    expect(screen.getByText('Verify all your configurations are working correctly')).toBeInTheDocument()
    expect(screen.getByText('Database Connections')).toBeInTheDocument()
    expect(screen.getByText('API Services')).toBeInTheDocument()
  })

  it('shows test button initially', () => {
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    expect(screen.getByText('Run All Tests')).toBeInTheDocument()
  })

  it('runs all tests when button is clicked', async () => {
    // Mock successful API responses
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Database connection successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Schema setup successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'API connections successful' })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })
  })

  it('shows loading state during tests', async () => {
    // Mock delayed response
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }), 100))
    )
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    expect(screen.getByText('Testing database connections...')).toBeInTheDocument()
  })

  it('displays test results for database connections', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Database connection successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Schema setup successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'API connections successful' })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(screen.getByText('Database connection successful')).toBeInTheDocument()
    })
  })

  it('displays test results for API connections', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Database connection successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Schema setup successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'API connections successful' })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(screen.getByText('API connections successful')).toBeInTheDocument()
    })
  })

  it('calls onComplete when all tests pass', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Database connection successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Schema setup successful' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'API connections successful' })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  it('does not call onComplete when tests fail', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Database connection failed' })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument()
    })
    
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Testing database connections...')).not.toBeInTheDocument()
    })
    
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('makes correct API calls for testing', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/test/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockConfig.database)
      })
      
      expect(global.fetch).toHaveBeenCalledWith('/api/test/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockConfig.database)
      })
      
      expect(global.fetch).toHaveBeenCalledWith('/api/test/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockConfig.api)
      })
    })
  })

  it('stops testing if database connection fails', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Database connection failed' })
      })
    
    render(<ConnectionTest config={mockConfig} onComplete={mockOnComplete} />)
    
    const testButton = screen.getByText('Run All Tests')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
    
    expect(mockOnComplete).not.toHaveBeenCalled()
  })
})
