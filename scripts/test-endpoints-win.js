#!/usr/bin/env node

/**
 * Endpoint Testing Script for Windows
 * Tests the accessibility and health of MFE endpoints using PowerShell
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runCommand(command, description) {
  try {
    log(`${description}...`, 'blue');
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      log(`Warning: ${stderr}`, 'yellow');
    }
    return stdout.trim();
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

async function getExternalIP() {
  try {
    const ip = await runCommand(
      'kubectl get ingress mfe-ingress -o jsonpath="{.status.loadBalancer.ingress[0].ip}"',
      'Getting external IP from ingress'
    );
    
    if (!ip) {
      throw new Error('No external IP found');
    }
    
    log(`External IP: ${ip}`, 'green');
    return ip;
  } catch (error) {
    log('❌ Failed to get external IP', 'red');
    throw error;
  }
}

async function testEndpoint(url, name, expectedStatus = 200) {
  try {
    log(`\nTesting ${name}: ${url}`, 'blue');
    
    // Use PowerShell Invoke-WebRequest for Windows compatibility
    const statusCommand = `powershell -Command "try { $response = Invoke-WebRequest -Uri '${url}' -TimeoutSec 10 -UseBasicParsing; $response.StatusCode } catch { if($_.Exception.Response.StatusCode.value__) { $_.Exception.Response.StatusCode.value__ } else { 500 } }"`;
    
    const result = await execAsync(statusCommand);
    const statusCode = parseInt(result.stdout.trim());
    
    if (statusCode === expectedStatus) {
      log(`✅ ${name}: HTTP ${statusCode} (Expected: ${expectedStatus})`, 'green');
      return true;
    } else {
      log(`❌ ${name}: HTTP ${statusCode} (Expected: ${expectedStatus})`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Test failed - ${error.message}`, 'red');
    return false;
  }
}

async function testContentExists(url, name, expectedContent) {
  try {
    log(`\nTesting ${name} content: ${url}`, 'blue');
    
    const contentCommand = `powershell -Command "try { $response = Invoke-WebRequest -Uri '${url}' -TimeoutSec 10 -UseBasicParsing; $response.Content } catch { '' }"`;
    
    const result = await execAsync(contentCommand);
    const content = result.stdout.trim();
    
    if (content.includes(expectedContent)) {
      log(`✅ ${name}: Content contains '${expectedContent}'`, 'green');
      return true;
    } else {
      log(`❌ ${name}: Content does not contain '${expectedContent}'`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ ${name}: Content test failed - ${error.message}`, 'red');
    return false;
  }
}

async function performLoadTest(url, name, requests = 5) {
  try {
    log(`\nPerforming load test for ${name} (${requests} requests)`, 'blue');
    
    const promises = [];
    for (let i = 0; i < requests; i++) {
      promises.push(testEndpoint(url, `${name} Request ${i + 1}`, 200));
    }
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r).length;
    const successRate = Math.round((successCount / requests) * 100);
    
    if (successRate >= 80) {
      log(`✅ Load test: ${successCount}/${requests} requests successful (${successRate}%)`, 'green');
      return true;
    } else {
      log(`❌ Load test: ${successCount}/${requests} requests successful (${successRate}%)`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Load test failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  try {
    log('🌐 Starting endpoint testing for Windows...', 'blue');
    
    // Get external IP
    const externalIP = await getExternalIP();
    const baseUrl = `http://${externalIP}`;
    
    // Test results
    const results = {
      main: [],
      assets: [],
      content: [],
      load: []
    };
    
    log('\n=== Testing Main Endpoints ===', 'blue');
    results.main.push(await testEndpoint(`${baseUrl}/`, 'Host App'));
    results.main.push(await testEndpoint(`${baseUrl}/console/`, 'Console App'));
    results.main.push(await testEndpoint(`${baseUrl}/console`, 'Console Redirect'));
    
    log('\n=== Testing Content ===', 'blue');
    results.content.push(await testContentExists(`${baseUrl}/`, 'Host App', 'Vite + React'));
    results.content.push(await testContentExists(`${baseUrl}/console/`, 'Console App', 'Vite + React'));
    
    log('\n=== Testing Load Balancer ===', 'blue');
    results.load.push(await performLoadTest(`${baseUrl}/`, 'Host App', 5));
    results.load.push(await performLoadTest(`${baseUrl}/console/`, 'Console App', 5));
    
    // Summary
    log('\n==================================================', 'blue');
    const totalTests = results.main.length + results.content.length + results.load.length;
    const passedTests = [
      ...results.main,
      ...results.content,
      ...results.load
    ].filter(r => r).length;
    
    if (passedTests === totalTests) {
      log('🎉 Endpoint testing: PASSED', 'green');
      log(`All ${totalTests} tests passed!`, 'green');
    } else {
      log('❌ Endpoint testing: FAILED', 'red');
      log(`${passedTests}/${totalTests} tests passed`, 'yellow');
    }
    
    // Additional information
    log('\n=== Application URLs ===', 'blue');
    log(`🏠 Host App: ${baseUrl}/`, 'green');
    log(`🖥️  Console App: ${baseUrl}/console/`, 'green');
    
    process.exit(passedTests === totalTests ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Testing failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the main function
main();
