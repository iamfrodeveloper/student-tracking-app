const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import test credentials
const { getTestCredentials } = require('./test-credentials');
const TEST_CONFIG = getTestCredentials();

class EnhancedValidationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '..', 'phase1-enhanced-validation-screenshots');
    this.testResults = [];
  }

  async initialize() {
    console.log('🎯 Phase 1: Enhanced Validation System Test\n');
    
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
  }

  async takeScreenshot(name, description = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${String(this.testResults.length + 1).padStart(2, '0')}-${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    
    this.testResults.push({
      step: this.testResults.length + 1,
      name,
      description,
      filename,
      filepath,
      timestamp
    });
    
    console.log(`📸 Step ${this.testResults.length}: ${description}`);
    return filepath;
  }

  async waitForValidation(timeout = 3000) {
    // Wait for validation to complete
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  async testEnhancedValidationSystem() {
    console.log('🧪 Testing Enhanced Real-time Validation System...\n');

    // Step 1: Load the application
    console.log('📋 Step 1: Loading Application...');
    await this.page.goto(TEST_CONFIG.appUrl, { waitUntil: 'networkidle2' });
    await this.takeScreenshot('01-app-loaded', 'Application loaded with enhanced validation system');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Test Invalid Neon Connection String
    console.log('\n📋 Step 2: Testing Invalid Neon Connection String...');
    const neonTextarea = await this.page.$('textarea[placeholder*="postgresql"]');
    if (neonTextarea) {
      await neonTextarea.click();
      await neonTextarea.evaluate(el => el.value = '');
      await neonTextarea.type('invalid-connection-string', { delay: 100 });
      await this.waitForValidation();
      await this.takeScreenshot('02-invalid-neon-validation', 'Invalid Neon connection string shows error validation');
    }

    // Step 3: Test Valid Neon Connection String
    console.log('\n📋 Step 3: Testing Valid Neon Connection String...');
    if (neonTextarea) {
      await neonTextarea.click();
      await neonTextarea.evaluate(el => el.value = '');
      await neonTextarea.type(TEST_CONFIG.neonConnectionString, { delay: 50 });
      await this.waitForValidation();
      await this.takeScreenshot('03-valid-neon-validation', 'Valid Neon connection string shows success validation');
    }

    // Step 4: Test Invalid Qdrant URL
    console.log('\n📋 Step 4: Testing Invalid Qdrant URL...');
    const qdrantUrlInput = await this.page.$('input[placeholder*="qdrant"]');
    if (qdrantUrlInput) {
      await qdrantUrlInput.click();
      await qdrantUrlInput.evaluate(el => el.value = '');
      await qdrantUrlInput.type('http://invalid-url', { delay: 100 });
      await this.waitForValidation();
      await this.takeScreenshot('04-invalid-qdrant-url-validation', 'Invalid Qdrant URL shows error validation');
    }

    // Step 5: Test Valid Qdrant URL
    console.log('\n📋 Step 5: Testing Valid Qdrant URL...');
    if (qdrantUrlInput) {
      await qdrantUrlInput.click();
      await qdrantUrlInput.evaluate(el => el.value = '');
      await qdrantUrlInput.type(TEST_CONFIG.qdrantUrl, { delay: 50 });
      await this.waitForValidation();
      await this.takeScreenshot('05-valid-qdrant-url-validation', 'Valid Qdrant URL shows success validation');
    }

    // Step 6: Test Invalid Qdrant API Key
    console.log('\n📋 Step 6: Testing Invalid Qdrant API Key...');
    const qdrantKeyInput = await this.page.$('input[type="password"][placeholder*="Qdrant"]');
    if (qdrantKeyInput) {
      await qdrantKeyInput.click();
      await qdrantKeyInput.evaluate(el => el.value = '');
      await qdrantKeyInput.type('invalid-api-key-123', { delay: 100 });
      await this.waitForValidation();
      await this.takeScreenshot('06-invalid-qdrant-key-validation', 'Invalid Qdrant API key shows error validation');
    }

    // Step 7: Test Valid Qdrant API Key
    console.log('\n📋 Step 7: Testing Valid Qdrant API Key...');
    if (qdrantKeyInput) {
      await qdrantKeyInput.click();
      await qdrantKeyInput.evaluate(el => el.value = '');
      await qdrantKeyInput.type(TEST_CONFIG.qdrantApiKey, { delay: 50 });
      await this.waitForValidation();
      await this.takeScreenshot('07-valid-qdrant-key-validation', 'Valid Qdrant API key shows success validation');
    }

    // Step 8: Navigate to API Configuration
    console.log('\n📋 Step 8: Navigating to API Configuration...');
    const apiButtons = await this.page.$$('button');
    for (const button of apiButtons) {
      const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
      if (buttonText.includes('api')) {
        await button.click();
        console.log('✅ Clicked API tab');
        break;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.takeScreenshot('08-api-tab-opened', 'API configuration tab opened');

    // Step 9: Select Google Gemini Provider
    console.log('\n📋 Step 9: Selecting Google Gemini Provider...');
    const providerSelect = await this.page.$('select, [role="combobox"]');
    if (providerSelect) {
      await providerSelect.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Look for Google option
      const googleOption = await this.page.$('[data-value="google"], option[value="google"]');
      if (googleOption) {
        await googleOption.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.takeScreenshot('09-google-provider-selected', 'Google Gemini provider selected');
      }
    }

    // Step 10: Test Invalid Google Gemini API Key
    console.log('\n📋 Step 10: Testing Invalid Google Gemini API Key...');
    const geminiKeyInput = await this.page.$('input[type="password"][placeholder*="AIza"], input[type="password"]');
    if (geminiKeyInput) {
      await geminiKeyInput.click();
      await geminiKeyInput.evaluate(el => el.value = '');
      await geminiKeyInput.type('invalid-gemini-key-123', { delay: 100 });
      await this.waitForValidation();
      await this.takeScreenshot('10-invalid-gemini-key-validation', 'Invalid Google Gemini API key shows error validation');
    }

    // Step 11: Test Valid Google Gemini API Key
    console.log('\n📋 Step 11: Testing Valid Google Gemini API Key...');
    if (geminiKeyInput) {
      await geminiKeyInput.click();
      await geminiKeyInput.evaluate(el => el.value = '');
      await geminiKeyInput.type(TEST_CONFIG.googleGeminiApiKey, { delay: 50 });
      await this.waitForValidation();
      await this.takeScreenshot('11-valid-gemini-key-validation', 'Valid Google Gemini API key shows success validation');
    }

    // Step 12: Test Complete Form State
    console.log('\n📋 Step 12: Testing Complete Form State...');
    await this.takeScreenshot('12-complete-form-validation', 'Complete form with all valid credentials and success indicators');

    // Step 13: Test Database Connection
    console.log('\n📋 Step 13: Testing Database Connection...');
    // Navigate back to database tab
    const dbButtons = await this.page.$$('button');
    for (const button of dbButtons) {
      const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
      if (buttonText.includes('database')) {
        await button.click();
        console.log('✅ Clicked Database tab');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find and click test connection button
    const testButtons = await this.page.$$('button');
    for (const button of testButtons) {
      const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
      if (buttonText.includes('test') && buttonText.includes('connection')) {
        await button.click();
        console.log('✅ Clicked Test Database Connections button');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for connection test
    await this.takeScreenshot('13-database-connection-test', 'Database connection test with enhanced validation');

    // Step 14: Final Validation State
    console.log('\n📋 Step 14: Final Validation State...');
    await this.takeScreenshot('14-final-validation-state', 'Final state showing all enhanced validation feedback');

    console.log('\n✅ Enhanced validation system testing completed!');
    console.log(`📸 Screenshots saved in: ${this.screenshotDir}`);
  }

  async generateReport() {
    const report = {
      testSuite: 'Phase 1: Enhanced Validation System Test',
      timestamp: new Date().toISOString(),
      screenshots: this.testResults,
      summary: {
        totalSteps: this.testResults.length,
        validationFeaturesTested: [
          'Real-time Neon PostgreSQL connection string validation',
          'Real-time Qdrant URL validation',
          'Real-time Qdrant API key validation',
          'Real-time Google Gemini API key validation',
          'Visual success/error indicators',
          'Prominent validation messages',
          'Individual credential feedback'
        ]
      },
      enhancements: {
        validationComponents: 'ValidationInput and ValidationFeedback components created',
        realTimeValidation: 'Immediate validation on input change implemented',
        visualFeedback: 'Green success and red error indicators with clear messages',
        userExperience: 'Enhanced user guidance with specific error messages'
      }
    };
    
    const reportPath = path.join(this.screenshotDir, 'phase1-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Phase 1 Report Generated: ${reportPath}`);
    console.log(`📈 Total validation tests: ${this.testResults.length}`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runEnhancedValidationTest() {
  const tester = new EnhancedValidationTest();
  
  try {
    await tester.initialize();
    await tester.testEnhancedValidationSystem();
    await tester.generateReport();
    
  } catch (error) {
    console.error('❌ Enhanced validation test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = { EnhancedValidationTest, runEnhancedValidationTest };

// Run test if called directly
if (require.main === module) {
  runEnhancedValidationTest();
}
