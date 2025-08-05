
# 🎓 Student Tracking App

[![Build Status](https://github.com/iamfrodeveloper/student-tracking-app/workflows/CI/badge.svg)](https://github.com/iamfrodeveloper/student-tracking-app/actions)
[![Deploy Status](https://github.com/iamfrodeveloper/student-tracking-app/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/iamfrodeveloper/student-tracking-app/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

A comprehensive AI-powered student management system with enterprise-grade CI/CD pipeline, built with Next.js 15, TypeScript, and modern web technologies.

## ✨ Features

### 🎯 Core Functionality
- **Student Management**: Complete CRUD operations with advanced filtering
- **AI-Powered Chat**: Interactive chat interface with context-aware responses
- **Audio Transcription**: Voice-to-text capabilities for notes and interactions
- **Vector Search**: Semantic search through student data using Qdrant
- **Real-time Dashboard**: Live updates and comprehensive analytics
- **Payment Tracking**: Student payment management and reporting

### 🤖 AI & Machine Learning
- **Multi-LLM Support**: OpenAI GPT, Google Gemini, Anthropic Claude, Custom endpoints
- **Smart Embeddings**: Semantic search and content understanding
- **Context-Aware Responses**: Personalized interactions based on student data
- **Audio Processing**: Advanced speech-to-text with multiple provider support

### 🔒 Security & Reliability
- **Enterprise Security**: CSP headers, rate limiting, input validation
- **Comprehensive Monitoring**: Health checks, performance tracking, error reporting
- **Secure Configuration**: Environment-based secrets management
- **Production-Ready**: Full CI/CD pipeline with automated testing

### 🎨 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: shadcn/ui components with dark/light mode
- **Setup Wizard**: Guided configuration for easy deployment
- **Real-time Updates**: Live data synchronization

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks + Context API
- **Testing**: Jest + React Testing Library

### Backend
- **API**: Next.js API routes with middleware
- **Database**: Neon PostgreSQL + Qdrant Vector DB
- **Authentication**: Secure session management
- **File Upload**: Multi-provider support
- **Caching**: Redis-compatible caching layer

### AI & Integrations
- **LLM Providers**: OpenAI, Google Gemini, Anthropic, Custom
- **Vector Database**: Qdrant for semantic search
- **Audio Processing**: OpenAI Whisper, Google Speech-to-Text
- **Embeddings**: OpenAI, Sentence Transformers, Custom

### DevOps & Deployment
- **Deployment**: Vercel with GitHub Actions
- **CI/CD**: 5 comprehensive workflows
- **Monitoring**: Built-in health checks and analytics
- **Security**: Automated vulnerability scanning

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- PostgreSQL database (Neon recommended)
- Qdrant vector database
- At least one AI provider API key

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/iamfrodeveloper/student-tracking-app.git
cd student-tracking-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env.local
```

4. **Configure your environment variables** in `.env.local`

5. **Start the development server**:
```bash
npm run dev
```

6. **Open your browser** to [http://localhost:3000](http://localhost:3000)

7. **Complete setup** using the built-in Setup Wizard

## ⚙️ Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database Configuration
NEON_CONNECTION_STRING="postgresql://username:password@host/database"
QDRANT_URL="https://your-qdrant-instance.com"
QDRANT_API_KEY="your-qdrant-api-key"
QDRANT_COLLECTION_NAME="student_tracking"

# AI Provider APIs (at least one required)
OPENAI_API_KEY="sk-your-openai-key"
GOOGLE_GEMINI_API_KEY="your-gemini-key"
ANTHROPIC_API_KEY="your-anthropic-key"

# Custom AI Endpoints (optional)
CUSTOM_LLM_ENDPOINT="https://your-custom-llm.com/api"
CUSTOM_LLM_API_KEY="your-custom-key"
CUSTOM_EMBEDDINGS_ENDPOINT="https://your-embeddings.com/api"

# Application Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: Monitoring and Analytics
ANALYTICS_ID="your-analytics-id"
SENTRY_DSN="your-sentry-dsn"
```

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Database
npm run setup:db     # Initialize database schema
npm run seed:db      # Seed with sample data

# Deployment
npm run deploy       # Deploy to production
npm run preview      # Create preview deployment
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy automatically

3. **Configure GitHub Secrets** (for CI/CD):
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

## 🔄 CI/CD Pipeline

This project includes 5 comprehensive GitHub Actions workflows:

1. **Continuous Integration**: Code quality, testing, security scanning
2. **Build Verification**: Multi-OS testing, dependency analysis  
3. **Staging Deployment**: Automatic deployment on develop branch
4. **Production Deployment**: Comprehensive validation and deployment
5. **Vercel Integration**: Seamless deployment with preview links

### Workflow Features
- ✅ Automated testing and code quality checks
- ✅ Security vulnerability scanning
- ✅ Multi-environment deployments
- ✅ Automatic rollback on failure
- ✅ Performance monitoring
- ✅ Slack/email notifications

## 📊 Monitoring & Analytics

### Built-in Monitoring
- **Health Checks**: `/api/health` endpoint
- **Performance Metrics**: `/api/monitoring` dashboard
- **Error Tracking**: Comprehensive error logging
- **Usage Analytics**: User interaction tracking

### External Integrations
- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **Custom Analytics**: Configurable analytics providers

## 🔒 Security Features

- **Content Security Policy**: Comprehensive CSP headers
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod-based validation schemas
- **Secure Headers**: HSTS, X-Frame-Options, etc.
- **Environment Security**: Secure secrets management
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user journey testing
- **Performance Tests**: Load and stress testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- ChatInterface.test.tsx
```

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)**: Detailed setup instructions
- **[API Documentation](docs/API.md)**: Complete API reference
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Production deployment guide
- **[Contributing Guide](docs/CONTRIBUTING.md)**: Development guidelines
- **[Security Guide](SECURITY.md)**: Security best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing framework
- **Vercel**: For seamless deployment platform
- **OpenAI**: For powerful AI capabilities
- **shadcn/ui**: For beautiful UI components
- **Community**: For continuous feedback and contributions

## 📞 Support

- **Documentation**: Check our [docs](docs/) folder
- **Issues**: [GitHub Issues](https://github.com/iamfrodeveloper/student-tracking-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/iamfrodeveloper/student-tracking-app/discussions)
- **Email**: support@yourdomain.com

---

**Made with ❤️ by [Your Name](https://github.com/yourusername)**

⭐ **Star this repository if you find it helpful!**

