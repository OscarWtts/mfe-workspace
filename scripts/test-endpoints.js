#!/usr/bin/env node

/**
 * Endpoint Testing Script
 * Tests the accessibility and health of MFE endpoints
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
    
    // Test HTTP status
    const statusCommand = `curl -o /dev/null -s -w "%{http_code}" "${url}"`;
    const status = await execAsync(statusCommand);
    const statusCode = parseInt(status.stdout.trim());
    
    if (statusCode === expectedStatus) {
      log(`✅ ${name}: HTTP ${statusCode} (Expected: ${expectedStatus})`, 'green');
    } else {
      log(`❌ ${name}: HTTP ${statusCode} (Expected: ${expectedStatus})`, 'red');
      return false;
    }
    
    // Test response time
    const timeCommand = `curl -o /dev/null -s -w "%{time_total}" "${url}"`;
    const timeResult = await execAsync(timeCommand);
    const responseTime = parseFloat(timeResult.stdout.trim());
    
    if (responseTime < 5.0) {
      log(`✅ ${name}: Response time ${responseTime}s`, 'green');
    } else {
      log(`⚠️  ${name}: Slow response time ${responseTime}s`, 'yellow');
    }
    
    // Test content type for HTML endpoints
    if (expectedStatus === 200) {
      const headerCommand = `curl -s -I "${url}" | grep -i "content-type"`;
      try {
        const headerResult = await execAsync(headerCommand);
        const contentType = headerResult.stdout.trim();
        log(`📄 ${name}: ${contentType}`, 'blue');
      } catch (error) {
        log(`⚠️  ${name}: Could not determine content type`, 'yellow');
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ ${name}: Test failed - ${error.message}`, 'red');
    return false;
  }
}

async function testStaticAssets(baseUrl, externalIP) {
  log('\n=== Testing Static Assets ===', 'blue');
  
  const assets = [
    { path: '/assets/index.css', name: 'Host CSS' },
    { path: '/assets/index.js', name: 'Host JS' },
    { path: '/console/assets/index.css', name: 'Console CSS' },
    { path: '/console/assets/index.js', name: 'Console JS' },
    { path: '/console/assets/remoteEntry.js', name: 'Console Remote Entry' }
  ];
  
  let allPassed = true;
  
  for (const asset of assets) {
    const url = `${baseUrl}${asset.path}`;
    try {
      const statusCommand = `curl -o /dev/null -s -w "%{http_code}" "${url}"`;
      const status = await execAsync(statusCommand);
      const statusCode = parseInt(status.stdout.trim());
      
      if (statusCode === 200) {
        log(`✅ ${asset.name}: Available`, 'green');
      } else if (statusCode === 404) {
        log(`⚠️  ${asset.name}: Not found (${statusCode}) - may not exist yet`, 'yellow');
      } else {
        log(`❌ ${asset.name}: HTTP ${statusCode}`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`❌ ${asset.name}: Test failed`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testMicrofrontendLoading(baseUrl) {
  log('\n=== Testing Microfrontend Loading ===', 'blue');
  
  try {
    // Test host app loads
    const hostCommand = `curl -s "${baseUrl}/" | grep -i "mfe-host\\|react\\|vite" | head -1`;
    try {
      const hostResult = await execAsync(hostCommand);
      if (hostResult.stdout.trim()) {
        log('✅ Host app: Contains expected content', 'green');
      } else {
        log('⚠️  Host app: No MFE-specific content detected', 'yellow');
      }
    } catch (error) {
      log('⚠️  Host app: Could not verify content', 'yellow');
    }
    
    // Test console app loads
    const consoleCommand = `curl -s "${baseUrl}/console/" | grep -i "mfe-console\\|react\\|vite" | head -1`;
    try {
      const consoleResult = await execAsync(consoleCommand);
      if (consoleResult.stdout.trim()) {
        log('✅ Console app: Contains expected content', 'green');
      } else {
        log('⚠️  Console app: No MFE-specific content detected', 'yellow');
      }
    } catch (error) {
      log('⚠️  Console app: Could not verify content', 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`❌ Microfrontend loading test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testLoadBalancer(externalIP) {
  log('\n=== Testing Load Balancer ===', 'blue');
  
  try {
    // Test multiple requests to check load balancing
    const requests = 5;
    let successful = 0;
    
    for (let i = 1; i <= requests; i++) {
      try {
        const statusCommand = `curl -o /dev/null -s -w "%{http_code}" "http://${externalIP}/"`;
        const status = await execAsync(statusCommand);
        const statusCode = parseInt(status.stdout.trim());
        
        if (statusCode === 200) {
          successful++;
        }
      } catch (error) {
        // Request failed
      }
    }
    
    const successRate = (successful / requests) * 100;
    
    if (successRate >= 80) {
      log(`✅ Load balancer: ${successful}/${requests} requests successful (${successRate}%)`, 'green');
    } else {
      log(`❌ Load balancer: ${successful}/${requests} requests successful (${successRate}%)`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`❌ Load balancer test failed: ${error.message}`, 'red');
    return false;
  }
}

async function performanceTest(baseUrl) {
  log('\n=== Performance Test ===', 'blue');
  
  const endpoints = [
    { url: `${baseUrl}/`, name: 'Host' },
    { url: `${baseUrl}/console/`, name: 'Console' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const command = `curl -o /dev/null -s -w "Connect: %{time_connect}s, Start Transfer: %{time_starttransfer}s, Total: %{time_total}s, Size: %{size_download} bytes" "${endpoint.url}"`;
      const result = await execAsync(command);
      const metrics = result.stdout.trim();
      
      log(`📊 ${endpoint.name}: ${metrics}`, 'blue');
      
      // Extract total time
      const totalTimeMatch = metrics.match(/Total: ([0-9.]+)s/);
      if (totalTimeMatch) {
        const totalTime = parseFloat(totalTimeMatch[1]);
        if (totalTime > 10.0) {
          log(`⚠️  ${endpoint.name}: Slow response time (${totalTime}s)`, 'yellow');
        }
      }
    } catch (error) {
      log(`❌ ${endpoint.name}: Performance test failed`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function main() {
  log('🌐 Starting endpoint testing...', 'blue');
  
  let overallSuccess = true;
  
  try {
    // Get external IP
    const externalIP = await getExternalIP();
    const baseUrl = `http://${externalIP}`;
    
    // Test main endpoints
    log('\n=== Testing Main Endpoints ===', 'blue');
    
    const endpoints = [
      { url: `${baseUrl}/`, name: 'Host App', status: 200 },
      { url: `${baseUrl}/console/`, name: 'Console App', status: 200 },
      { url: `${baseUrl}/console`, name: 'Console Redirect', status: 200 }
    ];
    
    for (const endpoint of endpoints) {
      const success = await testEndpoint(endpoint.url, endpoint.name, endpoint.status);
      if (!success) {
        overallSuccess = false;
      }
    }
    
    // Test static assets
    const assetsSuccess = await testStaticAssets(baseUrl, externalIP);
    if (!assetsSuccess) {
      overallSuccess = false;
    }
    
    // Test microfrontend loading
    const mfeSuccess = await testMicrofrontendLoading(baseUrl);
    if (!mfeSuccess) {
      overallSuccess = false;
    }
    
    // Test load balancer
    const lbSuccess = await testLoadBalancer(externalIP);
    if (!lbSuccess) {
      overallSuccess = false;
    }
    
    // Performance test
    const perfSuccess = await performanceTest(baseUrl);
    if (!perfSuccess) {
      overallSuccess = false;
    }
    
    // Final status
    log('\n' + '='.repeat(50), 'blue');
    if (overallSuccess) {
      log('🎉 Endpoint testing: PASSED', 'green');
      log('All endpoints are working correctly!', 'green');
      log(`\n🔗 Application URLs:`, 'blue');
      log(`   Host: ${baseUrl}/`, 'green');
      log(`   Console: ${baseUrl}/console/`, 'green');
    } else {
      log('❌ Endpoint testing: FAILED', 'red');
      log('Some endpoints need attention. Check the details above.', 'yellow');
    }
    
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Endpoint testing failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the endpoint tests
main();
