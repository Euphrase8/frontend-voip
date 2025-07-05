#!/bin/bash

#
# WebSocket Connection Test Script
# Run this from your PC (172.20.10.4) to test WebSocket connection to Asterisk
#
# Usage: ./test-websocket-connection.sh
#

# Configuration
ASTERISK_IP="172.20.10.5"
WS_PORT="8088"
WS_URL="ws://${ASTERISK_IP}:${WS_PORT}/ws"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

echo -e "${BLUE}=== ASTERISK WEBSOCKET CONNECTION TEST ===${NC}"
echo -e "Testing WebSocket connection from PC to Asterisk server\n"

# Test 1: Basic Network Connectivity
print_header "Test 1: Network Connectivity"
print_status "Testing network connectivity to Asterisk server..."
if ping -c 3 -W 3 "$ASTERISK_IP" > /dev/null 2>&1; then
    print_success "Network connectivity to $ASTERISK_IP is working"
else
    print_error "Cannot reach $ASTERISK_IP - check network connectivity"
    exit 1
fi

# Test 2: HTTP Port Accessibility
print_header "Test 2: HTTP Port Test"
print_status "Testing HTTP port ($WS_PORT)..."
if timeout 5 bash -c "</dev/tcp/$ASTERISK_IP/$WS_PORT" 2>/dev/null; then
    print_success "HTTP port $WS_PORT is accessible"
else
    print_error "HTTP port $WS_PORT is not accessible"
    exit 1
fi

# Test 3: HTTP Response
print_header "Test 3: HTTP Interface Test"
if command -v curl >/dev/null 2>&1; then
    print_status "Testing HTTP interface response..."
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ASTERISK_IP:$WS_PORT/" 2>/dev/null)
    if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "404" ] || [ "$HTTP_RESPONSE" = "301" ]; then
        print_success "HTTP interface is responding (HTTP $HTTP_RESPONSE)"
    else
        print_warning "HTTP interface responded with code: $HTTP_RESPONSE"
    fi
else
    print_warning "curl not available for HTTP testing"
fi

# Test 4: WebSocket Upgrade Request
print_header "Test 4: WebSocket Upgrade Test"
if command -v curl >/dev/null 2>&1; then
    print_status "Testing WebSocket upgrade request..."
    
    # Test WebSocket upgrade with proper headers
    WS_RESPONSE=$(curl -s -i --connect-timeout 10 \
        -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Protocol: sip" \
        -H "Origin: http://$ASTERISK_IP:3000" \
        "http://$ASTERISK_IP:$WS_PORT/ws" 2>/dev/null)
    
    # Check response
    if echo "$WS_RESPONSE" | grep -q "HTTP/1.1 101"; then
        print_success "WebSocket upgrade successful (HTTP 101 Switching Protocols)"
    elif echo "$WS_RESPONSE" | grep -q "HTTP/1.1 426"; then
        print_success "WebSocket endpoint found (HTTP 426 Upgrade Required)"
    elif echo "$WS_RESPONSE" | grep -q "HTTP/1.1 400"; then
        print_warning "WebSocket endpoint responded with HTTP 400 (Bad Request)"
        echo "This might indicate header issues or configuration problems"
    else
        print_error "WebSocket upgrade failed"
        echo "Response headers:"
        echo "$WS_RESPONSE" | head -10
    fi
else
    print_warning "curl not available for WebSocket testing"
fi

# Test 5: WebSocket with Node.js (if available)
print_header "Test 5: Advanced WebSocket Test"
if command -v node >/dev/null 2>&1; then
    print_status "Testing WebSocket connection with Node.js..."
    
    # Create temporary Node.js WebSocket test
    cat > /tmp/ws_test.js << 'EOF'
const WebSocket = require('ws');

const ws = new WebSocket('ws://172.20.10.5:8088/ws', ['sip'], {
    headers: {
        'Origin': 'http://172.20.10.4:3000'
    }
});

let connected = false;

ws.on('open', function open() {
    console.log('✅ WebSocket connection established');
    connected = true;
    
    // Send a test message
    ws.send(JSON.stringify({
        type: 'test',
        message: 'Hello from PC'
    }));
    
    setTimeout(() => {
        ws.close();
    }, 2000);
});

ws.on('message', function message(data) {
    console.log('📨 Received:', data.toString());
});

