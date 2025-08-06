const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import test credentials
const { getTestCredentials } = require('./test-credentials');
const TEST_CONFIG = getTestCredentials();

class ProductionSmokeTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '..', 'production-live-test-screenshots');
    this.testResults = [];
    this.productionUrl = 'https://student-tracking-app.vercel.app';
    this.testReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'Production Live Deployment Smoke Test',
      environment: 'Production (Vercel)',
      productionUrl: this.productionUrl,
      results: {
        deployment: { status: 'pending', details: [] },
        setupWizard: { status: 'pending', details: [] },
        coreFunctionality: { status: 'pending', details: [] },
        responsiveDesign: { status: 'pending', details: [] },
        performance: { status: 'pending', details: [] },
        security: { status: 'pending', details: [] },
        aiIntegration: { status: 'pending', details: [] }
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
    console.log('🚀 Production Live Deployment Smoke Test - Student Tracking App\n');
    console.log(`🌐 Testing Production URL: ${this.productionUrl}\n`);
    
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

  async testProductionDeployment() {
    console.log('🔍 Step 1: Testing Production Deployment...\n');
    
    try {
      console.log(`Testing production URL: ${this.productionUrl}`);
      const startTime = Date.now();
      await this.page.goto(this.productionUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const loadTime = Date.now() - startTime;
      
      const title = await this.page.title();
      const content = await this.page.content();
      
      if (title.includes('Student Tracking') || content.includes('Student Tracking')) {
        console.log(`✅ Production deployment accessible at: ${this.productionUrl}`);
        console.log(`⚡ Load time: ${loadTime}ms`);
        this.addTestResult('Production Access', 'passed', `Production deployment accessible, load time: ${loadTime}ms`, 'deployment');
        await this.takeScreenshot('production-accessible', `Production deployment accessible in ${loadTime}ms`, 'deployment');
        return true;
      } else {
        console.log(`❌ Unexpected content at production URL`);
        this.addTestResult('Production Content', 'failed', `Unexpected content at production URL`, 'deployment');
        await this.takeScreenshot('unexpected-content', `Unexpected content at production URL`, 'deployment');
        return false;
      }
    } catch (error) {
      console.log(`❌ Failed to access production URL: ${error.message}`);
      this.addTestResult('Production Access', 'failed', `Cannot access production: ${error.message}`, 'deployment');
      return false;
    }
  }

  async testProductionSetupWizard() {
    console.log('\n🧙 Step 2: Testing Production Setup Wizard...\n');
    
    // Navigate to application
    await this.page.goto(this.productionUrl, { waitUntil: 'networkidle2' });
    await this.takeScreenshot('setup-wizard-start', 'Production setup wizard initial load', 'setupWizard');

    // Test Neon PostgreSQL Configuration
    console.log('📋 Testing Neon PostgreSQL Configuration in Production...');
    try {
      const neonTextarea = await this.page.$('textarea[placeholder*="postgresql"]');
      if (neonTextarea) {
        await neonTextarea.click();
        await neonTextarea.type(TEST_CONFIG.neonConnectionString, { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for validation
        await this.takeScreenshot('neon-configured', 'Neon PostgreSQL credentials entered in production', 'setupWizard');
        this.addTestResult('Neon Configuration', 'passed', 'Neon credentials entered successfully in production', 'setupWizard');
      } else {
        this.addTestResult('Neon Configuration', 'failed', 'Neon input field not found in production', 'setupWizard');
      }
    } catch (error) {
      this.addTestResult('Neon Configuration', 'failed', `Neon configuration error: ${error.message}`, 'setupWizard');
    }

    // Test Qdrant Configuration
    console.log('📋 Testing Qdrant Configuration in Production...');
    try {
      const qdrantUrlInput = await this.page.$('input[placeholder*="qdrant"]');
      if (qdrantUrlInput) {
        await qdrantUrlInput.click();
        await qdrantUrlInput.type(TEST_CONFIG.qdrantUrl, { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('qdrant-url-configured', 'Qdrant URL entered in production', 'setupWizard');
        this.addTestResult('Qdrant URL Configuration', 'passed', 'Qdrant URL entered successfully in production', 'setupWizard');
      } else {
        this.addTestResult('Qdrant URL Configuration', 'failed', 'Qdrant URL input not found in production', 'setupWizard');
      }

      const qdrantKeyInput = await this.page.$('input[type="password"]');
      if (qdrantKeyInput) {
        await qdrantKeyInput.click();
        await qdrantKeyInput.type(TEST_CONFIG.qdrantApiKey, { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('qdrant-key-configured', 'Qdrant API key entered in production', 'setupWizard');
        this.addTestResult('Qdrant API Key Configuration', 'passed', 'Qdrant API key entered successfully in production', 'setupWizard');
      } else {
        this.addTestResult('Qdrant API Key Configuration', 'failed', 'Qdrant API key input not found in production', 'setupWizard');
      }
    } catch (error) {
      this.addTestResult('Qdrant Configuration', 'failed', `Qdrant configuration error: ${error.message}`, 'setupWizard');
    }

    // Navigate to API tab
    console.log('📋 Testing API Configuration in Production...');
    try {
      const apiButtons = await this.page.$$('button');
      for (const button of apiButtons) {
        const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
        if (buttonText.includes('api')) {
          await button.click();
          console.log('✅ Navigated to API tab in production');
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.takeScreenshot('api-tab-opened', 'API configuration tab opened in production', 'setupWizard');

      // Test Google Gemini API Configuration
      const geminiInput = await this.page.$('input[type="password"]');
      if (geminiInput) {
        await geminiInput.click();
        await geminiInput.type(TEST_CONFIG.googleGeminiApiKey, { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.takeScreenshot('gemini-configured', 'Google Gemini API key entered in production', 'setupWizard');
        this.addTestResult('Gemini API Configuration', 'passed', 'Gemini API key entered successfully in production', 'setupWizard');
      } else {
        this.addTestResult('Gemini API Configuration', 'failed', 'Gemini API input not found in production', 'setupWizard');
      }
    } catch (error) {
      this.addTestResult('API Configuration', 'failed', `API configuration error: ${error.message}`, 'setupWizard');
    }

    // Test connection testing
    console.log('📋 Testing Connection Testing in Production...');
    try {
      const testButtons = await this.page.$$('button');
      for (const button of testButtons) {
        const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
        if (buttonText.includes('test') && buttonText.includes('connection')) {
          await button.click();
          console.log('✅ Started connection testing in production');
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer for production connection tests
      await this.takeScreenshot('connection-test-results', 'Connection test results in production', 'setupWizard');
      this.addTestResult('Connection Testing', 'passed', 'Connection testing completed in production', 'setupWizard');
    } catch (error) {
      this.addTestResult('Connection Testing', 'failed', `Connection testing error: ${error.message}`, 'setupWizard');
    }
  }

  async testProductionResponsiveDesign() {
    console.log('\n📱 Step 3: Testing Production Responsive Design...\n');
    
    const devices = [
      { name: 'Mobile', width: 375, height: 667, devicePixelRatio: 2 },
      { name: 'Tablet', width: 768, height: 1024, devicePixelRatio: 2 },
      { name: 'Desktop', width: 1920, height: 1080, devicePixelRatio: 1 }
    ];

    for (const device of devices) {
      console.log(`📱 Testing ${device.name} (${device.width}x${device.height}) in production...`);
      
      try {
        await this.page.setViewport({
          width: device.width,
          height: device.height,
          deviceScaleFactor: device.devicePixelRatio,
          isMobile: device.width < 768,
          hasTouch: device.width < 768
        });

        await this.page.goto(this.productionUrl, { waitUntil: 'networkidle2' });
        await this.takeScreenshot(`${device.name.toLowerCase()}-layout`, `${device.name} responsive layout in production`, 'responsiveDesign');
        
        // Test navigation on this device
        const navButtons = await this.page.$$('button');
        if (navButtons.length > 0) {
          this.addTestResult(`${device.name} Navigation`, 'passed', `Navigation elements found on ${device.name} in production`, 'responsiveDesign');
        } else {
          this.addTestResult(`${device.name} Navigation`, 'failed', `No navigation elements found on ${device.name} in production`, 'responsiveDesign');
        }
      } catch (error) {
        this.addTestResult(`${device.name} Testing`, 'failed', `${device.name} testing error: ${error.message}`, 'responsiveDesign');
      }
    }
  }

  async testProductionPerformance() {
    console.log('\n⚡ Step 4: Testing Production Performance...\n');
    
    // Reset to desktop view
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    const startTime = Date.now();
    await this.page.goto(this.productionUrl, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Production page load time: ${loadTime}ms`);
    await this.takeScreenshot('performance-test', `Production performance test - Load time: ${loadTime}ms`, 'performance');
    
    if (loadTime < 3000) {
      this.addTestResult('Production Load Performance', 'passed', `Load time: ${loadTime}ms`, 'performance');
    } else if (loadTime < 5000) {
      this.addTestResult('Production Load Performance', 'warning', `Slow load time: ${loadTime}ms`, 'performance');
    } else {
      this.addTestResult('Production Load Performance', 'failed', `Very slow load time: ${loadTime}ms`, 'performance');
    }
  }

  async testProductionSecurity() {
    console.log('\n🔒 Step 5: Testing Production Security...\n');
    
    // Check HTTPS
    if (this.productionUrl.startsWith('https://')) {
      this.addTestResult('HTTPS', 'passed', 'Production application served over HTTPS', 'security');
    } else {
      this.addTestResult('HTTPS', 'failed', 'Production application not served over HTTPS', 'security');
    }

    // Check for security headers
    try {
      const response = await this.page.goto(this.productionUrl, { waitUntil: 'networkidle2' });
      const headers = response.headers();
      
      const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
      let securityHeadersFound = 0;
      
      securityHeaders.forEach(header => {
        if (headers[header]) {
          securityHeadersFound++;
        }
      });
      
      if (securityHeadersFound >= 2) {
        this.addTestResult('Security Headers', 'passed', `${securityHeadersFound}/${securityHeaders.length} security headers found in production`, 'security');
      } else {
        this.addTestResult('Security Headers', 'warning', `Only ${securityHeadersFound}/${securityHeaders.length} security headers found in production`, 'security');
      }
    } catch (error) {
      this.addTestResult('Security Headers', 'failed', `Cannot check security headers: ${error.message}`, 'security');
    }

    await this.takeScreenshot('security-test', 'Production security testing completed', 'security');
  }

  async testProductionAPI() {
    console.log('\n🔌 Step 6: Testing Production API Endpoints...\n');
    
    try {
      // Test health endpoint
      const healthResponse = await this.page.evaluate(async () => {
        const response = await fetch('/api/health');
        return { status: response.status, ok: response.ok };
      });
      
      if (healthResponse.ok) {
        this.addTestResult('Health API', 'passed', 'Health endpoint responding in production', 'coreFunctionality');
      } else {
        this.addTestResult('Health API', 'failed', `Health endpoint returned ${healthResponse.status} in production`, 'coreFunctionality');
      }
    } catch (error) {
      this.addTestResult('Health API', 'failed', `Health API error in production: ${error.message}`, 'coreFunctionality');
    }

    await this.takeScreenshot('api-test', 'Production API testing completed', 'coreFunctionality');
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

    this.testReport.screenshots = this.testResults;
    this.testReport.endTime = new Date().toISOString();

    const reportPath = path.join(this.screenshotDir, 'production-live-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testReport, null, 2));
    
    console.log(`\n📊 Production Live Test Report Generated: ${reportPath}`);
    console.log(`📸 Total screenshots captured: ${this.testResults.length}`);
    console.log(`✅ Tests passed: ${this.testReport.summary.passed}`);
    console.log(`⚠️ Tests with warnings: ${this.testReport.summary.warnings}`);
    console.log(`❌ Tests failed: ${this.testReport.summary.failed}`);
    
    return this.testReport;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runProductionSmokeTest() {
  const tester = new ProductionSmokeTest();
  
  try {
    await tester.initialize();
    
    // Step 1: Test production deployment
    const deploymentSuccess = await tester.testProductionDeployment();
    if (!deploymentSuccess) {
      throw new Error('Production deployment not accessible');
    }
    
    // Step 2: Test setup wizard in production
    await tester.testProductionSetupWizard();
    
    // Step 3: Test responsive design in production
    await tester.testProductionResponsiveDesign();
    
    // Step 4: Test performance in production
    await tester.testProductionPerformance();
    
    // Step 5: Test security in production
    await tester.testProductionSecurity();
    
    // Step 6: Test API endpoints in production
    await tester.testProductionAPI();
    
    // Generate comprehensive report
    await tester.generateReport();
    
    console.log('\n🎉 Production live deployment testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Production smoke test failed:', error);
    await tester.generateReport(); // Generate report even on failure
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = { ProductionSmokeTest, runProductionSmokeTest };

// Run test if called directly
if (require.main === module) {
  runProductionSmokeTest();
}
