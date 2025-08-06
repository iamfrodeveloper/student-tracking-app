#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { validateCredentials } = require('./test-credentials');

console.log('🎯 Student Tracking App - Comprehensive Testing Suite\n');

// Check if required dependencies are installed
function checkDependencies() {
  console.log('📦 Checking dependencies...');
  
  try {
    require('puppeteer');
    console.log('✅ Puppeteer is installed');
  } catch (error) {
    console.log('❌ Puppeteer not found. Installing...');
    try {
      execSync('npm install puppeteer', { stdio: 'inherit' });
      console.log('✅ Puppeteer installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install Puppeteer:', installError.message);
      process.exit(1);
    }
  }
}

// Check credentials configuration
function checkCredentials() {
  console.log('\n🔑 Checking credentials configuration...');
  
  const validation = validateCredentials();
  
  if (validation.isValid) {
    console.log('✅ All credentials are configured');
    return true;
  } else {
    console.log('⚠️  Some credentials are missing:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    
    console.log('\n📝 To configure credentials:');
    console.log('1. Edit test-credentials.js');
    console.log('2. Replace placeholder values with your actual API keys');
    console.log('3. Save the file and run tests again');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('\nDo you want to continue with placeholder credentials? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }
}

// Create test directories
function setupTestEnvironment() {
  console.log('\n📁 Setting up test environment...');
  
  const dirs = [
    'test-screenshots',
    'test-reports'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory exists: ${dir}`);
    }
  });
}

// Run the actual tests
async function runTests() {
  console.log('\n🚀 Starting tests...\n');
  
  try {
    // Import and run the test suite
    const { runTests } = require('./test-app-functionality');
    await runTests();
    
    console.log('\n✅ Test execution completed successfully!');
    
    // Display results summary
    const reportPath = path.join(__dirname, 'test-report.json');
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      console.log('\n📊 Test Results Summary:');
      console.log(`   Total Tests: ${report.summary.total}`);
      console.log(`   Passed: ${report.summary.passed}`);
      console.log(`   Failed: ${report.summary.failed}`);
      console.log(`   Success Rate: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`);
      
      if (report.screenshots && report.screenshots.length > 0) {
        console.log(`\n📸 Screenshots captured: ${report.screenshots.length}`);
        console.log('   Check the test-screenshots folder for visual verification');
      }
      
      console.log(`\n📋 Detailed report: ${reportPath}`);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Display help information
function showHelp() {
  console.log('🎯 Student Tracking App Testing Suite\n');
  console.log('Usage: node run-tests.js [options]\n');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --check, -c    Check configuration only');
  console.log('  --setup, -s    Setup test environment only');
  console.log('  --headless     Run tests in headless mode');
  console.log('  --local        Test against local development server');
  console.log('\nExamples:');
  console.log('  node run-tests.js              # Run full test suite');
  console.log('  node run-tests.js --check      # Check configuration');
  console.log('  node run-tests.js --headless   # Run tests without browser UI');
  console.log('  node run-tests.js --local      # Test local development server');
  console.log('\nBefore running tests:');
  console.log('1. Edit test-credentials.js with your API keys');
  console.log('2. Ensure the application is deployed and accessible');
  console.log('3. Run: node run-tests.js');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--check') || args.includes('-c')) {
    await checkCredentials();
    return;
  }
  
  if (args.includes('--setup') || args.includes('-s')) {
    setupTestEnvironment();
    return;
  }
  
  // Set test configuration based on arguments
  if (args.includes('--headless')) {
    process.env.TEST_HEADLESS = 'true';
  }
  
  if (args.includes('--local')) {
    process.env.TEST_LOCAL = 'true';
  }
  
  // Run full test suite
  try {
    checkDependencies();
    
    const credentialsOk = await checkCredentials();
    if (!credentialsOk) {
      console.log('\n❌ Exiting due to missing credentials');
      process.exit(1);
    }
    
    setupTestEnvironment();
    await runTests();
    
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  checkDependencies,
  checkCredentials,
  setupTestEnvironment,
  runTests,
  showHelp
};