ws.on('close', function close(code, reason) {
    console.log(`🔌 Connection closed: ${code} ${reason}`);
    process.exit(connected ? 0 : 1);
});

ws.on('error', function error(err) {
    console.log('❌ WebSocket error:', err.message);
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    if (!connected) {
        console.log('⏰ Connection timeout');
        ws.close();
        process.exit(1);
    }
}, 10000);
EOF

    # Check if ws module is available
    if node -e "require('ws')" 2>/dev/null; then
        if timeout 15 node /tmp/ws_test.js; then
            print_success "Node.js WebSocket test passed"
        else
            print_error "Node.js WebSocket test failed"
        fi
    else
        print_warning "Node.js 'ws' module not available, skipping advanced test"
        print_status "To install: npm install -g ws"
    fi
    
    # Clean up
    rm -f /tmp/ws_test.js
else
    print_warning "Node.js not available for advanced WebSocket testing"
fi

# Test 6: Browser WebSocket Test Instructions
print_header "Test 6: Browser WebSocket Test"
print_status "Creating browser WebSocket test..."

cat > /tmp/websocket_test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Asterisk WebSocket Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        #log { background: #f0f0f0; padding: 10px; height: 300px; overflow-y: scroll; }
    </style>
</head>
<body>
    <h1>Asterisk WebSocket Connection Test</h1>
    <button onclick="testWebSocket()">Test WebSocket Connection</button>
    <button onclick="clearLog()">Clear Log</button>
    <div id="log"></div>

    <script>
        function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : '';
            logDiv.innerHTML += '<div class="' + className + '">[' + timestamp + '] ' + message + '</div>';
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        function clearLog() {
            document.getElementById('log').innerHTML = '';
        }

        function testWebSocket() {
            log('Starting WebSocket connection test...');
            
            const ws = new WebSocket('ws://172.20.10.5:8088/ws', ['sip']);
            
            ws.onopen = function(event) {
                log('✅ WebSocket connection established!', 'success');
                
                // Send test message
                ws.send(JSON.stringify({
                    type: 'test',
                    message: 'Hello from browser'
                }));
                
                setTimeout(() => {
                    ws.close();
                }, 3000);
            };
            
            ws.onmessage = function(event) {
                log('📨 Received: ' + event.data, 'success');
            };
            
            ws.onclose = function(event) {
                log('🔌 Connection closed: ' + event.code + ' ' + event.reason);
            };
            
            ws.onerror = function(error) {
                log('❌ WebSocket error: ' + error, 'error');
            };
        }
        
        // Auto-test on page load
        window.onload = function() {
            log('Page loaded. Click "Test WebSocket Connection" to start test.');
        };
    </script>
</body>
</html>
EOF

print_success "Browser test created: /tmp/websocket_test.html"
print_status "Open this file in your browser to test WebSocket connection"

# Summary and Instructions
print_header "Test Summary and Next Steps"

echo -e "\n${GREEN}=== TEST RESULTS SUMMARY ===${NC}"
echo -e "Asterisk Server: $ASTERISK_IP"
echo -e "WebSocket URL: $WS_URL"
echo -e "WebSocket Port: $WS_PORT"

echo -e "\n${BLUE}=== BROWSER TEST ===${NC}"
echo -e "1. Open /tmp/websocket_test.html in your browser"
echo -e "2. Click 'Test WebSocket Connection'"
echo -e "3. Check for successful connection messages"

echo -e "\n${BLUE}=== FRONTEND INTEGRATION ===${NC}"
echo -e "Use this WebSocket URL in your VoIP application:"
echo -e "ws://172.20.10.5:8088/ws"
echo -e ""
echo -e "Example JavaScript code:"
echo -e "const ws = new WebSocket('ws://172.20.10.5:8088/ws', ['sip']);"

echo -e "\n${YELLOW}=== TROUBLESHOOTING ===${NC}"
echo -e "If WebSocket connection fails:"
echo -e "• Check Asterisk logs: sudo journalctl -u asterisk -f"
echo -e "• Verify http.conf has proper WebSocket settings"
echo -e "• Check firewall allows port 8088"
echo -e "• Ensure Origin headers are properly configured"

echo -e "\n${GREEN}WebSocket connection test completed!${NC}"
