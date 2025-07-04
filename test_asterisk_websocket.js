#!/usr/bin/env node

/**
 * Test Asterisk WebSocket Connection
 * This script tests the WebSocket connection to Asterisk with proper headers
 */

const WebSocket = require('ws');

// Configuration
const ASTERISK_HOST = process.env.ASTERISK_HOST || '172.20.10.5';
const ASTERISK_PORT = process.env.ASTERISK_PORT || '8088';
const ASTERISK_WS_URL = `ws://${ASTERISK_HOST}:${ASTERISK_PORT}/ws`;

console.log('🔌 Asterisk WebSocket Connection Test');
console.log('=====================================');
console.log(`Target URL: ${ASTERISK_WS_URL}`);
console.log(`Protocol: sip`);
console.log('');

// Test function
function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    console.log('📡 Attempting to connect...');
    
    // Create WebSocket with SIP protocol
    const ws = new WebSocket(ASTERISK_WS_URL, ['sip'], {
      headers: {
        'User-Agent': 'Asterisk-WebSocket-Test/1.0',
        'Origin': `http://${ASTERISK_HOST}`,
      }
    });

    // Set connection timeout
    const timeout = setTimeout(() => {
      console.log('⏰ Connection timeout (10 seconds)');
      ws.terminate();
      reject(new Error('Connection timeout'));
    }, 10000);

    ws.on('open', function open() {
      clearTimeout(timeout);
      console.log('✅ WebSocket connection opened successfully!');
      console.log(`   Protocol: ${ws.protocol || 'none'}`);
      console.log(`   Ready State: ${ws.readyState}`);
      console.log(`   URL: ${ws.url}`);
      
      // Send a test SIP OPTIONS message
      const sipOptions = [
        'OPTIONS sip:test@asterisk SIP/2.0',
        'Via: SIP/2.0/WS test.example.com;branch=z9hG4bK123456',
        'From: <sip:test@asterisk>;tag=123456',
        'To: <sip:test@asterisk>',
        'Call-ID: test-call-id@test.example.com',
        'CSeq: 1 OPTIONS',
        'Content-Length: 0',
        '',
        ''
      ].join('\r\n');

      console.log('📤 Sending SIP OPTIONS message...');
      ws.send(sipOptions);

      // Close connection after 5 seconds
      setTimeout(() => {
        console.log('🔌 Closing connection...');
        ws.close(1000, 'Test completed');
        resolve('Connection test successful');
      }, 5000);
    });

    ws.on('message', function message(data) {
      console.log('📨 Received message:');
      console.log(data.toString());
      console.log('');
    });

    ws.on('error', function error(err) {
      clearTimeout(timeout);
      console.log('❌ WebSocket error occurred:');
      console.log(`   Error: ${err.message}`);
      console.log(`   Code: ${err.code || 'N/A'}`);
      reject(err);
    });

    ws.on('close', function close(code, reason) {
      clearTimeout(timeout);
      console.log('🔌 WebSocket connection closed');
      console.log(`   Close code: ${code}`);
      console.log(`   Close reason: ${reason || 'No reason provided'}`);
      console.log(`   Was clean: ${code === 1000}`);
      
      if (code === 1006) {
        console.log('   ⚠️  Code 1006 indicates connection failed or server not reachable');
      } else if (code === 1002) {
        console.log('   ⚠️  Code 1002 indicates protocol error');
      } else if (code === 1011) {
        console.log('   ⚠️  Code 1011 indicates server error');
      }
    });
  });
}

// Test HTTP endpoint first
async function testHttpEndpoint() {
  console.log('🌐 Testing HTTP endpoint first...');
  
  try {
    const http = require('http');
    const url = require('url');
    
    const httpUrl = `http://${ASTERISK_HOST}:${ASTERISK_PORT}/ws`;
    const parsedUrl = url.parse(httpUrl);
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: 'GET',
        timeout: 5000
      }, (res) => {
        console.log(`   HTTP Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        if (res.statusCode === 426) {
          console.log('✅ HTTP endpoint correctly returns 426 (Upgrade Required)');
        } else if (res.statusCode === 400) {
          console.log('✅ HTTP endpoint returns 400 (Bad Request) - endpoint exists');
        } else {
          console.log(`⚠️  Unexpected HTTP status: ${res.statusCode}`);
        }
        
        resolve(res.statusCode);
      });
      
      req.on('error', (err) => {
        console.log(`❌ HTTP test failed: ${err.message}`);
        reject(err);
      });
      
      req.on('timeout', () => {
        console.log('⏰ HTTP request timeout');
        req.destroy();
        reject(new Error('HTTP timeout'));
      });
      
      req.end();
    });
  } catch (error) {
    console.log(`❌ HTTP test error: ${error.message}`);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    // Test HTTP endpoint
    await testHttpEndpoint();
    console.log('');
    
    // Test WebSocket connection
    await testWebSocketConnection();
    
    console.log('');
    console.log('🎉 All tests completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. If tests passed, your Asterisk WebSocket is working correctly');
    console.log('2. Check your application WebSocket connection code');
    console.log('3. Ensure proper SIP protocol is specified in WebSocket connection');
    console.log('4. Monitor Asterisk logs for connection attempts');
    
  } catch (error) {
    console.log('');
    console.log('❌ Test failed:');
    console.log(`   ${error.message}`);
    console.log('');
    console.log('Troubleshooting steps:');
    console.log('1. Check if Asterisk is running: systemctl status asterisk');
    console.log('2. Check Asterisk HTTP configuration: asterisk -rx "http show status"');
    console.log('3. Check firewall settings for port 8088');
    console.log('4. Check network connectivity to Asterisk server');
    console.log('5. Review Asterisk logs: tail -f /var/log/asterisk/messages');
    
    process.exit(1);
  }
}

// Run the tests
runTests();
