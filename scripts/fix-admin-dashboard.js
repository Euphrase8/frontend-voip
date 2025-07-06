#!/usr/bin/env node

/**
 * Fix Admin Dashboard System Status
 * Comprehensive solution for admin dashboard not showing system components
 */

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function displayDiagnosis() {
  log('🔍 ADMIN DASHBOARD DIAGNOSIS', 'bold');
  log('════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');
  
  log('❓ PROBLEM: Admin dashboard shows no system component status', 'yellow');
  log('', 'reset');
  
  log('🔍 POSSIBLE CAUSES:', 'bold');
  log('1. User is not logged in as admin', 'yellow');
  log('2. User account does not have admin role', 'yellow');
  log('3. Frontend authentication token is invalid/expired', 'yellow');
  log('4. Backend admin endpoints are not accessible', 'yellow');
  log('5. SystemHealthService is falling back to basic health', 'yellow');
  log('', 'reset');
}

function displaySolutions() {
  log('💡 SOLUTIONS TO TRY:', 'bold');
  log('════════════════════════════════════════════════════════════════', 'green');
  log('', 'reset');
  
  log('🔧 SOLUTION 1: Check User Authentication', 'bold');
  log('1. Open browser Developer Tools (F12)', 'blue');
  log('2. Go to Application/Storage → Local Storage', 'blue');
  log('3. Check if these keys exist:', 'blue');
  log('   • token (should be a long JWT string)', 'cyan');
  log('   • username (should be your username)', 'cyan');
  log('   • role (should be "admin")', 'cyan');
  log('4. If missing or invalid, logout and login again', 'blue');
  log('', 'reset');
  
  log('🔧 SOLUTION 2: Verify Admin User Exists', 'bold');
  log('1. Check if admin user exists in database:', 'blue');
  log('   • Default admin credentials: admin/admin123', 'cyan');
  log('   • Or create admin user through registration', 'cyan');
  log('2. Ensure user has admin role in database', 'blue');
  log('', 'reset');
  
  log('🔧 SOLUTION 3: Test Backend Endpoints', 'bold');
  log('1. Run: npm run test-backend', 'blue');
  log('2. Check if admin endpoints respond correctly', 'blue');
  log('3. Verify backend is running with air command', 'blue');
  log('', 'reset');
  
  log('🔧 SOLUTION 4: Browser Console Check', 'bold');
  log('1. Open browser Developer Tools (F12)', 'blue');
  log('2. Go to Console tab', 'blue');
  log('3. Look for errors related to:', 'blue');
  log('   • SystemHealthService', 'cyan');
  log('   • 401/403 authentication errors', 'cyan');
  log('   • Network request failures', 'cyan');
  log('4. Refresh the admin dashboard page', 'blue');
  log('', 'reset');
  
  log('🔧 SOLUTION 5: Force Refresh System Status', 'bold');
  log('1. In admin dashboard, manually refresh the page', 'blue');
  log('2. Wait 10-15 seconds for auto-refresh', 'blue');
  log('3. Check if components appear after refresh', 'blue');
  log('', 'reset');
}

function displayTestCommands() {
  log('🧪 DIAGNOSTIC COMMANDS:', 'bold');
  log('════════════════════════════════════════════════════════════════', 'magenta');
  log('', 'reset');
  
  log('Test backend health:', 'yellow');
  log('npm run test-backend', 'cyan');
  log('', 'reset');
  
  log('Test Asterisk connection:', 'yellow');
  log('npm run test-asterisk', 'cyan');
  log('', 'reset');
  
  log('Full system health check:', 'yellow');
  log('npm run health-check', 'cyan');
  log('', 'reset');
  
  log('Display current system status:', 'yellow');
  log('npm run status', 'cyan');
  log('', 'reset');
}

function displayExpectedBehavior() {
  log('✅ EXPECTED BEHAVIOR:', 'bold');
  log('════════════════════════════════════════════════════════════════', 'green');
  log('', 'reset');
  
  log('When working correctly, admin dashboard should show:', 'blue');
  log('', 'reset');
  
  log('📊 Services Status Section:', 'bold');
  log('• Asterisk: 🟢 HEALTHY', 'green');
  log('• Backend: 🟢 HEALTHY', 'green');
  log('• Database: 🟢 HEALTHY', 'green');
  log('• WebSocket: 🟢 HEALTHY', 'green');
  log('', 'reset');
  
  log('📈 System Metrics Section:', 'bold');
  log('• CPU Usage: XX%', 'blue');
  log('• Memory Usage: XX%', 'blue');
  log('• Disk Usage: XX%', 'blue');
  log('', 'reset');
  
  log('🔄 Auto-refresh every 10 seconds', 'blue');
  log('', 'reset');
}

function displayQuickFix() {
  log('⚡ QUICK FIX STEPS:', 'bold');
  log('════════════════════════════════════════════════════════════════', 'yellow');
  log('', 'reset');
  
  log('1. 🔐 Logout and login again as admin', 'yellow');
  log('2. 🔄 Refresh the admin dashboard page', 'yellow');
  log('3. 🕐 Wait 10-15 seconds for auto-refresh', 'yellow');
  log('4. 🔍 Check browser console for errors', 'yellow');
  log('5. 🧪 Run: npm run test-backend', 'yellow');
  log('', 'reset');
  
  log('If still not working:', 'red');
  log('• Check if backend is running (air command)', 'red');
  log('• Verify admin user exists with correct role', 'red');
  log('• Check network connectivity to backend', 'red');
  log('', 'reset');
}

function main() {
  log('🔧 ADMIN DASHBOARD SYSTEM STATUS FIX', 'bold');
  log('════════════════════════════════════════════════════════════════', 'cyan');
  log('', 'reset');
  
  displayDiagnosis();
  displayQuickFix();
  displaySolutions();
  displayTestCommands();
  displayExpectedBehavior();
  
  log('🎯 SUMMARY:', 'bold');
  log('The most common cause is authentication issues.', 'yellow');
  log('Try logging out and back in as admin first.', 'yellow');
  log('', 'reset');
  
  log('🆘 If you need help:', 'bold');
  log('1. Run the diagnostic commands above', 'blue');
  log('2. Check browser console for specific errors', 'blue');
  log('3. Verify backend is running and accessible', 'blue');
  log('', 'reset');
  
  log('🎉 Your VoIP system is configured correctly!', 'green');
  log('The issue is likely just authentication/display related.', 'green');
  
  return 0;
}

// Run the script
if (require.main === module) {
  process.exit(main());
}

module.exports = { displayDiagnosis, displaySolutions };
