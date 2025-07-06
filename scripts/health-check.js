#!/usr/bin/env node

/**
 * Health Check Script
 * Checks the health of Kubernetes deployments and pods
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
    log(`\n${description}...`, 'blue');
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

async function checkKubernetesAccess() {
  try {
    await runCommand('kubectl cluster-info', 'Checking Kubernetes cluster access');
    log('✅ Kubernetes cluster access is working', 'green');
    return true;
  } catch (error) {
    log('❌ Cannot access Kubernetes cluster', 'red');
    log('Please ensure kubectl is configured and you have access to the cluster', 'yellow');
    return false;
  }
}

async function checkDeployments() {
  try {
    const deployments = await runCommand('kubectl get deployments -o json', 'Checking deployments');
    const deploymentsData = JSON.parse(deployments);
    
    log('\n=== Deployment Status ===', 'blue');
    
    let allHealthy = true;
    
    for (const deployment of deploymentsData.items) {
      const name = deployment.metadata.name;
      const replicas = deployment.spec.replicas;
      const readyReplicas = deployment.status.readyReplicas || 0;
      const availableReplicas = deployment.status.availableReplicas || 0;
      
      if (readyReplicas === replicas && availableReplicas === replicas) {
        log(`✅ ${name}: ${readyReplicas}/${replicas} replicas ready`, 'green');
      } else {
        log(`❌ ${name}: ${readyReplicas}/${replicas} replicas ready`, 'red');
        allHealthy = false;
      }
    }
    
    return allHealthy;
  } catch (error) {
    log('❌ Failed to check deployments', 'red');
    return false;
  }
}

async function checkPods() {
  try {
    const pods = await runCommand('kubectl get pods -o json', 'Checking pods');
    const podsData = JSON.parse(pods);
    
    log('\n=== Pod Status ===', 'blue');
    
    let allHealthy = true;
    
    for (const pod of podsData.items) {
      const name = pod.metadata.name;
      const phase = pod.status.phase;
      const ready = pod.status.conditions?.find(c => c.type === 'Ready')?.status === 'True';
      
      if (phase === 'Running' && ready) {
        log(`✅ ${name}: Running and Ready`, 'green');
      } else {
        log(`❌ ${name}: ${phase}${ready ? ' (Ready)' : ' (Not Ready)'}`, 'red');
        allHealthy = false;
        
        // Show container statuses for failed pods
        if (pod.status.containerStatuses) {
          for (const container of pod.status.containerStatuses) {
            if (!container.ready) {
              log(`   Container ${container.name}: ${JSON.stringify(container.state)}`, 'yellow');
            }
          }
        }
      }
    }
    
    return allHealthy;
  } catch (error) {
    log('❌ Failed to check pods', 'red');
    return false;
  }
}

async function checkServices() {
  try {
    const services = await runCommand('kubectl get services -o json', 'Checking services');
    const servicesData = JSON.parse(services);
    
    log('\n=== Service Status ===', 'blue');
    
    for (const service of servicesData.items) {
      const name = service.metadata.name;
      const type = service.spec.type;
      const ports = service.spec.ports.map(p => p.port).join(', ');
      
      log(`✅ ${name} (${type}): ports ${ports}`, 'green');
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to check services', 'red');
    return false;
  }
}

async function checkIngress() {
  try {
    const ingress = await runCommand('kubectl get ingress -o json', 'Checking ingress');
    const ingressData = JSON.parse(ingress);
    
    log('\n=== Ingress Status ===', 'blue');
    
    let hasExternalIP = false;
    
    for (const ing of ingressData.items) {
      const name = ing.metadata.name;
      const loadBalancer = ing.status.loadBalancer;
      
      if (loadBalancer && loadBalancer.ingress && loadBalancer.ingress.length > 0) {
        const ip = loadBalancer.ingress[0].ip;
        log(`✅ ${name}: External IP ${ip}`, 'green');
        hasExternalIP = true;
      } else {
        log(`❌ ${name}: No external IP assigned`, 'red');
      }
    }
    
    return hasExternalIP;
  } catch (error) {
    log('❌ Failed to check ingress', 'red');
    return false;
  }
}

async function checkEvents() {
  try {
    const events = await runCommand('kubectl get events --sort-by=.metadata.creationTimestamp --field-selector type=Warning', 'Checking recent warning events');
    
    if (events.trim()) {
      log('\n=== Recent Warning Events ===', 'yellow');
      log(events, 'yellow');
    } else {
      log('\n✅ No recent warning events', 'green');
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to check events', 'red');
    return false;
  }
}

async function main() {
  log('🏥 Starting health check...', 'blue');
  
  let overallHealth = true;
  
  try {
    // Check Kubernetes access
    if (!await checkKubernetesAccess()) {
      process.exit(1);
    }
    
    // Check deployments
    if (!await checkDeployments()) {
      overallHealth = false;
    }
    
    // Check pods
    if (!await checkPods()) {
      overallHealth = false;
    }
    
    // Check services
    if (!await checkServices()) {
      overallHealth = false;
    }
    
    // Check ingress
    if (!await checkIngress()) {
      overallHealth = false;
    }
    
    // Check events
    await checkEvents();
    
    // Final status
    log('\n' + '='.repeat(50), 'blue');
    if (overallHealth) {
      log('🎉 Overall health check: PASSED', 'green');
      log('All components are healthy!', 'green');
    } else {
      log('❌ Overall health check: FAILED', 'red');
      log('Some components need attention. Check the details above.', 'yellow');
    }
    
    process.exit(overallHealth ? 0 : 1);
    
  } catch (error) {
    log(`\n❌ Health check failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the health check
main();
