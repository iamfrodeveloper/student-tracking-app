/**
 * Environment Configuration Manager
 * 
 * This module handles configuration from multiple sources:
 * 1. Environment variables (for production deployments)
 * 2. Setup wizard configuration (for user-friendly setup)
 * 3. Default fallback values
 * 
 * Priority order: Environment Variables > Setup Wizard > Defaults
 */

import { AppConfig } from '@/types/config';
import { validateEnvironmentVariables } from './security';

/**
 * Environment variable configuration
 * These are loaded from .env.local or system environment variables
 */
export const envConfig = {
  database: {
    neon: {
      connectionString: process.env.NEON_DATABASE_URL || '',
    },
    qdrant: {
      url: process.env.QDRANT_URL || '',
      apiKey: process.env.QDRANT_API_KEY || '',
      collectionName: process.env.QDRANT_COLLECTION_NAME || 'student_notes',
    },
  },
  api: {
    transcription: {
      provider: (process.env.CUSTOM_TRANSCRIPTION_ENDPOINT ? 'custom' : 'openai') as 'custom' | 'openai' | 'google' | 'azure',
      customEndpoint: process.env.CUSTOM_TRANSCRIPTION_ENDPOINT || '',
      apiKey: process.env.CUSTOM_TRANSCRIPTION_API_KEY || process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_WHISPER_MODEL || 'whisper-1',
    },
    llm: {
      provider: (process.env.GOOGLE_GEMINI_API_KEY ? 'google' :
                process.env.OPENAI_API_KEY ? 'openai' :
                process.env.CUSTOM_LLM_ENDPOINT ? 'custom' : 'google') as 'custom' | 'openai' | 'google' | 'anthropic',
      apiKey: process.env.GOOGLE_GEMINI_API_KEY ||
              process.env.OPENAI_API_KEY ||
              process.env.CUSTOM_LLM_API_KEY || '',
      model: process.env.GOOGLE_GEMINI_MODEL ||
             process.env.OPENAI_MODEL ||
             process.env.CUSTOM_LLM_MODEL || 'gemini-1.5-flash',
      customEndpoint: process.env.CUSTOM_LLM_ENDPOINT || '',
    },
    embeddings: {
      provider: (process.env.CUSTOM_EMBEDDINGS_ENDPOINT ? 'custom' : 'openai') as 'custom' | 'openai' | 'sentence-transformers',
      customEndpoint: process.env.CUSTOM_EMBEDDINGS_ENDPOINT || '',
      apiKey: process.env.CUSTOM_EMBEDDINGS_API_KEY || process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small',
    },
  },
  isSetupComplete: false, // This will be determined by validation
};

/**
 * Production environment configuration
 * Additional settings for production deployment
 */
export const productionConfig = {
  // Security settings
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
    enableCSRF: process.env.ENABLE_CSRF !== 'false',
    enableHTTPS: process.env.NODE_ENV === 'production',
  },

  // Monitoring and logging
  monitoring: {
    logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
    sentryDSN: process.env.SENTRY_DSN || '',
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
  },

  // Feature flags
  features: {
    enableAudioRecording: process.env.ENABLE_AUDIO_RECORDING !== 'false',
    enableSampleData: process.env.ENABLE_SAMPLE_DATA === 'true',
    enableDebugMode: process.env.ENABLE_DEBUG_MODE === 'true' && process.env.NODE_ENV !== 'production',
    enableMaintenanceMode: process.env.ENABLE_MAINTENANCE_MODE === 'true',
  },

  // Performance settings
  performance: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '1048576'), // 1MB
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableCaching: process.env.ENABLE_CACHING !== 'false',
  },

  // Database settings
  database: {
    connectionPoolSize: parseInt(process.env.DB_POOL_SIZE || '10'),
    connectionTimeout: parseInt(process.env.DB_TIMEOUT || '30000'), // 30 seconds
    enableSSL: process.env.DB_ENABLE_SSL !== 'false',
    enableReadReplicas: process.env.DB_ENABLE_READ_REPLICAS === 'true',
  },

  // API settings
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000'), // 30 seconds
    retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3'),
    enableCircuitBreaker: process.env.ENABLE_CIRCUIT_BREAKER === 'true',
  }
};

