// Configuration management utilities

import { AppConfig, DatabaseConfig, APIConfig, DEFAULT_API_CONFIG, ConnectionTestResult } from '@/types/config';
import { getEffectiveConfig, validateConfigSecurity, sanitizeConfigForLogging } from './env-config';

const CONFIG_STORAGE_KEY = 'student-tracking-config';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Load configuration from localStorage
  loadConfig(): AppConfig | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
        return this.config;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    return null;
  }

  // Save configuration to localStorage
  saveConfig(config: AppConfig): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      this.config = config;
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Get current configuration (with environment variable support)
  getConfig(): AppConfig | null {
    // Get setup wizard config from localStorage
    const setupWizardConfig = this.loadConfig();

    // Get effective configuration (env vars take priority)
    this.config = getEffectiveConfig(setupWizardConfig || undefined);

    // Validate configuration security
    const validation = validateConfigSecurity(this.config);
    if (!validation.isValid) {
      console.warn('Configuration security validation failed:', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('Configuration security warnings:', validation.warnings);
    }

    return this.config;
  }

  // Update database configuration
  updateDatabaseConfig(databaseConfig: DatabaseConfig): void {
    const currentConfig = this.getConfig() || this.createDefaultConfig();
    currentConfig.database = databaseConfig;
    this.saveConfig(currentConfig);
  }

  // Update API configuration
  updateAPIConfig(apiConfig: APIConfig): void {
    const currentConfig = this.getConfig() || this.createDefaultConfig();
    currentConfig.api = apiConfig;
    this.saveConfig(currentConfig);
  }

  // Mark setup as complete
  markSetupComplete(): void {
    const currentConfig = this.getConfig() || this.createDefaultConfig();
    currentConfig.isSetupComplete = true;
    this.saveConfig(currentConfig);
  }

  // Check if setup is complete
  isSetupComplete(): boolean {
    const config = this.getConfig();
    return config?.isSetupComplete || false;
  }

  // Get sanitized configuration for logging (removes sensitive information)
  getSanitizedConfig(): any {
    const config = this.getConfig();
    return config ? sanitizeConfigForLogging(config) : null;
  }

  // Create default configuration
  private createDefaultConfig(): AppConfig {
    return {
      database: {
        neon: {
          connectionString: '',
        },
        qdrant: {
          url: '',
          apiKey: '',
          collectionName: 'student_notes'
        }
      },
      api: DEFAULT_API_CONFIG,
      isSetupComplete: false
    };
  }

  // Clear configuration
  clearConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
    }
    this.config = null;
  }

  // Validate configuration
  validateConfig(config: AppConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate database config
    if (!config.database.neon.connectionString) {
      errors.push('Neon connection string is required');
    }
    if (!config.database.qdrant.url) {
      errors.push('Qdrant URL is required');
    }
    if (!config.database.qdrant.apiKey) {
      errors.push('Qdrant API key is required');
    }

    // Validate API config
    if (!config.api.transcription.apiKey && config.api.transcription.provider !== 'custom') {
      errors.push('Transcription API key is required');
    }
    if (!config.api.llm.apiKey && config.api.llm.provider !== 'custom') {
      errors.push('LLM API key is required');
    }
    if (!config.api.embeddings.apiKey && config.api.embeddings.provider !== 'custom') {
      errors.push('Embeddings API key is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Utility functions for connection testing
export async function testDatabaseConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
  try {
    const response = await fetch('/api/test/database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test database connection',
      details: error
    };
  }
}

export async function testAPIConnection(apiConfig: APIConfig): Promise<ConnectionTestResult> {
  try {
    const response = await fetch('/api/test/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiConfig),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to test API connection',
      details: error
    };
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
