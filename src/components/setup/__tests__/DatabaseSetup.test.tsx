import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DatabaseSetup from '../DatabaseSetup'
import { testDatabaseConnection } from '@/lib/config'

// Mock the config library
jest.mock('@/lib/config', () => ({
  testDatabaseConnection: jest.fn(),
}))

const mockConfig = {
  neon: { connectionString: '' },
  qdrant: { url: '', apiKey: '', collectionName: 'student_notes' }
}

const mockOnUpdate = jest.fn()
const mockOnComplete = jest.fn()

describe('DatabaseSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders database setup form', () => {
    render(
      <DatabaseSetup
        config={mockConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    expect(screen.getByText('Database Configuration')).toBeInTheDocument()
    expect(screen.getByText('Neon PostgreSQL Database')).toBeInTheDocument()
    expect(screen.getByText('Qdrant Vector Database')).toBeInTheDocument()
  })

  it('displays form fields for database configuration', () => {
    render(
      <DatabaseSetup
        config={mockConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    expect(screen.getByLabelText('Connection String')).toBeInTheDocument()
    expect(screen.getByLabelText('Qdrant URL')).toBeInTheDocument()
    expect(screen.getByLabelText('API Key')).toBeInTheDocument()
    expect(screen.getByLabelText('Collection Name (Optional)')).toBeInTheDocument()
  })

  it('updates configuration when form fields change', async () => {
    const user = userEvent.setup()
    
    render(
      <DatabaseSetup
        config={mockConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const connectionStringInput = screen.getByLabelText('Connection String')
    await user.type(connectionStringInput, 'postgresql://test:test@localhost:5432/test')
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
      qdrant: { url: '', apiKey: '', collectionName: 'student_notes' }
    })
  })

  it('updates Qdrant configuration when fields change', async () => {
    const user = userEvent.setup()
    
    render(
      <DatabaseSetup
        config={mockConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const qdrantUrlInput = screen.getByLabelText('Qdrant URL')
    await user.type(qdrantUrlInput, 'https://test.qdrant.tech')
    
    expect(mockOnUpdate).toHaveBeenCalledWith({
      neon: { connectionString: '' },
      qdrant: { url: 'https://test.qdrant.tech', apiKey: '', collectionName: 'student_notes' }
    })
  })

  it('validates form before testing connection', async () => {
    render(
      <DatabaseSetup
        config={mockConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )

    // Fill in some fields to enable the button
    const neonInput = screen.getByLabelText('Neon Connection String')
    const qdrantUrlInput = screen.getByLabelText('Qdrant URL')
    const qdrantKeyInput = screen.getByLabelText('API Key')

    fireEvent.change(neonInput, { target: { value: 'test' } })
    fireEvent.change(qdrantUrlInput, { target: { value: 'https://test.com' } })
    fireEvent.change(qdrantKeyInput, { target: { value: 'key' } })

    // Clear the neon field to trigger validation
    fireEvent.change(neonInput, { target: { value: '' } })

    const testButton = screen.getByText('Test Database Connections')

    // Button should be disabled when required field is empty
    expect(testButton).toBeDisabled()
  })

  it('tests database connection when form is valid', async () => {
    const validConfig = {
      neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
      qdrant: { url: 'https://test.qdrant.tech', apiKey: 'test-key', collectionName: 'student_notes' }
    }
    
    ;(testDatabaseConnection as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Connection successful'
    })
    
    render(
      <DatabaseSetup
        config={validConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const testButton = screen.getByText('Test Database Connections')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(testDatabaseConnection).toHaveBeenCalledWith(validConfig)
    })
  })

  it('shows loading state during connection test', async () => {
    const validConfig = {
      neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
      qdrant: { url: 'https://test.qdrant.tech', apiKey: 'test-key', collectionName: 'student_notes' }
    }
    
    ;(testDatabaseConnection as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )
    
    render(
      <DatabaseSetup
        config={validConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const testButton = screen.getByText('Test Database Connections')
    fireEvent.click(testButton)
    
    expect(screen.getByText('Testing Connections...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Test Database Connections')).toBeInTheDocument()
    })
  })

  it('calls onComplete when connection test succeeds', async () => {
    const validConfig = {
      neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
      qdrant: { url: 'https://test.qdrant.tech', apiKey: 'test-key', collectionName: 'student_notes' }
    }
    
    ;(testDatabaseConnection as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Connection successful'
    })
    
    render(
      <DatabaseSetup
        config={validConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const testButton = screen.getByText('Test Database Connections')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  it('shows error message when connection test fails', async () => {
    const validConfig = {
      neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
      qdrant: { url: 'https://test.qdrant.tech', apiKey: 'test-key', collectionName: 'student_notes' }
    }
    
    ;(testDatabaseConnection as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Connection failed: Invalid credentials'
    })
    
    render(
      <DatabaseSetup
        config={validConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const testButton = screen.getByText('Test Database Connections')
    fireEvent.click(testButton)
    
    await waitFor(() => {
      const errorMessages = screen.getAllByText('Connection failed: Invalid credentials')
      expect(errorMessages.length).toBeGreaterThan(0)
    })
    
    expect(mockOnComplete).not.toHaveBeenCalled()
  })

  it('parses and displays connection string details', () => {
    const configWithConnection = {
      neon: { connectionString: 'postgresql://testuser:testpass@test.neon.tech:5432/testdb?sslmode=require' },
      qdrant: { url: '', apiKey: '', collectionName: 'student_notes' }
    }
    
    render(
      <DatabaseSetup
        config={configWithConnection}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    expect(screen.getByText('test.neon.tech')).toBeInTheDocument()
    expect(screen.getByText('testdb')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('disables test button when required fields are empty', () => {
    render(
      <DatabaseSetup
        config={mockConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const testButton = screen.getByText('Test Database Connections')
    expect(testButton).toBeDisabled()
  })

  it('enables test button when all required fields are filled', () => {
    const validConfig = {
      neon: { connectionString: 'postgresql://test:test@localhost:5432/test' },
      qdrant: { url: 'https://test.qdrant.tech', apiKey: 'test-key', collectionName: 'student_notes' }
    }
    
    render(
      <DatabaseSetup
        config={validConfig}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
      />
    )
    
    const testButton = screen.getByText('Test Database Connections')
    expect(testButton).not.toBeDisabled()
  })
})
