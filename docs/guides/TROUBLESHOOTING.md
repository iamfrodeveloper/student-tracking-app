# Troubleshooting Guide

This guide helps you resolve common issues when setting up and using the Student Tracking App.

## 🚨 Common Setup Issues

### Database Connection Problems

#### "Database connection failed" - Neon PostgreSQL

**Symptoms:**
- Setup wizard shows red error for database connection
- Error message: "Connection failed" or "Connection timeout"

**Solutions:**
1. **Verify Connection String Format**
   ```
   ✅ Correct: postgresql://username:password@host:port/database?sslmode=require
   ❌ Wrong: psql -h host -U username -d database
   ```

2. **Check Connection String Components**
   - Ensure no extra spaces or line breaks
   - Verify username and password are correct
   - Confirm the host URL is complete
   - Make sure `?sslmode=require` is included

3. **Test Connection Manually**
   ```bash
   # Test with psql (if installed)
   psql "postgresql://username:password@host:port/database?sslmode=require"
   ```

4. **Common Fixes**
   - Copy connection string directly from Neon dashboard
   - Ensure your Neon database is not suspended (free tier limitation)
   - Check if your IP is allowed (Neon allows all IPs by default)

#### "Qdrant connection failed" - Vector Database

**Symptoms:**
- Qdrant connection test fails
- Error message: "Unauthorized" or "Connection refused"

**Solutions:**
1. **Verify Credentials**
   - Check Qdrant cluster URL is correct
   - Ensure API key is copied completely
   - Verify cluster is running (not suspended)

2. **Check URL Format**
   ```
   ✅ Correct: https://cluster-id.region.gcp.cloud.qdrant.io
   ❌ Wrong: cluster-id.region.gcp.cloud.qdrant.io (missing https://)
   ```

3. **Test API Key**
   ```bash
   # Test with curl
   curl -X GET "https://your-cluster-url/collections" \
        -H "api-key: your-api-key"
   ```

### API Configuration Problems

#### "Google Gemini API failed"

**Symptoms:**
- API test fails with "Invalid API key" or "Quota exceeded"
- Chat responses show API errors

**Solutions:**
1. **Verify API Key**
   - Ensure key starts with "AIzaSy"
   - Check key is copied completely without spaces
   - Verify key is enabled in Google AI Studio

2. **Check API Quotas**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Check if you've exceeded free tier limits
   - Verify API is enabled for your project

3. **Model Name Issues**
   - Use `gemini-1.5-flash` (recommended)
   - Avoid deprecated model names like `gemini-pro`

#### "OpenAI API failed"

**Symptoms:**
- API test fails with authentication errors
- Transcription not working

**Solutions:**
1. **Verify API Key**
   - Ensure key starts with "sk-"
   - Check billing is set up (OpenAI requires payment method)
   - Verify key has necessary permissions

2. **Check Usage Limits**
   - Visit [OpenAI Usage Dashboard](https://platform.openai.com/usage)
   - Ensure you have available credits
   - Check rate limits aren't exceeded

## 🔧 Application Issues

### Setup Wizard Problems

#### "Setup wizard not loading"

**Solutions:**
1. **Clear Browser Data**
   ```javascript
   // Open browser console (F12) and run:
   localStorage.clear();
   sessionStorage.clear();
   // Then refresh the page
   ```

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for JavaScript errors in Console tab
   - Check Network tab for failed requests

3. **Verify Development Server**
   ```bash
   # Ensure server is running
   npm run dev
   # Check if accessible at http://localhost:3000
   ```

#### "Configuration not saving"

**Solutions:**
1. **Browser Storage Issues**
   - Check if localStorage is enabled
   - Verify you're not in incognito/private mode
   - Clear browser cache and try again

2. **JavaScript Errors**
   - Check browser console for errors
   - Ensure all form fields are filled correctly
   - Try refreshing and completing setup again

### Chat Interface Issues

#### "Chat not responding"

**Symptoms:**
- Messages sent but no response
- Loading indicator stuck
- Error messages in chat

**Solutions:**
1. **Check Configuration**
   - Verify setup wizard was completed
   - Ensure API keys are valid
   - Test API connections in setup wizard

2. **Network Issues**
   - Check internet connection
   - Verify API endpoints are accessible
   - Look for CORS errors in browser console

3. **API Quota Issues**
   - Check if you've exceeded API limits
   - Verify billing is set up (for paid APIs)
   - Try again after quota reset

#### "Audio recording not working"

**Solutions:**
1. **Browser Permissions**
   - Allow microphone access when prompted
   - Check browser settings for microphone permissions
   - Try refreshing page and allowing permissions again

2. **HTTPS Requirement**
   - Audio recording requires HTTPS in production
   - Use `http://localhost:3000` for development
   - Ensure SSL certificate is valid in production

3. **Browser Compatibility**
   - Use modern browsers (Chrome, Firefox, Safari, Edge)
   - Update browser to latest version
   - Check if WebRTC is supported

## 🔍 Debugging Steps

### Check Application Logs

1. **Browser Console**
   ```
   F12 → Console tab
   Look for red error messages
   ```

2. **Network Requests**
   ```
   F12 → Network tab
   Check for failed API calls (red status codes)
   ```

3. **Server Logs**
   ```bash
   # Check terminal running npm run dev
   Look for error messages and stack traces
   ```

### Verify Environment

1. **Node.js Version**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 8+
   ```

2. **Dependencies**
   ```bash
   npm install  # Reinstall dependencies
   npm audit    # Check for vulnerabilities
   ```

3. **Environment Variables**
   ```bash
   # Check .env.local exists and has correct format
   cat .env.local
   ```

### Test Individual Components

1. **Database Connection**
   ```bash
   # Test PostgreSQL connection
   psql "your-connection-string"
   
   # Test Qdrant connection
   curl -X GET "your-qdrant-url/collections" -H "api-key: your-key"
   ```

2. **API Endpoints**
   ```bash
   # Test Google Gemini
   curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
        -H "Content-Type: application/json" \
        -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
   ```

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Review browser console errors**
3. **Verify all credentials are correct**
4. **Try the setup wizard again**
5. **Check if the issue is reproducible**

### Information to Include

When reporting issues, please provide:

1. **Error Messages**
   - Exact error text from browser console
   - Server error logs from terminal
   - Screenshots of error dialogs

2. **Environment Details**
   - Operating system and version
   - Browser name and version
   - Node.js version
   - npm/yarn version

3. **Configuration Details**
   - Which database provider (Neon/other)
   - Which AI provider (Google Gemini/OpenAI)
   - Whether using environment variables or setup wizard

4. **Steps to Reproduce**
   - What you were trying to do
   - What you expected to happen
   - What actually happened

### Quick Fixes to Try

1. **Restart Everything**
   ```bash
   # Stop the development server (Ctrl+C)
   npm run dev  # Start again
   ```

2. **Clear All Data**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check for Updates**
   ```bash
   git pull  # Get latest code
   npm install  # Update dependencies
   ```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Neon PostgreSQL Docs](https://neon.tech/docs)
- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

**Still having issues?** Check the browser console for specific error messages and review the setup guide to ensure all steps were completed correctly.
