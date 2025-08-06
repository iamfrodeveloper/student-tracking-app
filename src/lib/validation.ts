// Enhanced validation functions for real-time credential validation

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Validates Neon PostgreSQL connection string
 */
export async function validateNeonConnection(connectionString: string): Promise<ValidationResult> {
  try {
    // Basic format validation
    if (!connectionString.trim()) {
      return {
        success: false,
        message: 'Connection string is required'
      };
    }

    // Check if it's a valid PostgreSQL connection string format
    const postgresRegex = /^postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)(\?.*)?$/;
    
    if (!postgresRegex.test(connectionString)) {
      return {
        success: false,
        message: 'Invalid PostgreSQL connection string format. Expected: postgresql://username:password@host/database'
      };
    }

    // Parse connection string components
    const match = connectionString.match(postgresRegex);
    if (!match) {
      return {
        success: false,
        message: 'Unable to parse connection string components'
      };
    }

    const [, username, password, host, database] = match;

    // Validate components
    if (!username || username.length < 2) {
      return {
        success: false,
        message: 'Username must be at least 2 characters long'
      };
    }

    if (!password || password.length < 8) {
      return {
        success: false,
        message: 'Password must be at least 8 characters long'
      };
    }

    if (!host || !host.includes('.')) {
      return {
        success: false,
        message: 'Invalid host format'
      };
    }

    if (!database || database.length < 2) {
      return {
        success: false,
        message: 'Database name must be at least 2 characters long'
      };
    }

    // Check for Neon-specific patterns
    const isNeonHost = host.includes('neon.tech') || host.includes('.aws.neon.tech') || host.includes('.gcp.neon.tech');
    
    if (!isNeonHost) {
      return {
        success: false,
        message: 'This doesn\'t appear to be a Neon database host. Expected format: *.neon.tech'
      };
    }

    // Check for required SSL parameters for Neon
    const hasSSL = connectionString.includes('sslmode=require');
    if (!hasSSL) {
      return {
        success: false,
        message: 'Neon requires SSL connection. Add "?sslmode=require" to your connection string'
      };
    }

    return {
      success: true,
      message: `✓ Valid Neon connection string for database "${database}" on host "${host}"`,
      details: {
        username,
        host,
        database,
        ssl: hasSSL
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates Qdrant Vector Database URL
 */
export async function validateQdrantUrl(url: string): Promise<ValidationResult> {
  try {
    if (!url.trim()) {
      return {
        success: false,
        message: 'Qdrant URL is required'
      };
    }

    // Basic URL format validation
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        success: false,
        message: 'Invalid URL format. Must start with https://'
      };
    }

    // Check protocol
    if (parsedUrl.protocol !== 'https:') {
      return {
        success: false,
        message: 'Qdrant URL must use HTTPS protocol for security'
      };
    }

    // Check for Qdrant Cloud patterns
    const isQdrantCloud = parsedUrl.hostname.includes('qdrant.io') || 
                         parsedUrl.hostname.includes('.gcp.cloud.qdrant.io') ||
                         parsedUrl.hostname.includes('.aws.cloud.qdrant.io') ||
                         parsedUrl.hostname.includes('.azure.cloud.qdrant.io');

    if (!isQdrantCloud) {
      return {
        success: false,
        message: 'This doesn\'t appear to be a Qdrant Cloud URL. Expected format: https://[cluster-id].[region].cloud.qdrant.io'
      };
    }

    // Extract cluster ID from hostname
    const hostnameParts = parsedUrl.hostname.split('.');
    const clusterId = hostnameParts[0];

    if (!clusterId || clusterId.length < 10) {
      return {
        success: false,
        message: 'Invalid cluster ID format in URL'
      };
    }

    // Validate cluster ID format (UUID-like)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clusterId)) {
      return {
        success: false,
        message: 'Cluster ID should be in UUID format (e.g., 12345678-1234-1234-1234-123456789abc)'
      };
    }

    return {
      success: true,
      message: `✓ Valid Qdrant Cloud URL with cluster ID "${clusterId}"`,
      details: {
        clusterId,
        hostname: parsedUrl.hostname,
        protocol: parsedUrl.protocol
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates Qdrant API Key
 */
export async function validateQdrantApiKey(apiKey: string): Promise<ValidationResult> {
  try {
    if (!apiKey.trim()) {
      return {
        success: false,
        message: 'Qdrant API key is required'
      };
    }

    // Check minimum length
    if (apiKey.length < 20) {
      return {
        success: false,
        message: 'API key appears too short. Qdrant API keys are typically longer'
      };
    }

    // Check for JWT format (Qdrant uses JWT tokens)
    const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
    
    if (!jwtRegex.test(apiKey)) {
      return {
        success: false,
        message: 'API key should be in JWT format (three parts separated by dots)'
      };
    }

    // Try to decode JWT header to validate structure
    try {
      const parts = apiKey.split('.');
      const header = JSON.parse(atob(parts[0]));
      
      if (!header.alg || !header.typ) {
        return {
          success: false,
          message: 'Invalid JWT header structure'
        };
      }

      if (header.typ !== 'JWT') {
        return {
          success: false,
          message: 'Token type should be JWT'
        };
      }

      return {
        success: true,
        message: `✓ Valid JWT API key with algorithm "${header.alg}"`,
        details: {
          algorithm: header.alg,
          type: header.typ,
          length: apiKey.length
        }
      };

    } catch {
      return {
        success: false,
        message: 'Unable to decode JWT header. Please check your API key format'
      };
    }

  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates Google Gemini API Key
 */
export async function validateGeminiApiKey(apiKey: string): Promise<ValidationResult> {
  try {
    if (!apiKey.trim()) {
      return {
        success: false,
        message: 'Google Gemini API key is required'
      };
    }

    // Check minimum length
    if (apiKey.length < 30) {
      return {
        success: false,
        message: 'API key appears too short. Google API keys are typically 39+ characters'
      };
    }

    // Check for Google API key format
    if (!apiKey.startsWith('AIza')) {
      return {
        success: false,
        message: 'Google API keys typically start with "AIza"'
      };
    }

    // Check character set (Google API keys use specific characters)
    const validChars = /^[A-Za-z0-9_-]+$/;
    if (!validChars.test(apiKey)) {
      return {
        success: false,
        message: 'API key contains invalid characters. Should only contain letters, numbers, underscores, and hyphens'
      };
    }

    // Check typical length range
    if (apiKey.length < 35 || apiKey.length > 45) {
      return {
        success: false,
        message: `API key length (${apiKey.length}) is outside typical range (35-45 characters)`
      };
    }

    return {
      success: true,
      message: `✓ Valid Google Gemini API key format (${apiKey.length} characters)`,
      details: {
        length: apiKey.length,
        prefix: apiKey.substring(0, 4),
        format: 'Google API Key'
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validates OpenAI API Key
 */
export async function validateOpenAIApiKey(apiKey: string): Promise<ValidationResult> {
  try {
    if (!apiKey.trim()) {
      return {
        success: false,
        message: 'OpenAI API key is required'
      };
    }

    // Check for OpenAI API key format
    if (!apiKey.startsWith('sk-')) {
      return {
        success: false,
        message: 'OpenAI API keys start with "sk-"'
      };
    }

    // Check minimum length
    if (apiKey.length < 40) {
      return {
        success: false,
        message: 'API key appears too short. OpenAI API keys are typically 51+ characters'
      };
    }

    // Check character set
    const validChars = /^sk-[A-Za-z0-9]+$/;
    if (!validChars.test(apiKey)) {
      return {
        success: false,
        message: 'API key contains invalid characters. Should be "sk-" followed by alphanumeric characters'
      };
    }

    return {
      success: true,
      message: `✓ Valid OpenAI API key format (${apiKey.length} characters)`,
      details: {
        length: apiKey.length,
        prefix: 'sk-',
        format: 'OpenAI API Key'
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
