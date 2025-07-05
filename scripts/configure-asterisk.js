#!/usr/bin/env node

// Automatic Asterisk Configuration Script
// Discovers Asterisk servers and configures environment files

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AsteriskConfigurator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.backendEnvPath = path.join(this.projectRoot, 'backend', '.env');
    this.frontendEnvPath = path.join(this.projectRoot, '.env');
  }

  // Test if an IP has Asterisk services
  async testAsteriskIP(ip) {
    console.log(`Testing ${ip} for Asterisk services...`);
    
    const tests = [
      { port: 5038, service: 'AMI' },
      { port: 8088, service: 'HTTP' },
      { port: 5060, service: 'SIP' },
      { port: 22, service: 'SSH' }
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        const { stdout, stderr } = await execAsync(`nc -z -w3 ${ip} ${test.port}`, { timeout: 5000 });
        results[test.service] = true;
        console.log(`  ✅ ${test.service} (${test.port}): Available`);
      } catch (error) {
        results[test.service] = false;
        console.log(`  ❌ ${test.service} (${test.port}): Not available`);
      }
    }

    const score = Object.values(results).filter(Boolean).length;
    const asteriskDetected = results.AMI || results.HTTP || results.SIP;

    return {
      ip,
      services: results,
      score,
      asteriskDetected
    };
  }

  // Discover Asterisk servers
  async discoverServers() {
    console.log('🔍 Discovering Asterisk servers...\n');

    const candidateIPs = [
      '172.20.10.5',  // Your Kali machine
      '172.20.10.1',  // Gateway
      '172.20.10.2',  // Common backend IP
      '192.168.1.100', // Common Asterisk IP
      '192.168.0.100', // Common Asterisk IP
      'localhost',
      '127.0.0.1'
    ];

    const results = [];

    for (const ip of candidateIPs) {
      try {
        const result = await this.testAsteriskIP(ip);
        results.push(result);
      } catch (error) {
        console.log(`  ❌ ${ip}: Error - ${error.message}`);
      }
    }

    // Filter and sort by score
    const asteriskServers = results
      .filter(r => r.asteriskDetected)
      .sort((a, b) => b.score - a.score);

    console.log(`\n📊 Found ${asteriskServers.length} Asterisk server(s)`);
    
    return asteriskServers;
  }

  // Generate configuration for a server
  generateConfig(server) {
    return {
      backend: {
        ASTERISK_HOST: server.ip,
        ASTERISK_AMI_PORT: '5038',
        ASTERISK_AMI_USERNAME: 'admin',
        ASTERISK_AMI_SECRET: 'amp111',
        SIP_DOMAIN: server.ip,
        SIP_PORT: '8088',
        HTTP_PORT: '8080',
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        DB_NAME: 'voip_db',
        DB_USER: 'voip_user',
        DB_PASSWORD: 'voip_password'
      },
      frontend: {
        REACT_APP_API_URL: 'http://localhost:8080',
        REACT_APP_SIP_SERVER: server.ip,
        REACT_APP_SIP_PORT: '8088',
        REACT_APP_SIP_WS_URL: `ws://${server.ip}:8088/ws`,
        REACT_APP_CLIENT_IP: 'localhost'
      }
    };
  }

  // Write environment file
  writeEnvFile(filePath, config) {
    const envContent = Object.entries(config)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Backup existing file
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`  📋 Backed up existing file to ${backupPath}`);
    }

    fs.writeFileSync(filePath, envContent);
    console.log(`  ✅ Written configuration to ${filePath}`);
  }

  // Test SSH connection
  async testSSH(ip, username = 'kali', password = 'kali') {
    console.log(`\n🔐 Testing SSH connection to ${username}@${ip}...`);
    
    try {
      // Note: This is a basic test. In production, you'd use proper SSH libraries
      const { stdout, stderr } = await execAsync(`ssh -o ConnectTimeout=5 -o BatchMode=yes ${username}@${ip} echo "SSH_TEST_SUCCESS"`, { timeout: 10000 });
      
      if (stdout.includes('SSH_TEST_SUCCESS')) {
        console.log(`  ✅ SSH connection successful`);
        return true;
      }
    } catch (error) {
      console.log(`  ❌ SSH connection failed: ${error.message}`);
      console.log(`  💡 Try: ssh ${username}@${ip}`);
      console.log(`  💡 Password: ${password}`);
    }
    
    return false;
  }

  // Main configuration process
  async configure() {
    console.log('🚀 Asterisk Auto-Configuration Tool\n');

    try {
      // Discover servers
      const servers = await this.discoverServers();

      if (servers.length === 0) {
        console.log('❌ No Asterisk servers found!');
        console.log('\n💡 Manual configuration required:');
        console.log('1. Ensure Asterisk is running');
        console.log('2. Check network connectivity');
        console.log('3. Verify firewall settings');
        return;
      }

      // Select best server
      const bestServer = servers[0];
      console.log(`\n🎯 Selected server: ${bestServer.ip} (score: ${bestServer.score})`);

      // Generate configuration
      const config = this.generateConfig(bestServer);

      // Write configuration files
      console.log('\n📝 Writing configuration files...');
      this.writeEnvFile(this.backendEnvPath, config.backend);
      this.writeEnvFile(this.frontendEnvPath, config.frontend);

      // Test SSH if available
      if (bestServer.services.SSH) {
        await this.testSSH(bestServer.ip);
      }

      console.log('\n✅ Configuration complete!');
      console.log('\n📋 Next steps:');
      console.log('1. Restart your backend server');
      console.log('2. Restart your frontend development server');
      console.log('3. Test the connection in the admin dashboard');
      
      if (bestServer.services.SSH) {
        console.log(`4. SSH to Asterisk server: ssh kali@${bestServer.ip}`);
      }

      console.log('\n📊 Server Details:');
      console.log(`   IP: ${bestServer.ip}`);
      console.log(`   Services: ${Object.entries(bestServer.services).filter(([k, v]) => v).map(([k]) => k).join(', ')}`);

    } catch (error) {
      console.error('❌ Configuration failed:', error.message);
      process.exit(1);
    }
  }

  // Show current configuration
  showConfig() {
    console.log('📋 Current Configuration:\n');

    const files = [
      { path: this.backendEnvPath, name: 'Backend (.env)' },
      { path: this.frontendEnvPath, name: 'Frontend (.env)' }
    ];

    files.forEach(file => {
      console.log(`${file.name}:`);
      if (fs.existsSync(file.path)) {
        const content = fs.readFileSync(file.path, 'utf8');
        console.log(content);
      } else {
        console.log('  (File does not exist)');
      }
      console.log('');
    });
  }
}

// CLI Interface
async function main() {
  const configurator = new AsteriskConfigurator();
  const command = process.argv[2];

  switch (command) {
    case 'discover':
      await configurator.discoverServers();
      break;
    case 'configure':
      await configurator.configure();
      break;
    case 'show':
      configurator.showConfig();
      break;
    default:
      console.log('🔧 Asterisk Configuration Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node configure-asterisk.js discover   - Discover Asterisk servers');
      console.log('  node configure-asterisk.js configure - Auto-configure environment');
      console.log('  node configure-asterisk.js show      - Show current configuration');
      console.log('');
      console.log('Examples:');
      console.log('  node configure-asterisk.js configure');
      console.log('  npm run configure-asterisk');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AsteriskConfigurator;
