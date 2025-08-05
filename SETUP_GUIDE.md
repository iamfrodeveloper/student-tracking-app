# Student Tracking App - Setup Guide

Welcome to the Student Tracking App! This guide will help you set up the application with your own credentials and get it running in your environment.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Database accounts (see below)
- AI API accounts (see below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-tracking-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables (Optional)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` and complete the setup wizard.

## 🔑 Required Credentials

### 1. Database Services

#### Neon PostgreSQL (Required)
- **What it's for:** Storing student data, payments, test scores, and conversation history
- **How to get it:**
  1. Visit [neon.tech](https://neon.tech/)
  2. Create a free account
  3. Create a new project
  4. Copy the connection string from your dashboard
- **Format:** `postgresql://username:password@host:port/database?sslmode=require`
- **Free tier:** Yes, generous limits for development

#### Qdrant Vector Database (Required)
- **What it's for:** Storing and searching conversation embeddings for AI context
- **How to get it:**
  1. Visit [cloud.qdrant.io](https://cloud.qdrant.io/)
  2. Create a free account
  3. Create a new cluster
  4. Copy the cluster URL and API key
- **Free tier:** Yes, 1GB storage included

### 2. AI Services (Choose One)

#### Option A: Google Gemini (Recommended)
- **What it's for:** AI-powered student assistance and query processing
- **How to get it:**
  1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
  2. Create or sign in to your Google account
  3. Generate an API key
- **Cost:** Free tier with generous limits
- **Models:** `gemini-1.5-flash` (recommended), `gemini-1.5-pro`

#### Option B: OpenAI
- **What it's for:** Alternative AI provider for LLM and transcription
- **How to get it:**
  1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
  2. Create an account and add billing information
  3. Generate an API key
- **Cost:** Pay-per-use pricing
- **Models:** `gpt-4`, `gpt-3.5-turbo`, `whisper-1`

#### Option C: Custom API
- **What it's for:** Use your own AI infrastructure
- **Requirements:** OpenAI-compatible API endpoints
- **Setup:** Provide your custom endpoint URLs and API keys

### 3. Optional Services

#### Transcription (Optional)
- **Default:** Uses OpenAI Whisper if OpenAI API key is provided
- **Alternative:** Custom transcription endpoint
- **Note:** Audio recording works without transcription, but text conversion requires this service

## 🛠️ Configuration Methods

### Method 1: Setup Wizard (Recommended for Development)

1. Start the application (`npm run dev`)
2. Open `http://localhost:3000`
3. Follow the 4-step setup wizard:
   - **Step 1:** Database Configuration
   - **Step 2:** API Configuration  
   - **Step 3:** Connection Testing
   - **Step 4:** Sample Data Loading

### Method 2: Environment Variables (Recommended for Production)

1. Copy `.env.example` to `.env.local`
2. Fill in your credentials:

```bash
# Database
NEON_DATABASE_URL=postgresql://your_username:your_password@your_host.neon.tech/your_database?sslmode=require
QDRANT_URL=https://your-cluster-id.your-region.gcp.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here

# AI Services (choose one)
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here
# OR
OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the application - it will automatically use environment variables

## 🔒 Security Best Practices

### Credential Management
- ✅ **DO:** Use environment variables for production
- ✅ **DO:** Keep API keys confidential and secure
- ✅ **DO:** Regularly rotate your API keys
- ✅ **DO:** Monitor API usage for unusual activity
- ❌ **DON'T:** Commit credentials to version control
- ❌ **DON'T:** Share API keys in chat, email, or public forums
- ❌ **DON'T:** Use production credentials in development

### Database Security
- Use strong, unique passwords
- Enable SSL/TLS connections (included in Neon by default)
- Regularly backup your data
- Monitor database access logs

### API Security
- Set up API key restrictions when available
- Use IP allowlists for production deployments
- Implement rate limiting
- Monitor API usage and costs

## 🧪 Testing Your Setup

### 1. Database Connection Test
The setup wizard will automatically test your database connections and create the required schema.

### 2. API Connection Test
The setup wizard will test your AI API connections with a simple query.

### 3. Sample Data Loading
Optionally load sample data to test the application:
- 10 sample students
- Payment records
- Test scores
- Conversation history

### 4. Manual Testing
1. Navigate through the dashboard
2. Try the chat interface with text messages
3. Test audio recording (if transcription is configured)
4. Verify data persistence

## 🚨 Troubleshooting

### Common Issues

#### "Database connection failed"
- Verify your Neon connection string is correct
- Check that your Neon database is running
- Ensure SSL mode is enabled in the connection string

#### "Qdrant connection failed"
- Verify your Qdrant URL and API key
- Check that your Qdrant cluster is running
- Ensure the collection name is valid

#### "API key invalid"
- Verify your API key is correct and active
- Check that you have sufficient credits/quota
- Ensure the API key has the required permissions

#### "Setup wizard not loading"
- Clear your browser's localStorage
- Check the browser console for errors
- Verify the development server is running

### Getting Help

1. Check the browser console for error messages
2. Review the server logs in your terminal
3. Verify all credentials are correctly formatted
4. Try the connection tests in the setup wizard

## 🎯 Next Steps

Once setup is complete:

1. **Explore the Dashboard:** View student statistics and recent activity
2. **Try the Chat Interface:** Ask questions about students using natural language
3. **Add Real Data:** Replace sample data with your actual student information
4. **Customize Settings:** Adjust the AI assistant behavior and responses
5. **Deploy to Production:** Use environment variables and proper hosting

## 📚 Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Need help?** Check the troubleshooting section above or review the application logs for specific error messages.
