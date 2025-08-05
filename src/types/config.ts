// Configuration types for the Student Tracking App

export interface DatabaseConfig {
  neon: {
    connectionString: string;
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
  };
  qdrant: {
    url: string;
    apiKey: string;
    collectionName?: string;
  };
}

export interface APIConfig {
  transcription: {
    provider: 'openai' | 'google' | 'azure' | 'custom';
    apiKey: string;
    customEndpoint?: string;
    model?: string;
  };
  llm: {
    provider: 'openai' | 'anthropic' | 'google' | 'custom';
    apiKey: string;
    customEndpoint?: string;
    model?: string;
  };
  embeddings: {
    provider: 'openai' | 'sentence-transformers' | 'custom';
    apiKey: string;
    customEndpoint?: string;
    model?: string;
  };
}

export interface AppConfig {
  database: DatabaseConfig;
  api: APIConfig;
  isSetupComplete: boolean;
  userId?: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

// Default configurations
export const DEFAULT_API_CONFIG: APIConfig = {
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
};

export const API_PROVIDERS = {
  transcription: [
    { value: 'openai', label: 'OpenAI Whisper' },
    { value: 'google', label: 'Google Speech-to-Text' },
    { value: 'azure', label: 'Azure Speech Services' },
    { value: 'custom', label: 'Custom API' }
  ],
  llm: [
    { value: 'openai', label: 'OpenAI GPT' },
    { value: 'anthropic', label: 'Anthropic Claude' },
    { value: 'google', label: 'Google Gemini' },
    { value: 'custom', label: 'Custom API' }
  ],
  embeddings: [
    { value: 'openai', label: 'OpenAI Embeddings' },
    { value: 'sentence-transformers', label: 'Sentence Transformers' },
    { value: 'custom', label: 'Custom API' }
  ]
};

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'database',
    title: 'Database Configuration',
    description: 'Configure Neon PostgreSQL and Qdrant vector database connections',
    completed: false,
    required: true
  },
  {
    id: 'api',
    title: 'API Configuration',
    description: 'Set up transcription, LLM, and embedding service providers',
    completed: false,
    required: true
  },
  {
    id: 'test',
    title: 'Test Connections',
    description: 'Verify all database and API connections are working',
    completed: false,
    required: true
  },
  {
    id: 'sample-data',
    title: 'Sample Data',
    description: 'Load sample student data for testing (optional)',
    completed: false,
    required: false
  }
];
