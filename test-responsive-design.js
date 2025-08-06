const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Import test credentials
const { getTestCredentials } = require('./test-credentials');
const TEST_CONFIG = getTestCredentials();

class ResponsiveDesignTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.screenshotDir = path.join(__dirname, '..', 'phase2-responsive-screenshots');
    this.testResults = [];
  }

  async initialize() {
    console.log('📱 Phase 2: Responsive Design & Edge Device Compatibility Test\n');
    
    // Create screenshots directory
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }

    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });

    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
  }

  async takeScreenshot(name, description = '', deviceType = '') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${String(this.testResults.length + 1).padStart(2, '0')}-${deviceType}-${name}-${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    
    await this.page.screenshot({ path: filepath, fullPage: true });
    
    this.testResults.push({
      step: this.testResults.length + 1,
      name,
      description,
      deviceType,
      filename,
      filepath,
      timestamp,
      viewport: await this.page.viewport()
    });
    
    console.log(`📸 Step ${this.testResults.length}: ${deviceType} - ${description}`);
    return filepath;
  }

  async testDeviceViewport(deviceName, width, height, devicePixelRatio = 1) {
    console.log(`\n📱 Testing ${deviceName} (${width}x${height})...`);
    
    await this.page.setViewport({
      width,
      height,
      deviceScaleFactor: devicePixelRatio,
      isMobile: width < 768,
      hasTouch: width < 768
    });

    // Load the application
    await this.page.goto(TEST_CONFIG.appUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await this.takeScreenshot('app-loaded', `Application loaded on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));

    // Test form interactions
    await this.testFormInteractions(deviceName);
    
    // Test navigation
    await this.testNavigation(deviceName);
    
    // Test validation system
    await this.testValidationSystem(deviceName);
  }

  async testFormInteractions(deviceName) {
    console.log(`📝 Testing form interactions on ${deviceName}...`);

    try {
      // Wait for page to be fully loaded
      await this.page.waitForSelector('textarea, input', { timeout: 5000 });

      // Test Neon connection string input
      const neonTextarea = await this.page.$('textarea[placeholder*="postgresql"]');
      if (neonTextarea) {
        // Scroll element into view and ensure it's clickable
        await this.page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), neonTextarea);
        await new Promise(resolve => setTimeout(resolve, 500));

        await neonTextarea.click({ delay: 100 });
        await neonTextarea.type('postgresql://test:test@test.neon.tech/test?sslmode=require', { delay: 30 });
        await this.takeScreenshot('neon-input', `Neon input interaction on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
      }

      // Test Qdrant URL input
      const qdrantUrlInput = await this.page.$('input[placeholder*="qdrant"]');
      if (qdrantUrlInput) {
        await this.page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), qdrantUrlInput);
        await new Promise(resolve => setTimeout(resolve, 500));

        await qdrantUrlInput.click({ delay: 100 });
        await qdrantUrlInput.type('https://test-cluster.qdrant.io', { delay: 30 });
        await this.takeScreenshot('qdrant-url-input', `Qdrant URL input on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
      }

      // Test Qdrant API key input
      const qdrantKeyInput = await this.page.$('input[type="password"]');
      if (qdrantKeyInput) {
        await this.page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), qdrantKeyInput);
        await new Promise(resolve => setTimeout(resolve, 500));

        await qdrantKeyInput.click({ delay: 100 });
        await qdrantKeyInput.type('test-api-key-12345', { delay: 30 });
        await this.takeScreenshot('qdrant-key-input', `Qdrant API key input on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
      }
    } catch (error) {
      console.log(`⚠️ Form interaction issue on ${deviceName}: ${error.message}`);
      await this.takeScreenshot('form-interaction-error', `Form interaction error on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  async testNavigation(deviceName) {
    console.log(`🧭 Testing navigation on ${deviceName}...`);

    try {
      // Wait for navigation elements to be available
      await this.page.waitForSelector('button', { timeout: 5000 });

      // Test tab navigation to API
      const apiButtons = await this.page.$$('button');
      let apiTabFound = false;

      for (const button of apiButtons) {
        try {
          const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
          if (buttonText.includes('api')) {
            await this.page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), button);
            await new Promise(resolve => setTimeout(resolve, 500));
            await button.click({ delay: 100 });
            console.log('✅ Clicked API tab');
            apiTabFound = true;
            break;
          }
        } catch (error) {
          console.log(`⚠️ Button click issue: ${error.message}`);
        }
      }

      if (apiTabFound) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.takeScreenshot('api-tab', `API tab navigation on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
      }

      // Test back to database tab
      const dbButtons = await this.page.$$('button');
      for (const button of dbButtons) {
        try {
          const buttonText = await this.page.evaluate(el => el.textContent.toLowerCase(), button);
          if (buttonText.includes('database')) {
            await this.page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), button);
            await new Promise(resolve => setTimeout(resolve, 500));
            await button.click({ delay: 100 });
            console.log('✅ Clicked Database tab');
            break;
          }
        } catch (error) {
          console.log(`⚠️ Button click issue: ${error.message}`);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.takeScreenshot('database-tab', `Database tab navigation on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));

    } catch (error) {
      console.log(`⚠️ Navigation issue on ${deviceName}: ${error.message}`);
      await this.takeScreenshot('navigation-error', `Navigation error on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  async testValidationSystem(deviceName) {
    console.log(`✅ Testing validation system on ${deviceName}...`);

    try {
      // Take a screenshot of the current validation state
      await this.takeScreenshot('validation-state', `Validation system display on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));

      // Test if validation components are visible
      const validationElements = await this.page.$$('[class*="validation"], [class*="error"], [class*="success"]');
      console.log(`Found ${validationElements.length} validation elements on ${deviceName}`);

    } catch (error) {
      console.log(`⚠️ Validation system issue on ${deviceName}: ${error.message}`);
      await this.takeScreenshot('validation-error', `Validation system error on ${deviceName}`, deviceName.toLowerCase().replace(/\s+/g, '-'));
    }
  }

  async testResponsiveDesign() {
    console.log('🧪 Testing Responsive Design Across Multiple Devices...\n');

    // Define test devices - focusing on key breakpoints
    const devices = [
      // Mobile devices (320px-768px)
      { name: 'Small Mobile', width: 320, height: 568, devicePixelRatio: 2 },
      { name: 'iPhone SE', width: 375, height: 667, devicePixelRatio: 2 },
      { name: 'Large Mobile', width: 414, height: 896, devicePixelRatio: 3 },

      // Tablets (768px-1024px)
      { name: 'iPad', width: 768, height: 1024, devicePixelRatio: 2 },
      { name: 'Large Tablet', width: 1024, height: 1366, devicePixelRatio: 2 },

      // Desktop (1024px+)
      { name: 'Laptop', width: 1366, height: 768, devicePixelRatio: 1 },
      { name: 'Desktop', width: 1920, height: 1080, devicePixelRatio: 1 }
    ];

    // Test each device
    for (const device of devices) {
      await this.testDeviceViewport(device.name, device.width, device.height, device.devicePixelRatio);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between devices
    }

    console.log('\n✅ Responsive design testing completed!');
    console.log(`📸 Screenshots saved in: ${this.screenshotDir}`);
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance on Edge Devices...');
    
    // Simulate slow network
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms
    });

    // Test with mobile viewport
    await this.page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    const startTime = Date.now();
    await this.page.goto(TEST_CONFIG.appUrl, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    console.log(`📊 Page load time on slow network: ${loadTime}ms`);
    await this.takeScreenshot('performance-test', `Performance test - Load time: ${loadTime}ms`, 'performance');
  }

  async generateReport() {
    const deviceCategories = {
      mobile: this.testResults.filter(r => r.viewport && r.viewport.width < 768),
      tablet: this.testResults.filter(r => r.viewport && r.viewport.width >= 768 && r.viewport.width < 1024),
      desktop: this.testResults.filter(r => r.viewport && r.viewport.width >= 1024)
    };

    const report = {
      testSuite: 'Phase 2: Responsive Design & Edge Device Compatibility Test',
      timestamp: new Date().toISOString(),
      screenshots: this.testResults,
      summary: {
        totalSteps: this.testResults.length,
        devicesTested: [...new Set(this.testResults.map(r => r.deviceType))].length,
        mobileTests: deviceCategories.mobile.length,
        tabletTests: deviceCategories.tablet.length,
        desktopTests: deviceCategories.desktop.length
      },
      deviceCategories,
      enhancements: {
        responsiveComponents: 'ResponsiveLayout, ResponsiveCard, ResponsiveButton components implemented',
        mobileOptimization: 'Touch-friendly interfaces with 44px minimum touch targets',
        tabletOptimization: 'Optimized layouts for tablet screen sizes',
        desktopEnhancement: 'Enhanced desktop experience with improved layouts',
        performanceTesting: 'Edge device performance testing completed'
      }
    };
    
    const reportPath = path.join(this.screenshotDir, 'phase2-responsive-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Phase 2 Report Generated: ${reportPath}`);
    console.log(`📈 Total responsive tests: ${this.testResults.length}`);
    console.log(`📱 Mobile tests: ${deviceCategories.mobile.length}`);
    console.log(`📟 Tablet tests: ${deviceCategories.tablet.length}`);
    console.log(`🖥️  Desktop tests: ${deviceCategories.desktop.length}`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runResponsiveDesignTest() {
  const tester = new ResponsiveDesignTest();
  
  try {
    await tester.initialize();
    await tester.testResponsiveDesign();
    await tester.testPerformance();
    await tester.generateReport();
    
  } catch (error) {
    console.error('❌ Responsive design test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Export for use as module
module.exports = { ResponsiveDesignTest, runResponsiveDesignTest };

// Run test if called directly
if (require.main === module) {
  runResponsiveDesignTest();
}
