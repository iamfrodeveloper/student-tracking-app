// Test Credentials Configuration
// This file loads credentials from the secure location outside the development folder
// DO NOT COMMIT ACTUAL CREDENTIALS TO VERSION CONTROL

const path = require('path');

// Try to load credentials from secure location
let PRODUCTION_CREDENTIALS = null;
try {
  const credentialsPath = path.join(__dirname, '..', 'important-credentials.js');
  const { getTestCredentials } = require(credentialsPath);
  PRODUCTION_CREDENTIALS = getTestCredentials();
  console.log('✅ Loaded credentials from secure location');
} catch (error) {
  console.warn('⚠️  Could not load production credentials, using placeholders');
  console.warn('   Make sure important-credentials.js exists in the root directory');
}

// Use production credentials if available, otherwise use placeholders
const TEST_CREDENTIALS = PRODUCTION_CREDENTIALS || {
  // =============================================================================
  // DATABASE CONFIGURATION (PLACEHOLDERS)
  // =============================================================================

  // Neon PostgreSQL Database Connection String
  neonConnectionString: "postgresql://username:password@host.neon.tech/database?sslmode=require",

  // Qdrant Vector Database Configuration
  qdrantUrl: "https://your-cluster.qdrant.io",
  qdrantApiKey: "your-qdrant-api-key-here",
  qdrantCollectionName: "student_tracking",

  // =============================================================================
  // AI API CONFIGURATION (PLACEHOLDERS)
  // =============================================================================

  // Google Gemini API Configuration
  googleGeminiApiKey: "your-google-gemini-api-key-here",
  googleGeminiModel: "gemini-1.5-flash",

  // OpenAI API Configuration
  openaiApiKey: "your-openai-api-key-here",
  openaiModel: "gpt-4",
  openaiWhisperModel: "whisper-1",

  // =============================================================================
  // APPLICATION CONFIGURATION
  // =============================================================================

  // Application URLs for testing
  appUrl: "http://localhost:3002", // Test locally for now
  mainUrl: "https://student-tracking-app.vercel.app",
  latestUrl: "https://student-tracking-7wt5alo1z-aditis-projects-430a9f30.vercel.app",
  localUrl: "http://localhost:3002",

  // Test configuration
  testTimeout: 30000, // 30 seconds
  screenshotQuality: 90,
  headless: false, // Set to true for headless testing
  
  // =============================================================================
  // INSTRUCTIONS FOR SETUP
  // =============================================================================
  
  // 1. Replace all placeholder values above with your actual credentials
  // 2. Make sure your credentials are valid and have proper permissions
  // 3. Test your credentials manually first if possible
  // 4. Run the test with: node test-app-functionality.js
  // 5. Check the test-screenshots folder for visual verification
  // 6. Review the test-report.json for detailed results
  
  // =============================================================================
  // SECURITY NOTES
  // =============================================================================
  
  // - NEVER commit this file with real credentials to version control
  // - Use environment variables for production testing
  // - Rotate your API keys regularly
  // - Monitor API usage for unusual activity
  // - Use different credentials for testing vs production
};

// Validation function to check if credentials are properly configured
function validateCredentials() {
  const errors = [];
  
  // Check database credentials
  if (TEST_CREDENTIALS.neonConnectionString.includes('username:password@host')) {
    errors.push('Neon connection string not configured');
  }
  
  if (TEST_CREDENTIALS.qdrantUrl.includes('your-cluster')) {
    errors.push('Qdrant URL not configured');
  }
  
  if (TEST_CREDENTIALS.qdrantApiKey.includes('your-qdrant-api-key')) {
    errors.push('Qdrant API key not configured');
  }
  
  // Check AI API credentials
  if (TEST_CREDENTIALS.googleGeminiApiKey.includes('your-google-gemini-api-key')) {
    errors.push('Google Gemini API key not configured');
  }
  
  if (TEST_CREDENTIALS.openaiApiKey.includes('your-openai-api-key')) {
    errors.push('OpenAI API key not configured');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to get credentials with validation
function getTestCredentials() {
  const validation = validateCredentials();
  
  if (!validation.isValid) {
    console.warn('⚠️  Warning: Some credentials are not configured:');
    validation.errors.forEach(error => {
      console.warn(`   - ${error}`);
    });
    console.warn('   Tests may fail or use placeholder values.\n');
  }
  
  return TEST_CREDENTIALS;
}

// Export for use in test files
module.exports = {
  TEST_CREDENTIALS,
  validateCredentials,
  getTestCredentials
};

// Display configuration status when run directly
if (require.main === module) {
  console.log('🔧 Test Credentials Configuration\n');
  
  const validation = validateCredentials();
  
  if (validation.isValid) {
    console.log('✅ All credentials are configured!');
    console.log('🚀 Ready to run tests with: node test-app-functionality.js');
  } else {
    console.log('❌ Some credentials need to be configured:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    console.log('\n📝 Please edit test-credentials.js and replace placeholder values with your actual credentials.');
  }
  
  console.log('\n📋 Current configuration:');
  console.log(`   Database: ${TEST_CREDENTIALS.neonConnectionString.includes('username') ? '❌ Not configured' : '✅ Configured'}`);
  console.log(`   Qdrant: ${TEST_CREDENTIALS.qdrantUrl.includes('your-cluster') ? '❌ Not configured' : '✅ Configured'}`);
  console.log(`   Google Gemini: ${TEST_CREDENTIALS.googleGeminiApiKey.includes('your-google') ? '❌ Not configured' : '✅ Configured'}`);
  console.log(`   OpenAI: ${TEST_CREDENTIALS.openaiApiKey.includes('your-openai') ? '❌ Not configured' : '✅ Configured'}`);
  console.log(`   App URL: ${TEST_CREDENTIALS.appUrl}`);
}
