const puppeteer = require('puppeteer');
const fs = require('fs');

async function takeScreenshot() {
  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('Navigating to production URL...');
    await page.goto('https://student-tracking-rg1qsvcmo-aditis-projects-430a9f30.vercel.app', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Wait a bit more for React hydration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: 'screenshot.png',
      fullPage: true 
    });
    
    console.log('Getting page content...');
    const content = await page.content();
    fs.writeFileSync('page-content.html', content);
    
    console.log('Getting console logs...');
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Get the actual visible text content
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page visible text:', bodyText);

    console.log('Screenshot saved as screenshot.png');
    console.log('Page content saved as page-content.html');
    console.log('Console logs:', logs);
    
  } catch (error) {
    console.error('Error taking screenshot:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

takeScreenshot();
