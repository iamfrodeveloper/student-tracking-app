# Student Tracking App

A modern, AI-powered student management system built with Next.js 14, designed for educational institutions to track student information, manage payments, record test scores, and provide intelligent assistance through natural language queries.

## 🌟 Features

### 📊 Student Management
- **Student Records**: Comprehensive student information management
- **Payment Tracking**: Monitor fee payments and outstanding balances
- **Test Score Management**: Record and analyze academic performance
- **Conversation History**: Track interactions and notes

### 🤖 AI-Powered Assistant
- **Natural Language Queries**: Ask questions about students in plain English
- **Intelligent Responses**: Get insights based on actual database data
- **Voice Input**: Record audio questions with transcription support
- **Educational Focus**: Designed specifically for educational administration

### 🔒 Security & Privacy
- **No Hardcoded Credentials**: All sensitive information user-provided
- **Environment Variable Support**: Production-ready configuration
- **FERPA Compliant**: Respects educational data privacy guidelines
- **Secure by Design**: Built with security best practices

### 🛠️ Technical Features
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- **Database Support**: PostgreSQL (Neon) + Vector Database (Qdrant)
- **AI Integration**: Google Gemini, OpenAI, or custom LLM endpoints
- **Audio Recording**: Built-in WebRTC audio capture
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Database accounts (see setup guide)
- AI API keys (see setup guide)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-tracking-app
   npm install
   ```

2. **Choose your setup method**

   **Option A: Setup Wizard (Recommended for first-time users)**
   ```bash
   npm run dev
   # Open http://localhost:3000 and follow the setup wizard
   ```

   **Option B: Environment Variables (Recommended for production)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   npm run dev
   ```

3. **Complete the setup**
   - Configure your database connections (Neon PostgreSQL + Qdrant)
   - Add your AI API keys (Google Gemini or OpenAI)
   - Test all connections
   - Optionally load sample data

## 📚 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation and configuration instructions
- **[Security Guide](SECURITY.md)** - Security best practices and guidelines
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[AI Guidelines](AI_ASSISTANT_GUIDELINES.md)** - AI assistant behavior and rules

## 🔑 Required Services

### Database Services
- **[Neon PostgreSQL](https://neon.tech/)** - Serverless PostgreSQL (Free tier available)
- **[Qdrant Cloud](https://cloud.qdrant.io/)** - Vector database for AI features (Free tier available)

### AI Services (Choose one)
- **[Google Gemini](https://makersuite.google.com/)** - Recommended, generous free tier
- **[OpenAI](https://platform.openai.com/)** - Alternative, pay-per-use
- **Custom LLM** - Bring your own OpenAI-compatible API

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Databases     │
│                 │    │                 │    │                 │
│ • Next.js 14    │◄──►│ • API Routes    │◄──►│ • PostgreSQL    │
│ • TypeScript    │    │ • AI Integration│    │ • Qdrant Vector │
│ • Tailwind CSS  │    │ • Auth & Security│    │ • File Storage  │
│ • shadcn/ui     │    │ • Data Validation│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔒 Security Features

- ✅ **No hardcoded credentials** - All sensitive data user-provided
- ✅ **Environment variable support** - Production-ready configuration
- ✅ **Input validation** - Comprehensive data sanitization
- ✅ **Secure headers** - HTTPS, HSTS, CSP, and more
- ✅ **Privacy compliance** - FERPA, GDPR considerations
- ✅ **Audit logging** - Track all data modifications

## 🎯 Use Cases

### Educational Institutions
- **Schools**: Track student progress, payments, and communications
- **Tutoring Centers**: Manage student records and performance
- **Training Programs**: Monitor participant progress and completion

### Key Benefits
- **Time Saving**: AI assistant answers questions instantly
- **Data Insights**: Analyze student performance trends
- **Improved Communication**: Track all student interactions
- **Secure Management**: Protect sensitive educational data

## 🛠️ Development

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL, Qdrant Vector DB
- **AI**: Google Gemini API, OpenAI API
- **Audio**: WebRTC, Web Audio API
- **Deployment**: Vercel, Docker support

### Project Structure
```
src/
├── app/                 # Next.js 14 app router
├── components/          # React components
├── lib/                 # Utility functions
├── types/               # TypeScript definitions
└── styles/              # Global styles

docs/
├── SETUP_GUIDE.md       # Installation guide
├── SECURITY.md          # Security practices
└── TROUBLESHOOTING.md   # Common issues
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup
```bash
git clone <your-fork>
cd student-tracking-app
npm install
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our comprehensive guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Security**: Report security issues privately

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **shadcn/ui** - Beautiful component library
- **Neon** - Serverless PostgreSQL platform
- **Qdrant** - Vector database technology
- **Google AI** - Gemini API for intelligent responses

---

**Ready to get started?** Check out our [Setup Guide](SETUP_GUIDE.md) for detailed installation instructions.

**Questions?** See our [Troubleshooting Guide](TROUBLESHOOTING.md) or open an issue.

**Security concerns?** Review our [Security Guide](SECURITY.md) for best practices.
