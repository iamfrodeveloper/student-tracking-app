# Secrets Management Guide

This guide covers secure handling of API keys, database credentials, and secrets in the CI/CD pipeline.

## 🔐 Required Secrets

### GitHub Repository Secrets

Configure these secrets in your GitHub repository settings (`Settings → Secrets and variables → Actions`):

#### Vercel Deployment
```
VERCEL_TOKEN          # Vercel API token with deployment permissions
VERCEL_ORG_ID         # Your Vercel organization ID
VERCEL_PROJECT_ID     # Your Vercel project ID
```

#### Database Credentials
```
NEON_DATABASE_URL     # PostgreSQL connection string
QDRANT_URL           # Qdrant vector database URL
QDRANT_API_KEY       # Qdrant API key
QDRANT_COLLECTION_NAME # Collection name (optional, defaults to 'student_notes')
```

#### AI API Keys
```
OPENAI_API_KEY       # OpenAI API key for transcription/embeddings
GOOGLE_GEMINI_API_KEY # Google Gemini API key for LLM
```

#### Security Configuration
```
NEXTAUTH_SECRET      # NextAuth.js secret (32+ characters)
ALLOWED_ORIGINS      # Comma-separated list of allowed origins
```

#### Optional Services
```
CODECOV_TOKEN        # Codecov integration token
SENTRY_DSN          # Sentry error tracking DSN
CUSTOM_DOMAIN       # Custom domain for production
```

## 🛠️ Setup Instructions

### 1. Generate Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
cd student-tracking-app
vercel link

# Get organization and project IDs
vercel project ls
```

### 2. Create API Tokens

#### Vercel Token
1. Go to [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens)
2. Create a new token with deployment permissions
3. Copy the token value

#### Database Credentials
1. **Neon**: Get connection string from [Neon Console](https://console.neon.tech/)
2. **Qdrant**: Get URL and API key from [Qdrant Cloud](https://cloud.qdrant.io/)

#### AI API Keys
1. **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Google Gemini**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Configure GitHub Secrets

```bash
# Using GitHub CLI (recommended)
gh secret set VERCEL_TOKEN --body "your_vercel_token"
gh secret set VERCEL_ORG_ID --body "your_org_id"
gh secret set VERCEL_PROJECT_ID --body "your_project_id"

# Or use the GitHub web interface:
# Repository → Settings → Secrets and variables → Actions → New repository secret
```

## 🔒 Security Best Practices

### Secret Rotation
- **Rotate secrets regularly** (every 90 days minimum)
- **Monitor secret usage** in service dashboards
- **Revoke compromised secrets** immediately
- **Use different secrets** for different environments

### Access Control
- **Limit secret access** to necessary workflows only
- **Use environment-specific secrets** when possible
- **Audit secret access** regularly
- **Remove unused secrets** promptly

### Secret Validation
```yaml
# Example workflow step to validate secrets
- name: Validate secrets
  run: |
    if [ -z "${{ secrets.VERCEL_TOKEN }}" ]; then
      echo "❌ VERCEL_TOKEN is not set"
      exit 1
    fi
    
    if [ -z "${{ secrets.NEON_DATABASE_URL }}" ]; then
      echo "❌ NEON_DATABASE_URL is not set"
      exit 1
    fi
    
    echo "✅ All required secrets are configured"
```

## 🌍 Environment-Specific Configuration

### Development Environment
```bash
# .env.local (local development)
NEON_DATABASE_URL=postgresql://dev_user:dev_pass@dev.neon.tech/dev_db
QDRANT_URL=https://dev-cluster.qdrant.tech
OPENAI_API_KEY=sk-dev_key...
```

### Staging Environment
```bash
# Vercel environment variables (staging)
NEON_DATABASE_URL=postgresql://staging_user:staging_pass@staging.neon.tech/staging_db
QDRANT_URL=https://staging-cluster.qdrant.tech
OPENAI_API_KEY=sk-staging_key...
```

### Production Environment
```bash
# Vercel environment variables (production)
NEON_DATABASE_URL=postgresql://prod_user:prod_pass@prod.neon.tech/prod_db
QDRANT_URL=https://prod-cluster.qdrant.tech
OPENAI_API_KEY=sk-prod_key...
```

## 🔧 Vercel Environment Variables

### Setting Environment Variables in Vercel

1. **Via Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add variables for each environment (Development, Preview, Production)

2. **Via Vercel CLI:**
   ```bash
   # Set production environment variable
   vercel env add NEON_DATABASE_URL production
   
   # Set preview environment variable
   vercel env add NEON_DATABASE_URL preview
   
   # Set development environment variable
   vercel env add NEON_DATABASE_URL development
   ```

3. **Via GitHub Actions:**
   ```yaml
   - name: Set Vercel environment variables
     run: |
       vercel env add NEON_DATABASE_URL production --token=${{ secrets.VERCEL_TOKEN }} --value="${{ secrets.NEON_DATABASE_URL }}"
   ```

## 🚨 Emergency Procedures

### Compromised Secret Response
1. **Immediately revoke** the compromised secret
2. **Generate new secret** with the service provider
3. **Update GitHub secrets** with new values
4. **Update Vercel environment variables** if applicable
5. **Redeploy applications** to use new secrets
6. **Monitor for unauthorized usage** of old secrets

### Secret Recovery
```bash
# Backup current secrets (for authorized personnel only)
gh secret list

# Restore from backup
gh secret set SECRET_NAME --body "backup_value"
```

## 📋 Secrets Checklist

### Pre-deployment Checklist
- [ ] All required secrets are configured in GitHub
- [ ] Secrets are properly formatted and valid
- [ ] Environment-specific secrets are set in Vercel
- [ ] Test deployments work with configured secrets
- [ ] Secrets are documented (without revealing values)
- [ ] Access permissions are properly configured

### Post-deployment Checklist
- [ ] Application successfully connects to all services
- [ ] No secrets are exposed in logs or error messages
- [ ] Monitoring is configured for secret usage
- [ ] Backup procedures are documented
- [ ] Team members know emergency procedures

## 🔍 Monitoring and Auditing

### Secret Usage Monitoring
- Monitor API usage in service dashboards
- Set up alerts for unusual activity
- Review access logs regularly
- Track secret rotation schedules

### Audit Trail
- Document all secret changes
- Maintain access logs
- Regular security reviews
- Compliance reporting

## 📚 Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
