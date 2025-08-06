const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import test credentials
const { getTestCredentials } = require('./test-credentials');
const TEST_CONFIG = getTestCredentials();

class CredentialValidationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '..', 'credential-validation-screenshots');
  }

  async initialize() {
    console.log('🔐 Credential Validation Test - Individual Feedback Verification\n');
    
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
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    console.log(`📸 ${description}: ${filename}`);
    return filepath;
  }

  async testIndividualCredentialValidation() {
    console.log('🧪 Testing Individual Credential Validation Feedback...\n');

    // Load the application
    await this.page.goto(TEST_CONFIG.appUrl, { waitUntil: 'networkidle2' });
    await this.takeScreenshot('01-app-loaded', 'Application loaded');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Test with INVALID Neon credentials first
    console.log('\n📋 Test 1: Invalid Neon Credentials...');
    const neonInput = await this.page.$('textarea[placeholder*="postgresql"], textarea[id*="neon"]');
    if (neonInput) {
      await neonInput.click();
      await neonInput.evaluate(el => el.value = '');
      await neonInput.type('postgresql://invalid:invalid@invalid.neon.tech/invalid', { delay: 50 });
      await this.takeScreenshot('02-invalid-neon-entered', 'Invalid Neon credentials entered');
      
      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.takeScreenshot('03-neon-validation-result', 'Neon validation result');
      
      // Check for validation messages
      const validationMessages = await this.page.evaluate(() => {
        const messages = [];
        
        // Look for validation elements
        const validationElements = document.querySelectorAll('[class*="bg-red"], [class*="bg-green"], [class*="text-red"], [class*="text-green"], .text-red-700, .text-green-700');
        validationElements.forEach(el => {
          if (el.textContent.trim()) {
            messages.push({
              type: el.className.includes('red') ? 'error' : 'success',
              text: el.textContent.trim(),
              className: el.className
            });
          }
        });
        
        return messages;
      });
      
      console.log('Neon Validation Messages Found:', validationMessages);
    }

    // Test 2: Test with VALID Neon credentials
    console.log('\n📋 Test 2: Valid Neon Credentials...');
    if (neonInput) {
      await neonInput.click();
      await neonInput.evaluate(el => el.value = '');
      await neonInput.type(TEST_CONFIG.neonConnectionString, { delay: 30 });
      await this.takeScreenshot('04-valid-neon-entered', 'Valid Neon credentials entered');
      
      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 3000));
      await this.takeScreenshot('05-neon-validation-success', 'Neon validation success');
    }

    // Test 3: Test Qdrant URL validation
    console.log('\n📋 Test 3: Qdrant URL Validation...');
    const qdrantUrlInput = await this.page.$('input[placeholder*="qdrant"], input[placeholder*="url"]');
    if (qdrantUrlInput) {
      // Test invalid URL first
      await qdrantUrlInput.click();
      await qdrantUrlInput.evaluate(el => el.value = '');
      await qdrantUrlInput.type('https://invalid-qdrant-url.com', { delay: 50 });
      await this.takeScreenshot('06-invalid-qdrant-url', 'Invalid Qdrant URL entered');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test valid URL
      await qdrantUrlInput.click();
      await qdrantUrlInput.evaluate(el => el.value = '');
      await qdrantUrlInput.type(TEST_CONFIG.qdrantUrl, { delay: 30 });
      await this.takeScreenshot('07-valid-qdrant-url', 'Valid Qdrant URL entered');
    }

    // Test 4: Test Qdrant API Key validation
    console.log('\n📋 Test 4: Qdrant API Key Validation...');
    const qdrantKeyInput = await this.page.$('input[type="password"], input[placeholder*="api"], input[placeholder*="key"]');
    if (qdrantKeyInput) {
      // Test invalid key first
      await qdrantKeyInput.click();
      await qdrantKeyInput.evaluate(el => el.value = '');
      await qdrantKeyInput.type('invalid-api-key-12345', { delay: 50 });
      await this.takeScreenshot('08-invalid-qdrant-key', 'Invalid Qdrant API key entered');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test valid key
      await qdrantKeyInput.click();
      await qdrantKeyInput.evaluate(el => el.value = '');
      await qdrantKeyInput.type(TEST_CONFIG.qdrantApiKey, { delay: 30 });
      await this.takeScreenshot('09-valid-qdrant-key', 'Valid Qdrant API key entered');
    }

    // Test 5: Test Database Connection Button
    console.log('\n📋 Test 5: Database Connection Testing...');

    // Look for any button with "test" in the text
    const allButtons = await this.page.$$('button');
    let testButtonFound = false;

    for (const button of allButtons) {
      const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
      if (buttonText.includes('test') && (buttonText.includes('connection') || buttonText.includes('database'))) {
        await button.click();
        console.log('✅ Clicked Test Database Connections button');
        testButtonFound = true;
        break;
      }
    }

    if (!testButtonFound) {
      console.log('⚠️ Test button not found, checking all buttons...');
      for (const button of allButtons) {
        const buttonText = await this.page.evaluate(el => el.textContent, button);
        console.log(`Button found: "${buttonText}"`);
      }
    }
    
    await this.takeScreenshot('10-test-button-clicked', 'Test connections button clicked');
    
    // Wait for test results
    await new Promise(resolve => setTimeout(resolve, 8000));
    await this.takeScreenshot('11-test-results', 'Database connection test results');

    // Check for detailed validation messages
    const finalValidationCheck = await this.page.evaluate(() => {
      const results = {
        neonMessages: [],
        qdrantMessages: [],
        generalMessages: []
      };
      
      // Look for all validation-related elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent?.trim();
        const className = el.className;
        
        if (text && (className.includes('bg-red') || className.includes('bg-green') || 
                    className.includes('text-red') || className.includes('text-green') ||
                    text.includes('success') || text.includes('error') || 
                    text.includes('connected') || text.includes('failed'))) {
          
          const message = {
            text,
            className,
            type: (className.includes('red') || text.toLowerCase().includes('error') || text.toLowerCase().includes('failed')) ? 'error' : 'success'
          };
          
          if (text.toLowerCase().includes('neon') || text.toLowerCase().includes('postgresql')) {
            results.neonMessages.push(message);
          } else if (text.toLowerCase().includes('qdrant') || text.toLowerCase().includes('vector')) {
            results.qdrantMessages.push(message);
          } else {
            results.generalMessages.push(message);
          }
        }
      });
      
      return results;
    });
    
    console.log('\n📊 Final Validation Messages Analysis:');
    console.log('Neon Messages:', finalValidationCheck.neonMessages);
    console.log('Qdrant Messages:', finalValidationCheck.qdrantMessages);
    console.log('General Messages:', finalValidationCheck.generalMessages);

    // Test 6: Navigate to API tab and test Gemini validation
    console.log('\n📋 Test 6: API Configuration Validation...');
    
    // Click API tab
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
    await this.takeScreenshot('12-api-tab-opened', 'API configuration tab opened');

    // Test Gemini API key validation
    const geminiInput = await this.page.$('input[placeholder*="API"], input[type="password"]');
    if (geminiInput) {
      // Test invalid key
      await geminiInput.click();
      await geminiInput.evaluate(el => el.value = '');
      await geminiInput.type('invalid-gemini-key-12345', { delay: 50 });
      await this.takeScreenshot('13-invalid-gemini-key', 'Invalid Gemini API key entered');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test valid key
      await geminiInput.click();
      await geminiInput.evaluate(el => el.value = '');
      await geminiInput.type(TEST_CONFIG.googleGeminiApiKey, { delay: 30 });
      await this.takeScreenshot('14-valid-gemini-key', 'Valid Gemini API key entered');
    }

    await this.takeScreenshot('15-final-validation-state', 'Final validation state');

    console.log('\n✅ Credential validation testing completed!');
    console.log(`📸 Screenshots saved in: ${this.screenshotDir}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runCredentialValidationTest() {
  const tester = new CredentialValidationTest();
  
  try {
    await tester.initialize();
    await tester.testIndividualCredentialValidation();
    
  } catch (error) {
    console.error('❌ Credential validation test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = { CredentialValidationTest, runCredentialValidationTest };

// Run test if called directly
if (require.main === module) {
  runCredentialValidationTest();
}