/**
 * Validates if environment configuration is complete
 */
export function validateEnvConfig(): boolean {
  const hasDatabase = !!(envConfig.database.neon.connectionString &&
                         envConfig.database.qdrant.url &&
                         envConfig.database.qdrant.apiKey);

  const hasLLM = !!(envConfig.api.llm.apiKey);

  return hasDatabase && hasLLM;
}

/**
 * Comprehensive environment validation for production
 */
export function validateProductionEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check required environment variables
  const envValidation = validateEnvironmentVariables();
  if (!envValidation.isValid) {
    errors.push(...envValidation.missing.map(key => `Missing required environment variable: ${key}`));
  }

  // Security validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      errors.push('NEXTAUTH_SECRET must be at least 32 characters long in production');
    }

    if (!process.env.NEXTAUTH_URL) {
      errors.push('NEXTAUTH_URL is required in production');
    }

    if (!productionConfig.security.allowedOrigins.length) {
      warnings.push('No ALLOWED_ORIGINS specified - this may cause CORS issues');
    }

    if (productionConfig.features.enableDebugMode) {
      warnings.push('Debug mode is enabled in production - consider disabling for security');
    }

    if (!productionConfig.database.enableSSL) {
      warnings.push('Database SSL is disabled - consider enabling for security');
    }
  }

  // Performance validations
  if (productionConfig.performance.maxFileSize > 50 * 1024 * 1024) { // 50MB
    warnings.push('Max file size is very large - consider reducing for better performance');
  }

  if (productionConfig.security.rateLimitMaxRequests > 1000) {
    warnings.push('Rate limit is very high - consider reducing for better security');
  }

  // Database validations
  if (envConfig.database.neon.connectionString) {
    if (!envConfig.database.neon.connectionString.includes('sslmode=require')) {
      recommendations.push('Consider adding sslmode=require to database connection string');
    }
  }

  // API key validations
  if (envConfig.api.llm.provider === 'openai' && envConfig.api.llm.apiKey) {
    if (!envConfig.api.llm.apiKey.startsWith('sk-')) {
      warnings.push('OpenAI API key format appears incorrect');
    }
  }

  if (envConfig.api.llm.provider === 'google' && envConfig.api.llm.apiKey) {
    if (!envConfig.api.llm.apiKey.startsWith('AIzaSy')) {
      warnings.push('Google Gemini API key format appears incorrect');
    }
  }

  // Monitoring recommendations
  if (!productionConfig.monitoring.sentryDSN && process.env.NODE_ENV === 'production') {
    recommendations.push('Consider setting up error monitoring with Sentry');
  }

  if (!productionConfig.monitoring.enableAnalytics) {
    recommendations.push('Consider enabling analytics for better insights');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

/**
 * Gets configuration with environment variables taking priority
 * Falls back to setup wizard configuration if env vars are not set
 */
export function getEffectiveConfig(setupWizardConfig?: AppConfig): AppConfig {
  // If environment variables provide a complete configuration, use them
  if (validateEnvConfig()) {
    return {
      ...envConfig,
      isSetupComplete: true,
    };
  }
  
  // Otherwise, use setup wizard configuration if available
  if (setupWizardConfig && setupWizardConfig.isSetupComplete) {
    return setupWizardConfig;
  }
  
  // Return default empty configuration
  return {
    database: {
      neon: { connectionString: '' },
      qdrant: { url: '', apiKey: '', collectionName: 'student_notes' },
    },
    api: {
      transcription: { provider: 'openai', customEndpoint: '', apiKey: '', model: 'whisper-1' },
      llm: { provider: 'google', apiKey: '', model: 'gemini-1.5-flash', customEndpoint: '' },
      embeddings: { provider: 'openai', customEndpoint: '', apiKey: '', model: 'text-embedding-3-small' },
    },
    isSetupComplete: false,
  };
}

/**
 * Security validation for configuration
 */
export function validateConfigSecurity(config: AppConfig): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check for placeholder values that indicate incomplete setup
  const placeholderPatterns = [
    'your_',
    'example.com',
    'placeholder',
    'change_me',
    'insert_here',
  ];
  
  const checkForPlaceholders = (value: string, fieldName: string) => {
    if (placeholderPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
      errors.push(`${fieldName} appears to contain placeholder values. Please use real credentials.`);
    }
  };
  
  // Validate database configuration
  if (config.database.neon.connectionString) {
    if (!config.database.neon.connectionString.startsWith('postgresql://')) {
      errors.push('Neon database connection string must start with "postgresql://"');
    }
    checkForPlaceholders(config.database.neon.connectionString, 'Database connection string');
  }
  
  if (config.database.qdrant.url) {
    if (!config.database.qdrant.url.startsWith('https://')) {
      warnings.push('Qdrant URL should use HTTPS for security');
    }
    checkForPlaceholders(config.database.qdrant.url, 'Qdrant URL');
  }
  
  if (config.database.qdrant.apiKey) {
    checkForPlaceholders(config.database.qdrant.apiKey, 'Qdrant API key');
  }
  
  // Validate API configuration
  if (config.api.llm.apiKey) {
    checkForPlaceholders(config.api.llm.apiKey, 'LLM API key');
    
    // Check API key format for known providers
    if (config.api.llm.provider === 'google' && !config.api.llm.apiKey.startsWith('AIzaSy')) {
      warnings.push('Google Gemini API keys typically start with "AIzaSy"');
    }
    if (config.api.llm.provider === 'openai' && !config.api.llm.apiKey.startsWith('sk-')) {
      warnings.push('OpenAI API keys typically start with "sk-"');
    }
  }
  
  // Check for weak or default values
  if (config.database.qdrant.collectionName === 'default' || 
      config.database.qdrant.collectionName === 'test') {
    warnings.push('Consider using a more specific collection name for production');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Sanitizes configuration for logging (removes sensitive information)
 */
export function sanitizeConfigForLogging(config: AppConfig): any {
  return {
    database: {
      neon: {
        connectionString: config.database.neon.connectionString ? '[REDACTED]' : '[NOT SET]',
      },
      qdrant: {
        url: config.database.qdrant.url ? '[REDACTED]' : '[NOT SET]',
        apiKey: config.database.qdrant.apiKey ? '[REDACTED]' : '[NOT SET]',
        collectionName: config.database.qdrant.collectionName,
      },
    },
    api: {
      transcription: {
        provider: config.api.transcription.provider,
        customEndpoint: config.api.transcription.customEndpoint ? '[REDACTED]' : '[NOT SET]',
        apiKey: config.api.transcription.apiKey ? '[REDACTED]' : '[NOT SET]',
        model: config.api.transcription.model,
      },
      llm: {
        provider: config.api.llm.provider,
        apiKey: config.api.llm.apiKey ? '[REDACTED]' : '[NOT SET]',
        model: config.api.llm.model,
        customEndpoint: config.api.llm.customEndpoint ? '[REDACTED]' : '[NOT SET]',
      },
      embeddings: {
        provider: config.api.embeddings.provider,
        customEndpoint: config.api.embeddings.customEndpoint ? '[REDACTED]' : '[NOT SET]',
        apiKey: config.api.embeddings.apiKey ? '[REDACTED]' : '[NOT SET]',
        model: config.api.embeddings.model,
      },
    },
    isSetupComplete: config.isSetupComplete,
  };
}
