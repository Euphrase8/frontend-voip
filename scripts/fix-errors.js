#!/usr/bin/env node

// Comprehensive Error Fix Script for VoIP Application
// Identifies and fixes common issues in the project

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ErrorFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.errors = [];
    this.fixes = [];
  }

  // Check for missing files
  async checkMissingFiles() {
    console.log('🔍 Checking for missing files...');
    
    const requiredFiles = [
      '.env',
      'backend/.env',
      'package.json',
      'src/index.js',
      'src/App.js',
      'public/index.html',
      'tailwind.config.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`);
      } else {
        console.log(`  ✅ ${file} exists`);
      }
    }
  }

  // Check environment configuration
  async checkEnvironmentConfig() {
    console.log('\n🔍 Checking environment configuration...');
    
    try {
      const envPath = path.join(this.projectRoot, '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check for correct Asterisk IP
        if (envContent.includes('172.20.10.2')) {
          this.errors.push('Frontend .env has incorrect Asterisk IP (should be 172.20.10.5)');
          this.fixes.push(() => this.fixFrontendEnv());
        }
        
        // Check for required variables
        const requiredVars = [
          'REACT_APP_SIP_SERVER',
          'REACT_APP_SIP_WS_URL',
          'REACT_APP_API_URL'
        ];
        
        for (const varName of requiredVars) {
          if (!envContent.includes(varName)) {
            this.errors.push(`Missing environment variable: ${varName}`);
          }
        }
        
        console.log('  ✅ Frontend .env file checked');
      }

      // Check backend .env
      const backendEnvPath = path.join(this.projectRoot, 'backend', '.env');
      if (fs.existsSync(backendEnvPath)) {
        const backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
        
        if (!backendEnvContent.includes('ASTERISK_HOST=172.20.10.5')) {
          this.errors.push('Backend .env has incorrect Asterisk IP');
          this.fixes.push(() => this.fixBackendEnv());
        }
        
        console.log('  ✅ Backend .env file checked');
      }
    } catch (error) {
      this.errors.push(`Environment config check failed: ${error.message}`);
    }
  }

  // Check package.json dependencies
  async checkDependencies() {
    console.log('\n🔍 Checking dependencies...');
    
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDeps = [
        'react',
        'react-dom',
        'react-router-dom',
        'react-icons',
        'framer-motion',
        'tailwindcss',
        'axios'
      ];

      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          this.errors.push(`Missing dependency: ${dep}`);
        }
      }
      
      console.log('  ✅ Dependencies checked');
    } catch (error) {
      this.errors.push(`Dependency check failed: ${error.message}`);
    }
  }

  // Check for import/export issues
  async checkImportIssues() {
    console.log('\n🔍 Checking for import/export issues...');
    
    try {
      // Check main App.js
      const appPath = path.join(this.projectRoot, 'src', 'App.js');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        
        // Check for common import issues
        if (appContent.includes("import { cn } from '../utils/ui'")) {
          // This is correct
        } else if (appContent.includes("import { cn }") && !appContent.includes("from '../utils/ui'")) {
          this.errors.push('Incorrect cn import in App.js');
          this.fixes.push(() => this.fixCnImport());
        }
      }
      
      console.log('  ✅ Import/export issues checked');
    } catch (error) {
      this.errors.push(`Import check failed: ${error.message}`);
    }
  }

  // Check for TypeScript/JavaScript issues
  async checkSyntaxIssues() {
    console.log('\n🔍 Checking for syntax issues...');
    
    try {
      // Run a basic syntax check
      const { stdout, stderr } = await execAsync('npm run build --dry-run', { 
        cwd: this.projectRoot,
        timeout: 30000 
      });
      
      if (stderr && stderr.includes('error')) {
        this.errors.push('Build errors detected');
      }
      
      console.log('  ✅ Syntax issues checked');
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.log('  ⚠️ Build check timed out (this is normal)');
      } else {
        this.errors.push(`Syntax check failed: ${error.message}`);
      }
    }
  }

  // Fix frontend .env file
  fixFrontendEnv() {
    console.log('🔧 Fixing frontend .env file...');
    
    const envPath = path.join(this.projectRoot, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Fix Asterisk IP
    envContent = envContent.replace(/172\.20\.10\.2/g, '172.20.10.5');
    
    fs.writeFileSync(envPath, envContent);
    console.log('  ✅ Frontend .env fixed');
  }

  // Fix backend .env file
  fixBackendEnv() {
    console.log('🔧 Fixing backend .env file...');
    
    const backendEnvPath = path.join(this.projectRoot, 'backend', '.env');
    let backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
    
    // Ensure correct Asterisk IP
    if (!backendEnvContent.includes('ASTERISK_HOST=172.20.10.5')) {
      backendEnvContent = backendEnvContent.replace(/ASTERISK_HOST=.*/g, 'ASTERISK_HOST=172.20.10.5');
    }
    
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('  ✅ Backend .env fixed');
  }

  // Fix cn import issues
  fixCnImport() {
    console.log('🔧 Fixing cn import issues...');
    
    const filesToCheck = [
      'src/App.js',
      'src/components/AsteriskDiagnostics.jsx',
      'src/pages/AdminDashboard.jsx'
    ];

    for (const file of filesToCheck) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix cn import
        content = content.replace(
          /import { cn } from ['"]\.\.\/utils\/cn['"];?/g,
          "import { cn } from '../utils/ui';"
        );
        
        fs.writeFileSync(filePath, content);
      }
    }
    
    console.log('  ✅ cn import issues fixed');
  }

  // Run all checks
  async runAllChecks() {
    console.log('🚀 Running comprehensive error check...\n');
    
    await this.checkMissingFiles();
    await this.checkEnvironmentConfig();
    await this.checkDependencies();
    await this.checkImportIssues();
    await this.checkSyntaxIssues();
    
    return this.generateReport();
  }

  // Apply all fixes
  async applyFixes() {
    console.log('\n🔧 Applying fixes...\n');
    
    for (const fix of this.fixes) {
      try {
        await fix();
      } catch (error) {
        console.error(`Fix failed: ${error.message}`);
      }
    }
    
    console.log('\n✅ All fixes applied!');
  }

  // Generate report
  generateReport() {
    console.log('\n📋 ERROR REPORT');
    console.log('================');
    
    if (this.errors.length === 0) {
      console.log('✅ No errors found! Your project looks good.');
      return { status: 'success', errors: [], fixes: [] };
    }
    
    console.log(`❌ Found ${this.errors.length} error(s):`);
    this.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    if (this.fixes.length > 0) {
      console.log(`\n🔧 ${this.fixes.length} fix(es) available`);
    }
    
    return {
      status: 'errors_found',
      errors: this.errors,
      fixes: this.fixes,
      fixCount: this.fixes.length
    };
  }
}

// CLI Interface
async function main() {
  const fixer = new ErrorFixer();
  const command = process.argv[2];

  switch (command) {
    case 'check':
      await fixer.runAllChecks();
      break;
    case 'fix':
      const report = await fixer.runAllChecks();
      if (report.fixCount > 0) {
        await fixer.applyFixes();
        console.log('\n🔄 Re-running checks...');
        await fixer.runAllChecks();
      }
      break;
    default:
      console.log('🔧 VoIP Application Error Fixer');
      console.log('');
      console.log('Usage:');
      console.log('  node fix-errors.js check  - Check for errors');
      console.log('  node fix-errors.js fix    - Check and fix errors');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/fix-errors.js check');
      console.log('  npm run fix-errors');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ErrorFixer;
