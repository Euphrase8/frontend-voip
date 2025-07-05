#!/bin/bash

#
# Comprehensive Test Script for All VoIP Fixes
# Run this script from your PC (172.20.10.4) to test all fixes
#
# Usage: ./test-all-fixes.sh
#

# Configuration
ASTERISK_IP="172.20.10.5"
AMI_PORT="5038"
HTTP_PORT="8088"
SIP_PORT="5060"
BACKEND_PORT="8080"

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

echo -e "${BLUE}=== COMPREHENSIVE VOIP SYSTEM TEST ===${NC}"
echo -e "Testing all fixes: Asterisk health, system performance, and microphone access\n"

# Test 1: Basic Network Connectivity
print_header "Test 1: Network Connectivity"
print_status "Testing network connectivity to Asterisk server..."
if ping -c 3 -W 3 "$ASTERISK_IP" > /dev/null 2>&1; then
    print_success "Network connectivity to $ASTERISK_IP is working"
else
    print_error "Cannot reach $ASTERISK_IP - check network connectivity"
    exit 1
fi

# Test 2: Asterisk Service Ports
print_header "Test 2: Asterisk Service Ports"

# Test AMI Port (5038)
print_status "Testing AMI port ($AMI_PORT)..."
if timeout 5 bash -c "</dev/tcp/$ASTERISK_IP/$AMI_PORT" 2>/dev/null; then
    print_success "AMI port $AMI_PORT is accessible"
    
    # Test AMI authentication
    print_status "Testing AMI authentication..."
    AMI_RESPONSE=$(timeout 10 bash -c "
    exec 3<>/dev/tcp/$ASTERISK_IP/$AMI_PORT
    echo -e 'Action: Login\r\nUsername: admin\r\nSecret: amp111\r\n\r\n' >&3
    sleep 2
    echo -e 'Action: Ping\r\n\r\n' >&3
    sleep 2
    echo -e 'Action: Logoff\r\n\r\n' >&3
    timeout 3 cat <&3
    exec 3<&-
    exec 3>&-
    " 2>/dev/null)
    
    if echo "$AMI_RESPONSE" | grep -q "Response: Success"; then
        print_success "AMI authentication successful"
    else
        print_error "AMI authentication failed"
        echo "Response: $AMI_RESPONSE"
    fi
else
    print_error "AMI port $AMI_PORT is not accessible"
fi

# Test HTTP Port (8088)
print_status "Testing HTTP port ($HTTP_PORT)..."
if timeout 5 bash -c "</dev/tcp/$ASTERISK_IP/$HTTP_PORT" 2>/dev/null; then
    print_success "HTTP port $HTTP_PORT is accessible"
    
    # Test HTTP response
    if command -v curl >/dev/null 2>&1; then
        print_status "Testing HTTP response..."
        HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ASTERISK_IP:$HTTP_PORT/" 2>/dev/null)
        if [ "$HTTP_RESPONSE" = "200" ] || [ "$HTTP_RESPONSE" = "404" ] || [ "$HTTP_RESPONSE" = "301" ]; then
            print_success "HTTP interface is responding (HTTP $HTTP_RESPONSE)"
        else
            print_warning "HTTP interface responded with code: $HTTP_RESPONSE"
        fi
    fi
else
    print_error "HTTP port $HTTP_PORT is not accessible"
fi

# Test SIP Port (5060)
print_status "Testing SIP port ($SIP_PORT)..."
if timeout 5 bash -c "</dev/tcp/$ASTERISK_IP/$SIP_PORT" 2>/dev/null; then
    print_success "SIP TCP port $SIP_PORT is accessible"
else
    print_warning "SIP TCP port $SIP_PORT not accessible (UDP may be working)"
fi

# Test 3: Backend Health Check
print_header "Test 3: Backend Health Check"
print_status "Testing backend health endpoint..."

if command -v curl >/dev/null 2>&1; then
    BACKEND_RESPONSE=$(curl -s --connect-timeout 5 "http://localhost:$BACKEND_PORT/api/health" 2>/dev/null)
    if echo "$BACKEND_RESPONSE" | grep -q "success"; then
        print_success "Backend health check successful"
        
        # Check if Asterisk is reported as healthy
        if echo "$BACKEND_RESPONSE" | grep -q '"asterisk"' && echo "$BACKEND_RESPONSE" | grep -q '"healthy"'; then
            print_success "Backend reports Asterisk as healthy"
        else
            print_warning "Backend may not report Asterisk as healthy yet"
            echo "Backend response: $BACKEND_RESPONSE"
        fi
    else
        print_error "Backend health check failed"
        echo "Response: $BACKEND_RESPONSE"
    fi
else
    print_warning "curl not available for backend testing"
fi

# Test 4: System Performance
print_header "Test 4: System Performance Test"
print_status "Testing system response times..."

# Test backend response time
if command -v curl >/dev/null 2>&1; then
    START_TIME=$(date +%s%N)
    HEALTH_RESPONSE=$(curl -s --connect-timeout 10 "http://localhost:$BACKEND_PORT/api/health" 2>/dev/null)
    END_TIME=$(date +%s%N)
    RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds
    
    if [ "$RESPONSE_TIME" -lt 2000 ]; then
        print_success "Backend response time: ${RESPONSE_TIME}ms (Good)"
    elif [ "$RESPONSE_TIME" -lt 5000 ]; then
        print_warning "Backend response time: ${RESPONSE_TIME}ms (Acceptable)"
    else
        print_error "Backend response time: ${RESPONSE_TIME}ms (Slow)"
    fi
fi

# Test 5: Microphone Access (Browser Test)
print_header "Test 5: Microphone Access Instructions"
print_status "Microphone access must be tested in the browser..."

echo -e "\n${YELLOW}=== MICROPHONE TEST INSTRUCTIONS ===${NC}"
echo -e "1. Open your VoIP application in the browser"
echo -e "2. Try to make a call"
echo -e "3. When prompted, click 'Allow' for microphone access"
echo -e "4. If you get an error, the enhanced microphone fix will provide instructions"
echo -e "5. Check the browser console for detailed microphone diagnostics"

echo -e "\n${BLUE}=== BROWSER REQUIREMENTS ===${NC}"
echo -e "• Use HTTPS or localhost for microphone access"
echo -e "• Chrome/Edge: Version 80+ recommended"
echo -e "• Firefox: Version 75+ recommended"
echo -e "• Safari: Version 13+ recommended"

# Test 6: WebSocket Connection
print_header "Test 6: WebSocket Connection Test"
print_status "Testing WebSocket endpoint..."

if command -v curl >/dev/null 2>&1; then
    WS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ASTERISK_IP:$HTTP_PORT/ws" 2>/dev/null)
    if [ "$WS_RESPONSE" = "426" ] || [ "$WS_RESPONSE" = "400" ]; then
        print_success "WebSocket endpoint is available (HTTP $WS_RESPONSE)"
    else
        print_warning "WebSocket endpoint responded with: $WS_RESPONSE"
    fi
fi

# Summary and Next Steps
print_header "Test Summary and Next Steps"

echo -e "\n${GREEN}=== TEST RESULTS SUMMARY ===${NC}"
echo -e "Asterisk Server: $ASTERISK_IP"
echo -e "AMI Port: $AMI_PORT"
echo -e "HTTP Port: $HTTP_PORT"
echo -e "Backend Port: $BACKEND_PORT"

echo -e "\n${BLUE}=== NEXT STEPS ===${NC}"
echo -e "1. If Asterisk tests passed, restart your backend with the new .env configuration"
echo -e "2. Copy backend.env to your backend directory as .env"
echo -e "3. Restart your backend service"
echo -e "4. Test your VoIP application in the browser"
echo -e "5. Check the System Status page - Asterisk should show as 'healthy'"

echo -e "\n${YELLOW}=== BACKEND RESTART COMMANDS ===${NC}"
echo -e "cd /path/to/your/backend"
echo -e "cp backend.env .env"
echo -e "# Stop your backend service"
echo -e "# Start your backend service"
echo -e "# Check logs for any errors"

echo -e "\n${BLUE}=== TROUBLESHOOTING ===${NC}"
echo -e "If issues persist:"
echo -e "• Check backend logs for connection errors"
echo -e "• Verify .env file has correct Asterisk IP (172.20.10.5)"
echo -e "• Test microphone in browser settings"
echo -e "• Try different browsers for microphone access"
echo -e "• Check firewall settings on both machines"

echo -e "\n${GREEN}Comprehensive test completed!${NC}"
