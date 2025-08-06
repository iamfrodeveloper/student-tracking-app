const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugProduction() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs and errors
    const logs = [];
    const errors = [];
    
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
      console.log(`Console ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('Page Error:', error.message);
    });
    
    page.on('requestfailed', request => {
      console.error('Request Failed:', request.url(), request.failure().errorText);
    });
    
    // Test both URLs
    const urls = [
      'https://student-tracking-app.vercel.app',
      'https://student-tracking-rg1qsvcmo-aditis-projects-430a9f30.vercel.app'
    ];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n=== Testing URL ${i + 1}: ${url} ===`);
      
      try {
        console.log('Navigating...');
        await page.goto(url, { 
          waitUntil: 'networkidle2',
          timeout: 20000 
        });
        
        // Wait a bit for any dynamic content
        await page.waitForTimeout(5000);
        
        console.log('Taking screenshot...');
        await page.screenshot({ path: `page-screenshot-${i + 1}.png`, fullPage: true });
        
        // Get page content
        const content = await page.content();
        fs.writeFileSync(`page-content-${i + 1}.html`, content);
        
        // Get visible text
        const visibleText = await page.evaluate(() => {
          return document.body.innerText;
        });
        
        // Get page title
        const title = await page.title();
        
        // Check for specific elements
        const hasSetupWizard = await page.$('.setup-wizard, [data-testid="setup-wizard"]') !== null;
        const hasDashboard = await page.$('.dashboard, [data-testid="dashboard"]') !== null;
        const hasNextApp = visibleText.includes('Create Next App');
        const has404 = visibleText.includes('404') || visibleText.includes('This page could not be found');
        const hasStudentTracking = visibleText.includes('Student Tracking');
        
        console.log(`Title: ${title}`);
        console.log(`Has Setup Wizard: ${hasSetupWizard}`);
        console.log(`Has Dashboard: ${hasDashboard}`);
        console.log(`Has Next App default: ${hasNextApp}`);
        console.log(`Has 404 error: ${has404}`);
        console.log(`Has Student Tracking: ${hasStudentTracking}`);
        console.log(`Visible text (first 300 chars): ${visibleText.substring(0, 300)}`);
        
        // Check for React hydration
        const reactRoot = await page.$('#__next') !== null;
        console.log(`Has React root: ${reactRoot}`);
        
        // Save debug info
        const debugInfo = {
          url,
          title,
          hasSetupWizard,
          hasDashboard,
          hasNextApp,
          has404,
          hasStudentTracking,
          reactRoot,
          visibleText: visibleText.substring(0, 1000),
          logs: logs.slice(),
          errors: errors.slice()
        };
        
        fs.writeFileSync(`debug-info-${i + 1}.json`, JSON.stringify(debugInfo, null, 2));
        
      } catch (error) {
        console.error(`Error testing ${url}:`, error.message);
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total console logs: ${logs.length}`);
    console.log(`Total errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErrors found:');
      errors.forEach(error => console.log(`- ${error}`));
    }
    
  } catch (error) {
    console.error('Error in debug script:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugProduction();
