#!/usr/bin/env node

/**
 * Test runner script for the Student Tracking App
 * Provides different test execution modes for development and CI/CD
 */

const { spawn } = require('child_process')
const path = require('path')

// Parse command line arguments
const args = process.argv.slice(2)
const mode = args[0] || 'default'

// Test configurations
const testConfigs = {
  // Default test run
  default: {
    command: 'jest',
    args: ['--passWithNoTests']
  },
  
  // Watch mode for development
  watch: {
    command: 'jest',
    args: ['--watch', '--passWithNoTests']
  },
  
  // Coverage mode
  coverage: {
    command: 'jest',
    args: ['--coverage', '--passWithNoTests', '--watchAll=false']
  },
  
  // CI mode - for continuous integration
  ci: {
    command: 'jest',
    args: [
      '--ci',
      '--coverage',
      '--watchAll=false',
      '--passWithNoTests',
      '--verbose',
      '--reporters=default',
      '--reporters=jest-junit',
      '--coverageReporters=text',
      '--coverageReporters=lcov',
      '--coverageReporters=cobertura'
    ]
  },
  
  // Unit tests only
  unit: {
    command: 'jest',
    args: ['--testPathPatterns=__tests__', '--passWithNoTests']
  },

  // Integration tests only
  integration: {
    command: 'jest',
    args: ['--testPathPatterns=integration', '--passWithNoTests']
  },

  // Component tests only
  components: {
    command: 'jest',
    args: ['--testPathPatterns=components', '--passWithNoTests']
  },

  // API tests only
  api: {
    command: 'jest',
    args: ['--testPathPatterns=api', '--passWithNoTests']
  },
  
  // Debug mode with verbose output
  debug: {
    command: 'jest',
    args: ['--verbose', '--no-cache', '--passWithNoTests']
  },
  
  // Update snapshots
  update: {
    command: 'jest',
    args: ['--updateSnapshot', '--passWithNoTests']
  }
}

// Help text
const helpText = `
Student Tracking App Test Runner

Usage: npm run test:script [mode] [-- additional-jest-args]

Available modes:
  default     - Run all tests (default)
  watch       - Run tests in watch mode
  coverage    - Run tests with coverage report
  ci          - Run tests in CI mode with coverage and reports
  unit        - Run unit tests only
  integration - Run integration tests only
  components  - Run component tests only
  api         - Run API tests only
  debug       - Run tests with verbose output and no cache
  update      - Update test snapshots
  help        - Show this help message

Examples:
  npm run test:script
  npm run test:script watch
  npm run test:script coverage
  npm run test:script ci
  npm run test:script unit -- --testNamePattern="SetupWizard"
`

// Show help
if (mode === 'help' || mode === '--help' || mode === '-h') {
  console.log(helpText)
  process.exit(0)
}

// Get test configuration
const config = testConfigs[mode]
if (!config) {
  console.error(`❌ Unknown test mode: ${mode}`)
  console.log(helpText)
  process.exit(1)
}

// Add any additional Jest arguments passed after --
const additionalArgs = []
const dashDashIndex = process.argv.indexOf('--')
if (dashDashIndex !== -1) {
  additionalArgs.push(...process.argv.slice(dashDashIndex + 1))
}

// Combine arguments
const allArgs = [...config.args, ...additionalArgs]

console.log(`🧪 Running tests in ${mode} mode...`)
console.log(`📝 Command: ${config.command} ${allArgs.join(' ')}`)

// Set environment variables for testing
const env = {
  ...process.env,
  NODE_ENV: 'test',
  CI: mode === 'ci' ? 'true' : process.env.CI
}

// Run the test command
const testProcess = spawn(config.command, allArgs, {
  stdio: 'inherit',
  env,
  cwd: process.cwd()
})

// Handle process events
testProcess.on('error', (error) => {
  console.error(`❌ Failed to start test process: ${error.message}`)
  process.exit(1)
})

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log(`✅ Tests completed successfully in ${mode} mode`)
  } else {
    console.error(`❌ Tests failed with exit code ${code}`)
  }
  process.exit(code)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted')
  testProcess.kill('SIGINT')
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated')
  testProcess.kill('SIGTERM')
})
