const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import test credentials from separate file
const { getTestCredentials } = require('./test-credentials');
const TEST_CONFIG = getTestCredentials();

class AppTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.screenshots = [];
  }

  async initialize() {
    console.log('🚀 Initializing browser for testing...');
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless testing
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: { width: 1280, height: 720 }
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
      this.testResults.push({
        test: 'Page Error',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });

    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  }

  async takeScreenshot(name, fullPage = true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshot-${name}-${timestamp}.png`;
    const filepath = path.join(__dirname, 'test-screenshots', filename);
    
    // Create screenshots directory if it doesn't exist
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await this.page.screenshot({
      path: filepath,
      fullPage
    });
    
    this.screenshots.push({
      name,
      filename,
      filepath,
      timestamp
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.error(`❌ Element not found: ${selector}`);
      return false;
    }
  }

  async fillInput(selector, value, description = '') {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      await this.page.evaluate((sel) => {
        document.querySelector(sel).value = '';
      }, selector);
      await this.page.type(selector, value, { delay: 50 });
      console.log(`✅ Filled input ${description}: ${selector}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to fill input ${description}: ${selector}`, error.message);
      return false;
    }
  }

  async clickButton(selector, description = '') {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      console.log(`✅ Clicked button ${description}: ${selector}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to click button ${description}: ${selector}`, error.message);
      return false;
    }
  }

  async testPageLoad(url) {
    console.log(`\n🌐 Testing page load: ${url}`);
    
    try {
      const response = await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const status = response.status();
      const title = await this.page.title();
      
      await this.takeScreenshot('page-load');
      
      const result = {
        test: 'Page Load',
        url,
        status: status === 200 ? 'PASSED' : 'FAILED',
        httpStatus: status,
        title,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      console.log(`✅ Page loaded successfully: ${title} (${status})`);
      return true;
      
    } catch (error) {
      const result = {
        test: 'Page Load',
        url,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.testResults.push(result);
      console.error(`❌ Page load failed: ${error.message}`);
      return false;
    }
  }

  async testSetupWizardDisplay() {
    console.log(`\n🧙‍♂️ Testing Setup Wizard Display...`);

    try {
      // Wait for setup wizard to load - look for the specific CardTitle
      const setupWizardExists = await this.waitForElement('h3, [class*="card-title"], h1, h2', 10000);

      await this.takeScreenshot('setup-wizard-display');

      // Check for key elements with more specific selectors
      const elements = {
        title: await this.page.$('h3, [class*="card-title"], h1, h2'),
        setupCard: await this.page.$('[class*="card"]'),
        progressSteps: await this.page.$('[class*="flex"][class*="items-center"]'),
        databaseTab: await this.page.$('button[role="tab"], button'),
        apiTab: await this.page.$('button[role="tab"], button'),
        buttons: await this.page.$$('button')
      };

      // Get page text to verify content
      const pageText = await this.page.evaluate(() => document.body.innerText);
      const hasSetupText = pageText.includes('Student Tracking App Setup') ||
                          pageText.includes('configure your application') ||
                          pageText.includes('Database') && pageText.includes('API');

      const result = {
        test: 'Setup Wizard Display',
        status: (elements.title || hasSetupText) ? 'PASSED' : 'FAILED',
        elements: {
          title: !!elements.title,
          setupCard: !!elements.setupCard,
          progressSteps: !!elements.progressSteps,
          databaseTab: !!elements.databaseTab,
          apiTab: !!elements.apiTab,
          buttonCount: elements.buttons.length,
          hasSetupText
        },
        pagePreview: pageText.substring(0, 300),
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);

      if (elements.title || hasSetupText) {
        let titleText = 'Setup wizard content detected';
        if (elements.title) {
          titleText = await this.page.evaluate(el => el.textContent, elements.title);
        }
        console.log(`✅ Setup wizard displayed: "${titleText}"`);
        console.log(`✅ Found ${elements.buttons.length} buttons`);
        return true;
      } else {
        console.error(`❌ Setup wizard not found`);
        console.log('Page content:', pageText.substring(0, 200));
        return false;
      }

    } catch (error) {
      const result = {
        test: 'Setup Wizard Display',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      console.error(`❌ Setup wizard test failed: ${error.message}`);
      return false;
    }
  }

  async testDatabaseConfiguration() {
    console.log(`\n🗄️ Testing Database Configuration...`);

    try {
      await this.takeScreenshot('before-database-config');

      // Look for database input fields with more specific selectors
      const inputSelectors = {
        neon: [
          'input[placeholder*="neon"]',
          'input[placeholder*="postgresql"]',
          'input[name*="neon"]',
          'input[id*="neon"]',
          'input[placeholder*="connection"]'
        ],
        qdrantUrl: [
          'input[placeholder*="qdrant"]',
          'input[placeholder*="vector"]',
          'input[name*="qdrant"]',
          'input[id*="qdrant"]',
          'input[placeholder*="url"]'
        ],
        qdrantKey: [
          'input[placeholder*="api"]',
          'input[placeholder*="key"]',
          'input[name*="api"]',
          'input[id*="api"]',
          'input[type="password"]'
        ]
      };

      let success = true;
      const fieldsFound = {};

      // Try to find and fill Neon connection string
      for (const selector of inputSelectors.neon) {
        const element = await this.page.$(selector);
        if (element) {
          fieldsFound.neonInput = true;
          success &= await this.fillInput(selector, TEST_CONFIG.neonConnectionString, 'Neon Connection String');
          break;
        }
      }

      // Try to find and fill Qdrant URL
      for (const selector of inputSelectors.qdrantUrl) {
        const element = await this.page.$(selector);
        if (element) {
          fieldsFound.qdrantUrlInput = true;
          success &= await this.fillInput(selector, TEST_CONFIG.qdrantUrl, 'Qdrant URL');
          break;
        }
      }

      // Try to find and fill Qdrant API Key
      for (const selector of inputSelectors.qdrantKey) {
        const element = await this.page.$(selector);
        if (element) {
          fieldsFound.qdrantKeyInput = true;
          success &= await this.fillInput(selector, TEST_CONFIG.qdrantApiKey, 'Qdrant API Key');
          break;
        }
      }

      await this.takeScreenshot('after-database-config');

      const result = {
        test: 'Database Configuration',
        status: success && Object.keys(fieldsFound).length > 0 ? 'PASSED' : 'FAILED',
        fieldsFound,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);

      if (success && Object.keys(fieldsFound).length > 0) {
        console.log(`✅ Database configuration completed`);
      } else {
        console.error(`❌ Database configuration failed - fields found: ${Object.keys(fieldsFound).length}`);
      }

      return success;

    } catch (error) {
      const result = {
        test: 'Database Configuration',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      console.error(`❌ Database configuration test failed: ${error.message}`);
      return false;
    }
  }

  async testAPIConfiguration() {
    console.log(`\n🤖 Testing API Configuration...`);

    try {
      await this.takeScreenshot('before-api-config');

      // First try to click on API tab to access API configuration
      const allButtons = await this.page.$$('button');
      let apiTabClicked = false;

      for (const button of allButtons) {
        const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
        if (buttonText.includes('api')) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for tab to load
          apiTabClicked = true;
          console.log('✅ Clicked API tab');
          break;
        }
      }

      // Look for API configuration fields
      const apiSelectors = {
        geminiKey: [
          'input[placeholder*="gemini"]',
          'input[placeholder*="google"]',
          'input[name*="gemini"]',
          'input[id*="gemini"]',
          'input[placeholder*="API"]',
          'input[type="password"]'
        ],
        openaiKey: [
          'input[placeholder*="openai"]',
          'input[name*="openai"]',
          'input[id*="openai"]'
        ]
      };

      let success = true;
      const fieldsFound = {};

      // Try to find and fill Google Gemini API Key
      for (const selector of apiSelectors.geminiKey) {
        const element = await this.page.$(selector);
        if (element) {
          fieldsFound.geminiKey = true;
          success &= await this.fillInput(selector, TEST_CONFIG.googleGeminiApiKey, 'Google Gemini API Key');
          break;
        }
      }

      // Try to find and fill OpenAI API Key
      for (const selector of apiSelectors.openaiKey) {
        const element = await this.page.$(selector);
        if (element) {
          fieldsFound.openaiKey = true;
          success &= await this.fillInput(selector, TEST_CONFIG.openaiApiKey, 'OpenAI API Key');
          break;
        }
      }

      await this.takeScreenshot('after-api-config');

      const result = {
        test: 'API Configuration',
        status: success && Object.keys(fieldsFound).length > 0 ? 'PASSED' : 'FAILED',
        fieldsFound,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);

      if (success && Object.keys(fieldsFound).length > 0) {
        console.log(`✅ API configuration completed`);
      } else {
        console.error(`❌ API configuration failed - fields found: ${Object.keys(fieldsFound).length}`);
      }

      return success;

    } catch (error) {
      const result = {
        test: 'API Configuration',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      console.error(`❌ API configuration test failed: ${error.message}`);
      return false;
    }
  }

  async testConnectionTesting() {
    console.log(`\n🔗 Testing Connection Testing...`);

    try {
      await this.takeScreenshot('before-connection-test');

      // Look for test connection buttons
      const testButtons = await this.page.$$('button');
      let testButtonFound = false;

      for (const button of testButtons) {
        const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
        if (buttonText.includes('test') || buttonText.includes('connect') || buttonText.includes('verify')) {
          testButtonFound = true;
          await button.click();
          console.log(`✅ Clicked test button: "${buttonText}"`);

          // Wait for test results
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      }

      await this.takeScreenshot('after-connection-test');

      const result = {
        test: 'Connection Testing',
        status: testButtonFound ? 'PASSED' : 'FAILED',
        testButtonFound,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);

      if (testButtonFound) {
        console.log(`✅ Connection testing completed`);
      } else {
        console.error(`❌ No test connection button found`);
      }

      return testButtonFound;

    } catch (error) {
      const result = {
        test: 'Connection Testing',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      console.error(`❌ Connection testing failed: ${error.message}`);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async generateReport() {
    const report = {
      testSuite: 'Student Tracking App Functionality Test',
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'PASSED').length,
        failed: this.testResults.filter(r => r.status === 'FAILED').length
      },
      results: this.testResults,
      screenshots: this.screenshots,
      configuration: {
        appUrl: TEST_CONFIG.appUrl,
        testEnvironment: 'production'
      }
    };
    
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Test Report Generated: ${reportPath}`);
    console.log(`📈 Summary: ${report.summary.passed}/${report.summary.total} tests passed`);
    
    return report;
  }
}

// Main test execution
async function runTests() {
  const tester = new AppTester();

  try {
    console.log('🎯 Starting Student Tracking App Functionality Tests...\n');

    await tester.initialize();

    // Test sequence
    console.log('📋 Test Plan:');
    console.log('1. Page Load Test');
    console.log('2. Setup Wizard Display Test');
    console.log('3. Database Configuration Test');
    console.log('4. API Configuration Test');
    console.log('5. Connection Testing Test\n');

    await tester.testPageLoad(TEST_CONFIG.appUrl);
    await tester.testSetupWizardDisplay();
    await tester.testDatabaseConfiguration();
    await tester.testAPIConfiguration();
    await tester.testConnectionTesting();

    // Generate final report
    const report = await tester.generateReport();

    console.log('\n🎉 Testing completed!');
    console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} tests passed`);

    if (report.summary.failed > 0) {
      console.log('\n❌ Failed tests:');
      report.results.filter(r => r.status === 'FAILED').forEach(test => {
        console.log(`   - ${test.test}: ${test.error || 'Unknown error'}`);
      });
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = { AppTester, TEST_CONFIG, runTests };

// Run tests if called directly
if (require.main === module) {
  runTests();
}
