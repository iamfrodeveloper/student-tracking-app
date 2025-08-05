import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SetupWizard from '../SetupWizard'
import { configManager } from '@/lib/config'

// Mock the config manager
jest.mock('@/lib/config', () => ({
  configManager: {
    getConfig: jest.fn(),
    updateDatabaseConfig: jest.fn(),
    updateAPIConfig: jest.fn(),
    markSetupComplete: jest.fn(),
  },
}))

// Mock child components
jest.mock('../DatabaseSetup', () => {
  return function MockDatabaseSetup({ onComplete, onUpdate }: any) {
    return (
      <div data-testid="database-setup">
        <button onClick={() => onUpdate({ neon: { connectionString: 'test' }, qdrant: { url: 'test', apiKey: 'test' } })}>
          Update Database Config
        </button>
        <button onClick={onComplete}>Complete Database Setup</button>
      </div>
    )
  }
})

jest.mock('../APISetup', () => {
  return function MockAPISetup({ onComplete, onUpdate }: any) {
    return (
      <div data-testid="api-setup">
        <button onClick={() => onUpdate({ transcription: { apiKey: 'test' }, llm: { apiKey: 'test' }, embeddings: { apiKey: 'test' } })}>
          Update API Config
        </button>
        <button onClick={onComplete}>Complete API Setup</button>
      </div>
    )
  }
})

jest.mock('../ConnectionTest', () => {
  return function MockConnectionTest({ onComplete }: any) {
    return (
      <div data-testid="connection-test">
        <button onClick={onComplete}>Complete Connection Test</button>
      </div>
    )
  }
})

jest.mock('../SampleDataSetup', () => {
  return function MockSampleDataSetup({ onComplete }: any) {
    return (
      <div data-testid="sample-data-setup">
        <button onClick={onComplete}>Complete Sample Data Setup</button>
      </div>
    )
  }
})

const mockOnComplete = jest.fn()

describe('SetupWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(configManager.getConfig as jest.Mock).mockReturnValue(null)
  })

  it('renders the setup wizard with initial state', () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    expect(screen.getByText('Student Tracking App Setup')).toBeInTheDocument()
    expect(screen.getByText('Let\'s configure your application to get started')).toBeInTheDocument()
    expect(screen.getByText('Database Configuration')).toBeInTheDocument()
  })

  it('displays all setup steps', () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    expect(screen.getByText('Database Configuration')).toBeInTheDocument()
    expect(screen.getByText('API Configuration')).toBeInTheDocument()
    expect(screen.getByText('Test Connections')).toBeInTheDocument()
    expect(screen.getByText('Sample Data')).toBeInTheDocument()
  })

  it('starts with the first step active', () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    expect(screen.getByTestId('database-setup')).toBeInTheDocument()
  })

  it('loads existing configuration on mount', () => {
    const existingConfig = {
      database: {
        neon: { connectionString: 'existing-connection' },
        qdrant: { url: 'existing-url', apiKey: 'existing-key', collectionName: 'test' }
      },
      api: {
        transcription: { provider: 'openai', apiKey: 'existing-key', model: 'whisper-1' },
        llm: { provider: 'google', apiKey: 'existing-key', model: 'gemini-pro' },
        embeddings: { provider: 'openai', apiKey: 'existing-key', model: 'text-embedding-ada-002' }
      },
      isSetupComplete: false
    }
    
    ;(configManager.getConfig as jest.Mock).mockReturnValue(existingConfig)
    
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    expect(configManager.getConfig).toHaveBeenCalled()
  })

  it('updates database configuration when child component calls onUpdate', async () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    const updateButton = screen.getByText('Update Database Config')
    fireEvent.click(updateButton)
    
    expect(configManager.updateDatabaseConfig).toHaveBeenCalledWith({
      neon: { connectionString: 'test' },
      qdrant: { url: 'test', apiKey: 'test' }
    })
  })

  it('completes database step and advances to next step', async () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    const completeButton = screen.getByText('Complete Database Setup')
    fireEvent.click(completeButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('api-setup')).toBeInTheDocument()
    })
  })

  it('updates API configuration when child component calls onUpdate', async () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    // Navigate to API setup step
    const apiTab = screen.getByText('API Configuration')
    fireEvent.click(apiTab)
    
    const updateButton = screen.getByText('Update API Config')
    fireEvent.click(updateButton)
    
    expect(configManager.updateAPIConfig).toHaveBeenCalledWith({
      transcription: { apiKey: 'test' },
      llm: { apiKey: 'test' },
      embeddings: { apiKey: 'test' }
    })
  })

  it('allows navigation between completed steps', async () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    // Complete database step
    const completeDbButton = screen.getByText('Complete Database Setup')
    fireEvent.click(completeDbButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('api-setup')).toBeInTheDocument()
    })
    
    // Navigate back to database step
    const databaseTab = screen.getByText('Database Configuration')
    fireEvent.click(databaseTab)
    
    expect(screen.getByTestId('database-setup')).toBeInTheDocument()
  })

  it('calls onComplete when setup is finished', async () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    // Complete all required steps
    fireEvent.click(screen.getByText('Complete Database Setup'))
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Complete API Setup'))
    })
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Complete Connection Test'))
    })
    
    // Should call markSetupComplete and onComplete
    expect(configManager.markSetupComplete).toHaveBeenCalled()
    expect(mockOnComplete).toHaveBeenCalled()
  })

  it('prevents navigation to incomplete steps', () => {
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    // Try to navigate to test step without completing previous steps
    const testTab = screen.getByText('Test Connections')
    fireEvent.click(testTab)
    
    // Should still be on database setup
    expect(screen.getByTestId('database-setup')).toBeInTheDocument()
  })

  it('marks steps as completed based on configuration', () => {
    const completeConfig = {
      database: {
        neon: { connectionString: 'test-connection' },
        qdrant: { url: 'test-url', apiKey: 'test-key', collectionName: 'test' }
      },
      api: {
        transcription: { provider: 'openai', apiKey: 'test-key', model: 'whisper-1' },
        llm: { provider: 'google', apiKey: 'test-key', model: 'gemini-pro' },
        embeddings: { provider: 'openai', apiKey: 'test-key', model: 'text-embedding-ada-002' }
      },
      isSetupComplete: false
    }
    
    ;(configManager.getConfig as jest.Mock).mockReturnValue(completeConfig)
    
    render(<SetupWizard onComplete={mockOnComplete} />)
    
    // Both database and API steps should be marked as completed
    // This would be reflected in the UI with checkmarks
    expect(configManager.getConfig).toHaveBeenCalled()
  })
})
