// Global setup for Jest tests
module.exports = async () => {
  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing'
  
  // Mock database URLs for testing
  process.env.NEON_DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.QDRANT_URL = 'http://localhost:6333'
  process.env.QDRANT_API_KEY = 'test-api-key'
  process.env.QDRANT_COLLECTION_NAME = 'test_collection'
  
  // Mock API keys for testing
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.GOOGLE_GEMINI_API_KEY = 'test-gemini-key'
  
  console.log('🧪 Jest global setup completed')
}
