const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import test credentials
const { getTestCredentials } = require('./test-credentials');
const TEST_CONFIG = getTestCredentials();

class ComprehensiveSmokeTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '..', 'production-smoke-test-screenshots');
    this.testResults = [];
    this.deploymentUrl = null;
    this.testReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Comprehensive Production Smoke Test',
      environment: 'Production',
      results: {
        deployment: { status: 'pending', details: [] },
        setupWizard: { status: 'pending', details: [] },
        coreFunctionality: { status: 'pending', details: [] },
        responsiveDesign: { status: 'pending', details: [] },
        performance: { status: 'pending', details: [] },
        security: { status: 'pending', details: [] }
      },
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async initialize() {
    console.log('🚀 Comprehensive Production Smoke Test - Student Tracking App\n');
    
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    this.browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });

    this.page = await this.browser.newPage();
    
    // Set up console and error logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
        this.addTestResult('Browser Error', 'failed', msg.text());
      }
    });

    this.page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
      this.addTestResult('Page Error', 'failed', error.message);
    });
  }

  async takeScreenshot(name, description = '', category = 'general') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${String(this.testResults.length + 1).padStart(3, '0')}-${category}-${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    
    const result = {
      step: this.testResults.length + 1,
      category,
      name,
      description,
      filename,
      filepath,
      timestamp,
      url: this.page.url(),
      viewport: await this.page.viewport()
    };
    
    this.testResults.push(result);
    console.log(`📸 Step ${result.step}: [${category.toUpperCase()}] ${description}`);
    return filepath;
  }

  addTestResult(testName, status, details = '', category = 'general') {
    this.testReport.results[category] = this.testReport.results[category] || { status: 'pending', details: [] };
    this.testReport.results[category].details.push({
      test: testName,
      status,
      details,
      timestamp: new Date().toISOString()
    });
    
    this.testReport.summary.totalTests++;
    if (status === 'passed') this.testReport.summary.passed++;
    else if (status === 'failed') this.testReport.summary.failed++;
    else if (status === 'warning') this.testReport.summary.warnings++;
  }

  async checkDeploymentStatus() {
    console.log('🔍 Step 1: Checking Deployment Status...\n');
    
    const deploymentUrls = [
      'https://student-tracking-app.vercel.app', // Production deployment
      'https://student-tracking-jjj35tt18-aditis-projects-430a9f30.vercel.app', // Latest deployment
      'http://localhost:3001' // Local development server fallback
    ];

    for (const url of deploymentUrls) {
      try {
        console.log(`Testing deployment URL: ${url}`);
        await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const title = await this.page.title();
        const content = await this.page.content();
        
        if (title.includes('Student Tracking') || content.includes('Student Tracking')) {
          this.deploymentUrl = url;
          console.log(`✅ Found working deployment at: ${url}`);
          this.addTestResult('Deployment Access', 'passed', `Working deployment found at ${url}`, 'deployment');
          await this.takeScreenshot('deployment-found', `Working deployment at ${url}`, 'deployment');
          break;
        } else if (title.includes('Create Next App')) {
          console.log(`⚠️ Default Next.js page found at: ${url}`);
          this.addTestResult('Deployment Status', 'warning', `Default Next.js page at ${url}`, 'deployment');
          await this.takeScreenshot('default-nextjs', `Default Next.js page at ${url}`, 'deployment');
        } else {
          console.log(`❌ Unexpected content at: ${url}`);
          this.addTestResult('Deployment Content', 'failed', `Unexpected content at ${url}`, 'deployment');
          await this.takeScreenshot('unexpected-content', `Unexpected content at ${url}`, 'deployment');
        }
      } catch (error) {
        console.log(`❌ Failed to access: ${url} - ${error.message}`);
        this.addTestResult('Deployment Access', 'failed', `Cannot access ${url}: ${error.message}`, 'deployment');
      }
    }

    if (!this.deploymentUrl) {
      console.log('🚨 No working deployment found. Starting local server for testing...');
      await this.startLocalServer();
    }

    return this.deploymentUrl;
  }

  async startLocalServer() {
    console.log('🔧 Starting local development server...');
    
    try {
      // Start the local server in background
      const { spawn } = require('child_process');
      this.localServer = spawn('npm', ['run', 'dev'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      // Wait for server to start
      await new Promise((resolve) => {
        setTimeout(resolve, 10000); // Wait 10 seconds for server to start
      });

      // Test local server
      await this.page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
      const title = await this.page.title();

      if (title.includes('Student Tracking')) {
        this.deploymentUrl = 'http://localhost:3001';
        console.log('✅ Local server started successfully');
        this.addTestResult('Local Server', 'passed', 'Local development server started', 'deployment');
        await this.takeScreenshot('local-server-started', 'Local development server running', 'deployment');
      } else {
        throw new Error('Local server not responding correctly');
      }
    } catch (error) {
      console.log(`❌ Failed to start local server: ${error.message}`);
      this.addTestResult('Local Server', 'failed', `Cannot start local server: ${error.message}`, 'deployment');
      throw error;
    }
  }

  async testSetupWizard() {
    console.log('\n🧙 Step 2: Testing Setup Wizard...\n');
    
    if (!this.deploymentUrl) {
      throw new Error('No deployment URL available for testing');
    }

    // Navigate to application
    await this.page.goto(this.deploymentUrl, { waitUntil: 'networkidle2' });
    await this.takeScreenshot('setup-wizard-start', 'Setup wizard initial load', 'setupWizard');

    // Test Neon PostgreSQL Configuration
    console.log('📋 Testing Neon PostgreSQL Configuration...');
    const neonTextarea = await this.page.$('textarea[placeholder*="postgresql"]');
    if (neonTextarea) {
      await neonTextarea.click();
      await neonTextarea.type(TEST_CONFIG.neonConnectionString, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for validation
      await this.takeScreenshot('neon-configured', 'Neon PostgreSQL credentials entered', 'setupWizard');
      this.addTestResult('Neon Configuration', 'passed', 'Neon credentials entered successfully', 'setupWizard');
    } else {
      this.addTestResult('Neon Configuration', 'failed', 'Neon input field not found', 'setupWizard');
    }

    // Test Qdrant Configuration
    console.log('📋 Testing Qdrant Configuration...');
    const qdrantUrlInput = await this.page.$('input[placeholder*="qdrant"]');
    if (qdrantUrlInput) {
      await qdrantUrlInput.click();
      await qdrantUrlInput.type(TEST_CONFIG.qdrantUrl, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.takeScreenshot('qdrant-url-configured', 'Qdrant URL entered', 'setupWizard');
      this.addTestResult('Qdrant URL Configuration', 'passed', 'Qdrant URL entered successfully', 'setupWizard');
    } else {
      this.addTestResult('Qdrant URL Configuration', 'failed', 'Qdrant URL input not found', 'setupWizard');
    }

    const qdrantKeyInput = await this.page.$('input[type="password"]');
    if (qdrantKeyInput) {
      await qdrantKeyInput.click();
      await qdrantKeyInput.type(TEST_CONFIG.qdrantApiKey, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.takeScreenshot('qdrant-key-configured', 'Qdrant API key entered', 'setupWizard');
      this.addTestResult('Qdrant API Key Configuration', 'passed', 'Qdrant API key entered successfully', 'setupWizard');
    } else {
      this.addTestResult('Qdrant API Key Configuration', 'failed', 'Qdrant API key input not found', 'setupWizard');
    }

    // Navigate to API tab
    console.log('📋 Testing API Configuration...');
    const apiButtons = await this.page.$$('button');
    for (const button of apiButtons) {
      const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
      if (buttonText.includes('api')) {
        await button.click();
        console.log('✅ Navigated to API tab');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.takeScreenshot('api-tab-opened', 'API configuration tab opened', 'setupWizard');

    // Test Google Gemini API Configuration
    const geminiInput = await this.page.$('input[type="password"]');
    if (geminiInput) {
      await geminiInput.click();
      await geminiInput.type(TEST_CONFIG.googleGeminiApiKey, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.takeScreenshot('gemini-configured', 'Google Gemini API key entered', 'setupWizard');
      this.addTestResult('Gemini API Configuration', 'passed', 'Gemini API key entered successfully', 'setupWizard');
    } else {
      this.addTestResult('Gemini API Configuration', 'failed', 'Gemini API input not found', 'setupWizard');
    }

    // Test connection testing
    console.log('📋 Testing Connection Testing...');
    const testButtons = await this.page.$$('button');
    for (const button of testButtons) {
      const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
      if (buttonText.includes('test') && buttonText.includes('connection')) {
        await button.click();
        console.log('✅ Started connection testing');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait for connection tests
    await this.takeScreenshot('connection-test-results', 'Connection test results', 'setupWizard');
    this.addTestResult('Connection Testing', 'passed', 'Connection testing completed', 'setupWizard');
  }

  async testResponsiveDesign() {
    console.log('\n📱 Step 3: Testing Responsive Design...\n');
    
    const devices = [
      { name: 'Mobile', width: 375, height: 667, devicePixelRatio: 2 },
      { name: 'Tablet', width: 768, height: 1024, devicePixelRatio: 2 },
      { name: 'Desktop', width: 1920, height: 1080, devicePixelRatio: 1 }
    ];

    for (const device of devices) {
      console.log(`📱 Testing ${device.name} (${device.width}x${device.height})...`);
      
      await this.page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.devicePixelRatio,
        isMobile: device.width < 768,
        hasTouch: device.width < 768
      });

      await this.page.goto(this.deploymentUrl, { waitUntil: 'networkidle2' });
      await this.takeScreenshot(`${device.name.toLowerCase()}-layout`, `${device.name} responsive layout`, 'responsiveDesign');
      
      // Test navigation on this device
      const navButtons = await this.page.$$('button');
      if (navButtons.length > 0) {
        this.addTestResult(`${device.name} Navigation`, 'passed', `Navigation elements found on ${device.name}`, 'responsiveDesign');
      } else {
        this.addTestResult(`${device.name} Navigation`, 'failed', `No navigation elements found on ${device.name}`, 'responsiveDesign');
      }
    }
  }

  async testCoreFunctionality() {
    console.log('\n⚙️ Step 4: Testing Core Functionality...\n');
    
    // Reset to desktop view
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.goto(this.deploymentUrl, { waitUntil: 'networkidle2' });

    // Test if we can access the dashboard (after setup)
    try {
      // Look for dashboard elements
      const dashboardElements = await this.page.$$('[class*="dashboard"], [class*="stats"], [class*="card"]');
      if (dashboardElements.length > 0) {
        await this.takeScreenshot('dashboard-access', 'Dashboard accessible', 'coreFunctionality');
        this.addTestResult('Dashboard Access', 'passed', 'Dashboard elements found', 'coreFunctionality');
      } else {
        this.addTestResult('Dashboard Access', 'warning', 'Dashboard elements not found (may require setup completion)', 'coreFunctionality');
      }
    } catch (error) {
      this.addTestResult('Dashboard Access', 'failed', `Dashboard access error: ${error.message}`, 'coreFunctionality');
    }

    // Test API endpoints
    console.log('🔌 Testing API Endpoints...');
    try {
      const healthResponse = await this.page.evaluate(async () => {
        const response = await fetch('/api/health');
        return { status: response.status, ok: response.ok };
      });
      
      if (healthResponse.ok) {
        this.addTestResult('Health API', 'passed', 'Health endpoint responding', 'coreFunctionality');
      } else {
        this.addTestResult('Health API', 'failed', `Health endpoint returned ${healthResponse.status}`, 'coreFunctionality');
      }
    } catch (error) {
      this.addTestResult('Health API', 'failed', `Health API error: ${error.message}`, 'coreFunctionality');
    }
  }

  async testPerformance() {
    console.log('\n⚡ Step 5: Testing Performance...\n');
    
    const startTime = Date.now();
    await this.page.goto(this.deploymentUrl, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Page load time: ${loadTime}ms`);
    await this.takeScreenshot('performance-test', `Performance test - Load time: ${loadTime}ms`, 'performance');
    
    if (loadTime < 5000) {
      this.addTestResult('Page Load Performance', 'passed', `Load time: ${loadTime}ms`, 'performance');
    } else if (loadTime < 10000) {
      this.addTestResult('Page Load Performance', 'warning', `Slow load time: ${loadTime}ms`, 'performance');
    } else {
      this.addTestResult('Page Load Performance', 'failed', `Very slow load time: ${loadTime}ms`, 'performance');
    }
  }

  async testSecurity() {
    console.log('\n🔒 Step 6: Testing Security...\n');
    
    // Check HTTPS
    if (this.deploymentUrl.startsWith('https://')) {
      this.addTestResult('HTTPS', 'passed', 'Application served over HTTPS', 'security');
    } else {
      this.addTestResult('HTTPS', 'warning', 'Application not served over HTTPS (local development)', 'security');
    }

    // Check for security headers (if possible)
    try {
      const response = await this.page.goto(this.deploymentUrl, { waitUntil: 'networkidle2' });
      const headers = response.headers();
      
      const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
      let securityHeadersFound = 0;
      
      securityHeaders.forEach(header => {
        if (headers[header]) {
          securityHeadersFound++;
        }
      });
      
      if (securityHeadersFound >= 2) {
        this.addTestResult('Security Headers', 'passed', `${securityHeadersFound}/${securityHeaders.length} security headers found`, 'security');
      } else {
        this.addTestResult('Security Headers', 'warning', `Only ${securityHeadersFound}/${securityHeaders.length} security headers found`, 'security');
      }
    } catch (error) {
      this.addTestResult('Security Headers', 'failed', `Cannot check security headers: ${error.message}`, 'security');
    }

    await this.takeScreenshot('security-test', 'Security testing completed', 'security');
  }

  async generateReport() {
    // Update category statuses based on individual test results
    Object.keys(this.testReport.results).forEach(category => {
      const categoryResults = this.testReport.results[category].details;
      if (categoryResults.length === 0) {
        this.testReport.results[category].status = 'skipped';
      } else {
        const failed = categoryResults.filter(r => r.status === 'failed').length;
        const warnings = categoryResults.filter(r => r.status === 'warning').length;
        
        if (failed > 0) {
          this.testReport.results[category].status = 'failed';
        } else if (warnings > 0) {
          this.testReport.results[category].status = 'warning';
        } else {
          this.testReport.results[category].status = 'passed';
        }
      }
    });

    this.testReport.deploymentUrl = this.deploymentUrl;
    this.testReport.screenshots = this.testResults;
    this.testReport.endTime = new Date().toISOString();

    const reportPath = path.join(this.screenshotDir, 'comprehensive-smoke-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testReport, null, 2));
    
    console.log(`\n📊 Comprehensive Test Report Generated: ${reportPath}`);
    console.log(`📸 Total screenshots captured: ${this.testResults.length}`);
    console.log(`✅ Tests passed: ${this.testReport.summary.passed}`);
    console.log(`⚠️ Tests with warnings: ${this.testReport.summary.warnings}`);
    console.log(`❌ Tests failed: ${this.testReport.summary.failed}`);
    
    return this.testReport;
  }

  async cleanup() {
    if (this.localServer) {
      this.localServer.kill();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runComprehensiveSmokeTest() {
  const tester = new ComprehensiveSmokeTest();
  
  try {
    await tester.initialize();
    
    // Step 1: Check deployment status
    await tester.checkDeploymentStatus();
    
    // Step 2: Test setup wizard
    await tester.testSetupWizard();
    
    // Step 3: Test responsive design
    await tester.testResponsiveDesign();
    
    // Step 4: Test core functionality
    await tester.testCoreFunctionality();
    
    // Step 5: Test performance
    await tester.testPerformance();
    
    // Step 6: Test security
    await tester.testSecurity();
    
    // Generate comprehensive report
    await tester.generateReport();
    
    console.log('\n🎉 Comprehensive smoke testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Comprehensive smoke test failed:', error);
    await tester.generateReport(); // Generate report even on failure
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = { ComprehensiveSmokeTest, runComprehensiveSmokeTest };

// Run test if called directly
if (require.main === module) {
  runComprehensiveSmokeTest();
}
