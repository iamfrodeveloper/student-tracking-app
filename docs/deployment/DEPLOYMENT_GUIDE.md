# Comprehensive Deployment Guide - Student Tracking App

This guide covers deploying the Student Tracking App to Vercel with automated CI/CD pipeline, security configuration, and monitoring setup.

## 📋 Table of Contents

1. [Quick Deployment](#-quick-deployment)
2. [Prerequisites](#-prerequisites)
3. [Environment Setup](#-environment-setup)
4. [Vercel Configuration](#-vercel-configuration)
5. [GitHub Actions Setup](#-github-actions-setup)
6. [Security Configuration](#-security-configuration)
7. [Monitoring and Health Checks](#-monitoring-and-health-checks)
8. [Troubleshooting](#-troubleshooting)
9. [Advanced Configuration](#-advanced-configuration)
10. [Maintenance and Updates](#-maintenance-and-updates)

## 🚀 Quick Deployment

## 📋 Prerequisites

### Required Accounts and Services

1. **GitHub Account**: For repository hosting and CI/CD
   - Repository with admin access
   - GitHub Actions enabled

2. **Vercel Account**: For application hosting
   - Sign up at [vercel.com](https://vercel.com)
   - Free tier supports most use cases
   - Pro tier recommended for production

3. **Database Services**:
   - **Neon PostgreSQL**: [console.neon.tech](https://console.neon.tech/)
   - **Qdrant Vector Database**: [cloud.qdrant.io](https://cloud.qdrant.io/)

4. **AI API Services** (choose one or more):
   - **OpenAI**: [platform.openai.com](https://platform.openai.com/)
   - **Google Gemini**: [makersuite.google.com](https://makersuite.google.com/)

### Required Tools

1. **Node.js**: Version 18 or higher
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be 8.0.0 or higher
   ```

2. **Git**: For version control
   ```bash
   git --version
   ```

3. **Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

4. **GitHub CLI** (optional):
   ```bash
   gh --version
   ```

### Development Environment

1. **Code Editor**: VS Code recommended with extensions:
   - TypeScript and JavaScript Language Features
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense

2. **Environment Variables**: Prepare the following:
   - Database connection strings
   - AI API keys
   - Security secrets
   - Custom domain (if applicable)

### Step 1: Vercel Project Setup

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Import Project**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select "student-tracking-app" directory if it's in a monorepo

3. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm ci` (auto-detected)

## 🌍 Environment Setup

### Step 1: Database Setup

#### Neon PostgreSQL Setup
1. **Create Account**: Sign up at [console.neon.tech](https://console.neon.tech/)
2. **Create Database**:
   ```sql
   -- Database will be created automatically
   -- Note your connection string format:
   -- postgresql://username:password@host.neon.tech/database?sslmode=require
   ```
3. **Configure Security**:
   - Enable connection pooling
   - Set up IP allowlists if needed
   - Configure SSL (enabled by default)

#### Qdrant Vector Database Setup
1. **Create Account**: Sign up at [cloud.qdrant.io](https://cloud.qdrant.io/)
2. **Create Cluster**:
   - Choose appropriate region
   - Select cluster size based on needs
   - Note the cluster URL and API key
3. **Collection Setup**:
   - Collection will be created automatically
   - Default name: `student_notes`

### Step 2: AI API Setup

#### OpenAI Configuration
1. **Get API Key**: Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Create New Key**:
   - Name: "Student Tracking App"
   - Permissions: Full access or restricted as needed
3. **Set Usage Limits**: Configure monthly spending limits
4. **Monitor Usage**: Set up usage alerts

#### Google Gemini Configuration
1. **Get API Key**: Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Create New Key**:
   - Project: Create or select existing project
   - Enable Generative Language API
3. **Configure Quotas**: Set appropriate rate limits

### Step 3: Environment Variables Configuration

Configure the following environment variables in Vercel Dashboard:

#### Database Configuration
```
NEON_DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
QDRANT_URL=https://your-cluster.qdrant.tech
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=student_notes
```

#### AI API Configuration
```
# Google Gemini (recommended)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
GOOGLE_GEMINI_MODEL=gemini-1.5-flash

# OpenAI (alternative)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_WHISPER_MODEL=whisper-1

# Custom endpoints (optional)
CUSTOM_LLM_ENDPOINT=https://your-custom-llm-endpoint
CUSTOM_LLM_API_KEY=your_custom_api_key
CUSTOM_TRANSCRIPTION_ENDPOINT=https://your-transcription-endpoint
```

#### Application Configuration
```
NODE_ENV=production
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_secure_random_string
```

### Step 3: Deploy

1. **Automatic Deployment**
   - Push to your main branch
   - Vercel automatically deploys
   - Check deployment status in Vercel dashboard

2. **Manual Deployment** (if needed)
   ```bash
   # Deploy to production
   npm run deploy
   
   # Deploy preview
   npm run deploy:preview
   ```

### Step 4: Verify Deployment

1. **Health Check**
   - Visit `https://your-app.vercel.app/api/health`
   - Should return `{"status": "ok", "timestamp": "..."}`

2. **Setup Wizard**
   - Visit your app URL
   - Complete the setup wizard if environment variables aren't set
   - Test database connections

## ⚙️ GitHub Actions Setup

### Repository Configuration

1. **Enable GitHub Actions**:
   - Go to repository Settings → Actions → General
   - Allow all actions and reusable workflows
   - Enable workflow permissions

2. **Configure Secrets**:
   ```bash
   # Using GitHub CLI
   gh secret set VERCEL_TOKEN --body "your_vercel_token"
   gh secret set VERCEL_ORG_ID --body "your_org_id"
   gh secret set VERCEL_PROJECT_ID --body "your_project_id"
   gh secret set NEON_DATABASE_URL --body "your_database_url"
   gh secret set QDRANT_URL --body "your_qdrant_url"
   gh secret set QDRANT_API_KEY --body "your_qdrant_key"
   gh secret set NEXTAUTH_SECRET --body "your_secure_secret"
   gh secret set OPENAI_API_KEY --body "your_openai_key"
   gh secret set GOOGLE_GEMINI_API_KEY --body "your_gemini_key"
   ```

3. **Branch Protection Rules**:
   - Protect `main` branch
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

### Workflow Overview

The CI/CD pipeline includes 5 workflows:

1. **Continuous Integration** (`ci.yml`):
   - Code quality checks (ESLint, Prettier, TypeScript)
   - Comprehensive testing (unit, component, API)
   - Coverage reporting
   - Security scanning

2. **Build Verification** (`build-verification.yml`):
   - Multi-OS testing
   - Dependency analysis
   - Bundle analysis
   - Performance baselines

3. **Staging Deployment** (`deploy-staging.yml`):
   - Automatic deployment on `develop` branch
   - Health checks and verification
   - PR preview links

4. **Production Deployment** (`deploy-production.yml`):
   - Comprehensive validation
   - Production deployment on `main` branch
   - Post-deployment monitoring

5. **Vercel Integration** (`vercel-integration.yml`):
   - Seamless Vercel deployment
   - Preview deployments for PRs
   - Automatic cleanup

### Monitoring Workflows

1. **Secrets Validation** (`secrets-validation.yml`):
   - Weekly validation of all secrets
   - Format checking
   - Connectivity testing

2. **Health Monitoring**:
   - Automated health checks
   - Performance monitoring
   - Error tracking

## 🔒 Security Configuration

### Production Security Checklist

- [ ] **Environment Variables**: All secrets configured in Vercel
- [ ] **CORS Origins**: Properly configured for production domain
- [ ] **Rate Limiting**: Enabled with appropriate limits
- [ ] **Security Headers**: CSP, HSTS, and other headers configured
- [ ] **SSL/TLS**: HTTPS enforced in production
- [ ] **API Keys**: Rotated and monitored regularly
- [ ] **Database**: SSL enabled and IP restrictions configured
- [ ] **Monitoring**: Error tracking and performance monitoring enabled

### Security Best Practices

1. **Secret Management**:
   - Use different secrets for different environments
   - Rotate secrets every 90 days
   - Monitor secret usage
   - Never commit secrets to version control

2. **Access Control**:
   - Limit repository access
   - Use principle of least privilege
   - Regular access audits
   - Enable 2FA for all accounts

3. **Monitoring**:
   - Set up error tracking (Sentry recommended)
   - Monitor API usage and rate limits
   - Track deployment metrics
   - Set up security alerts

## 📊 Monitoring and Health Checks

### Health Check Endpoint

The application includes a comprehensive health check at `/api/health`:

```bash
curl https://your-app.vercel.app/api/health
```

**Response includes**:
- Overall system status
- Database connectivity
- Vector database status
- AI services availability
- Memory and performance metrics
- Detailed error information

### Monitoring Setup

1. **Vercel Analytics**:
   - Enable in Vercel Dashboard
   - Monitor Core Web Vitals
   - Track user interactions

2. **Error Tracking**:
   ```bash
   # Add Sentry DSN to environment variables
   SENTRY_DSN=your_sentry_dsn
   ```

3. **Performance Monitoring**:
   - Response time tracking
   - Database query performance
   - API call latency
   - Memory usage monitoring

4. **Uptime Monitoring**:
   - Set up external monitoring (UptimeRobot, Pingdom)
   - Monitor health endpoint
   - Configure alerts for downtime

### Alerting

1. **GitHub Actions Alerts**:
   - Workflow failure notifications
   - Security scan alerts
   - Deployment status updates

2. **Application Alerts**:
   - Error rate thresholds
   - Performance degradation
   - Security events
   - Resource usage limits

## 🔧 Advanced Configuration

### Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable

### Environment-Specific Deployments

- **Production**: `main` branch → Production deployment
- **Staging**: `staging` branch → Preview deployment
- **Development**: Feature branches → Preview deployments

### Performance Optimization

The app is configured with:
- ✅ Image optimization (WebP/AVIF)
- ✅ Bundle optimization
- ✅ Static generation where possible
- ✅ Edge runtime for API routes
- ✅ Compression and caching headers

## 🔒 Security Configuration

### Environment Variables Security

- ✅ All secrets stored in Vercel environment variables
- ✅ No hardcoded credentials in code
- ✅ Separate environments for dev/staging/production

### Security Headers

Automatically configured:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- XSS Protection

### CORS Configuration

- API routes configured for secure cross-origin requests
- Specific origins allowed in production
- Preflight request handling

## 📊 Monitoring and Logs

### Vercel Analytics

1. Enable in Vercel Dashboard → Your Project → Analytics
2. Monitor performance, Core Web Vitals
3. Track user interactions and errors

### Application Logs

- View logs in Vercel Dashboard → Your Project → Functions
- Real-time log streaming available
- Error tracking and debugging

### Health Monitoring

- Health check endpoint: `/api/health`
- Automated monitoring via Vercel cron jobs
- Database connection verification

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs in Vercel dashboard
   # Common fixes:
   npm run type-check  # Fix TypeScript errors
   npm run lint:fix    # Fix linting issues
   ```

2. **Environment Variable Issues**
   - Verify all required variables are set
   - Check variable names (case-sensitive)
   - Redeploy after adding variables

3. **Database Connection Issues**
   - Verify connection strings
   - Check IP allowlists in Neon/Qdrant
   - Test connections locally first

4. **API Rate Limits**
   - Monitor API usage in provider dashboards
   - Implement request caching if needed
   - Consider upgrading API plans

### Getting Help

- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review application logs in Vercel dashboard
- Test locally with production environment variables
- Contact support through GitHub issues

## 🔄 Continuous Deployment

Once set up, your deployment workflow is:

1. **Development**: Work on feature branches
2. **Testing**: Push creates preview deployment
3. **Review**: Test preview deployment
4. **Production**: Merge to main → automatic production deployment

The CI/CD pipeline (configured in Phase 3) will handle:
- Automated testing
- Code quality checks
- Security scanning
- Deployment verification
