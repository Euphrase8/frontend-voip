#!/bin/bash

# Test WebSocket Fix Script
# Quick test to verify WebSocket connections are working

echo "🧪 WebSocket Connection Test"
echo "============================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test 1: Asterisk HTTP endpoint
print_test "Testing Asterisk HTTP endpoint..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8088/" 2>/dev/null)
if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "404" ]; then
    print_pass "Asterisk HTTP is responding (HTTP $HTTP_RESPONSE)"
else
    print_fail "Asterisk HTTP not responding (HTTP $HTTP_RESPONSE)"
fi

# Test 2: Asterisk WebSocket endpoint
print_test "Testing Asterisk WebSocket endpoint..."
WS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8088/ws" 2>/dev/null)
if [ "$WS_RESPONSE" = "426" ]; then
    print_pass "Asterisk WebSocket endpoint correct (HTTP 426 - Upgrade Required)"
elif [ "$WS_RESPONSE" = "400" ]; then
    print_pass "Asterisk WebSocket endpoint responding (HTTP 400)"
else
    print_fail "Asterisk WebSocket endpoint issue (HTTP $WS_RESPONSE)"
fi

# Test 3: Backend WebSocket endpoint
print_test "Testing Backend WebSocket endpoint..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8080/ws" 2>/dev/null)
if [ "$BACKEND_RESPONSE" = "400" ]; then
    print_pass "Backend WebSocket endpoint responding (HTTP 400 - needs extension)"
elif [ "$BACKEND_RESPONSE" = "426" ]; then
    print_pass "Backend WebSocket endpoint responding (HTTP 426)"
else
    print_warn "Backend WebSocket endpoint (HTTP $BACKEND_RESPONSE) - check if backend is running"
fi

# Test 4: Asterisk WebSocket with proper headers
print_test "Testing Asterisk WebSocket with upgrade headers..."
WS_UPGRADE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    --connect-timeout 5 "http://localhost:8088/ws" 2>/dev/null)

if [ "$WS_UPGRADE_RESPONSE" = "101" ]; then
    print_pass "WebSocket upgrade successful (HTTP 101)"
elif [ "$WS_UPGRADE_RESPONSE" = "426" ]; then
    print_pass "WebSocket upgrade headers recognized (HTTP 426)"
else
    print_warn "WebSocket upgrade test (HTTP $WS_UPGRADE_RESPONSE)"
fi

# Test 5: Check Asterisk modules
print_test "Checking Asterisk WebSocket module..."
if asterisk -rx "module show like websocket" 2>/dev/null | grep -q "res_http_websocket.so"; then
    print_pass "WebSocket module is loaded"
else
    print_fail "WebSocket module not loaded"
fi

# Test 6: Check Asterisk HTTP status
print_test "Checking Asterisk HTTP configuration..."
HTTP_STATUS=$(asterisk -rx "http show status" 2>/dev/null)
if echo "$HTTP_STATUS" | grep -q "HTTP Server Status: Enabled"; then
    print_pass "Asterisk HTTP server is enabled"
    
    # Check if prefix is disabled
    if echo "$HTTP_STATUS" | grep -q "Prefix:" && ! echo "$HTTP_STATUS" | grep -q "Prefix: asterisk"; then
        print_pass "HTTP prefix is correctly disabled"
    elif ! echo "$HTTP_STATUS" | grep -q "Prefix:"; then
        print_pass "No HTTP prefix configured (correct)"
    else
        print_warn "HTTP prefix may still be set"
    fi
else
    print_fail "Asterisk HTTP server not enabled"
fi

# Test 7: Application connection test
print_test "Testing application connection test endpoint..."
APP_TEST_RESPONSE=$(curl -s -X POST "http://localhost:8080/api/test-asterisk" 2>/dev/null)
if echo "$APP_TEST_RESPONSE" | grep -q '"websocket".*"success":true'; then
    print_pass "Application WebSocket test passes"
elif echo "$APP_TEST_RESPONSE" | grep -q '"websocket"'; then
    print_warn "Application WebSocket test exists but may be failing"
else
    print_warn "Could not test application endpoint - check if backend is running"
fi

echo ""
echo "=== Test Summary ==="
echo "If all tests pass, your WebSocket connection should be working."
echo "If any tests fail, check the following:"
echo ""
echo "1. Asterisk HTTP issues:"
echo "   - sudo systemctl status asterisk"
echo "   - sudo asterisk -rx 'http show status'"
echo ""
echo "2. Backend issues:"
echo "   - Check if backend is running: ps aux | grep voip-backend"
echo "   - Check backend logs: tail -f backend/backend.log"
echo ""
echo "3. Configuration issues:"
echo "   - Check /etc/asterisk/http.conf for prefix setting"
echo "   - Restart Asterisk: sudo systemctl restart asterisk"
echo ""
echo "4. Application test:"
echo "   - Refresh your VoIP application page"
echo "   - Run the connection test in the application"
echo "   - WebSocket should show 'Connected' instead of 'Failed'"
