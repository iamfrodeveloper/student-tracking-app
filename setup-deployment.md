# 🚀 Deployment Setup Guide

## Your Vercel Credentials
```
VERCEL_TOKEN: wZZWTefw6XBQqFmkev5ojQgP
VERCEL_ORG_ID: team_aetBdPtsO96s17bY3hqe03Kt
VERCEL_PROJECT_ID: prj_smfjJYZnzzrbijgHZJD8YoNM7Qdk
```

## 🔐 Step 1: Set Up GitHub Secrets

### Manual Setup (GitHub Web Interface)
1. Go to your repository: https://github.com/iamfrodeveloper/student-tracking-app
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | `wZZWTefw6XBQqFmkev5ojQgP` |
| `VERCEL_ORG_ID` | `aditis-projects-430a9f30` |
| `VERCEL_PROJECT_ID` | `prj_smfjJYZnzzrbijgHZJD8YoNM7Qdk` |

### Using GitHub CLI (if available)
```bash
gh secret set VERCEL_TOKEN --body "wZZWTefw6XBQqFmkev5ojQgP"
gh secret set VERCEL_ORG_ID --body "aditis-projects-430a9f30"
gh secret set VERCEL_PROJECT_ID --body "prj_smfjJYZnzzrbijgHZJD8YoNM7Qdk"
```

## 🧪 Step 2: Test Manual Deployment

### Option A: Using Vercel CLI
```bash
# Set environment variables
$env:VERCEL_TOKEN="wZZWTefw6XBQqFmkev5ojQgP"
$env:VERCEL_ORG_ID="aditis-projects-430a9f30"
$env:VERCEL_PROJECT_ID="prj_smfjJYZnzzrbijgHZJD8YoNM7Qdk"

# Deploy to production
vercel --prod --token $env:VERCEL_TOKEN
```

### Option B: Link Project First
```bash
# Link the project
vercel link --token wZZWTefw6XBQqFmkev5ojQgP

# Deploy
vercel --prod
```

## 🔍 Step 3: Verify Deployment

After deployment, check:
- **Health endpoint**: https://your-deployment-url.vercel.app/api/health
- **Main app**: https://your-deployment-url.vercel.app
- **GitHub Actions**: Check if workflows run successfully

## 🚨 Step 4: Trigger CI/CD Pipeline

### Method 1: Push a small change
```bash
# Make a small change to trigger deployment
echo "# Deployment test" >> README.md
git add README.md
git commit -m "test: trigger deployment pipeline"
git push origin main
```

### Method 2: Manual workflow dispatch
1. Go to GitHub Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select "main" branch and run

## 📊 Expected Results

After successful setup:
- ✅ GitHub Actions workflows should run automatically
- ✅ Vercel deployment should complete
- ✅ App should be accessible at the deployment URL
- ✅ Health check should return status information

## 🔧 Troubleshooting

If deployment fails:
1. Check GitHub Actions logs for errors
2. Verify all secrets are set correctly
3. Check Vercel dashboard for deployment status
4. Ensure environment variables are configured in Vercel
