#!/bin/bash

#
# Test Asterisk Connectivity from PC
# Run this script from your PC (172.20.10.4) to test Asterisk connectivity
#
# Usage: ./test-asterisk-from-pc.sh
#

# Configuration
ASTERISK_IP="172.20.10.5"
AMI_PORT="5038"
HTTP_PORT="8088"
SIP_PORT="5060"

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

echo -e "${BLUE}=== TESTING ASTERISK CONNECTIVITY FROM PC ===${NC}"
echo -e "Testing connection to Asterisk server at $ASTERISK_IP\n"

# Test 1: Basic Network Connectivity
print_status "Testing basic network connectivity..."
if ping -c 3 -W 3 "$ASTERISK_IP" > /dev/null 2>&1; then
    print_success "Network connectivity to $ASTERISK_IP is working"
else
    print_error "Cannot reach $ASTERISK_IP - check network connectivity"
    exit 1
fi

# Test 2: AMI Port (5038)
print_status "Testing AMI port ($AMI_PORT)..."
if timeout 5 bash -c "</dev/tcp/$ASTERISK_IP/$AMI_PORT" 2>/dev/null; then
    print_success "AMI port $AMI_PORT is accessible"
    
    # Test AMI login
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

# Test 3: HTTP Port (8088)
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
    else
        print_warning "curl not available for HTTP testing"
    fi
else
    print_error "HTTP port $HTTP_PORT is not accessible"
fi

# Test 4: SIP Port (5060)
print_status "Testing SIP port ($SIP_PORT)..."
if timeout 5 bash -c "</dev/tcp/$ASTERISK_IP/$SIP_PORT" 2>/dev/null; then
    print_success "SIP TCP port $SIP_PORT is accessible"
else
    print_warning "SIP TCP port $SIP_PORT not accessible (UDP may be working)"
fi

# Test 5: WebSocket Endpoint
print_status "Testing WebSocket endpoint..."
if command -v curl >/dev/null 2>&1; then
    WS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ASTERISK_IP:$HTTP_PORT/ws" 2>/dev/null)
    if [ "$WS_RESPONSE" = "426" ] || [ "$WS_RESPONSE" = "400" ]; then
        print_success "WebSocket endpoint is available (HTTP $WS_RESPONSE)"
    else
        print_warning "WebSocket endpoint responded with: $WS_RESPONSE"
    fi
else
    print_warning "curl not available for WebSocket testing"
fi

# Test 6: Backend Health Check (if backend is running)
print_status "Testing backend health check..."
if command -v curl >/dev/null 2>&1; then
    BACKEND_RESPONSE=$(curl -s --connect-timeout 5 "http://localhost:8080/api/health" 2>/dev/null)
    if echo "$BACKEND_RESPONSE" | grep -q "success"; then
        print_success "Backend health check successful"
        
        # Check if Asterisk is reported as healthy
        if echo "$BACKEND_RESPONSE" | grep -q '"asterisk"' && echo "$BACKEND_RESPONSE" | grep -q '"healthy"'; then
            print_success "Backend reports Asterisk as healthy"
        else
            print_warning "Backend may not report Asterisk as healthy yet"
        fi
    else
        print_warning "Backend health check failed or backend not running"
    fi
else
    print_warning "curl not available for backend testing"
fi

# Summary
echo -e "\n${BLUE}=== CONNECTION SUMMARY ===${NC}"
echo -e "Asterisk Server: $ASTERISK_IP"
echo -e "AMI Port: $AMI_PORT"
echo -e "HTTP Port: $HTTP_PORT"
echo -e "SIP Port: $SIP_PORT"

echo -e "\n${BLUE}=== MANUAL TEST COMMANDS ===${NC}"
echo -e "You can manually test these connections:"
echo -e "  telnet $ASTERISK_IP $AMI_PORT"
echo -e "  curl http://$ASTERISK_IP:$HTTP_PORT/"
echo -e "  nc -zv $ASTERISK_IP $AMI_PORT"
echo -e "  nc -zuv $ASTERISK_IP $SIP_PORT"

echo -e "\n${BLUE}=== NEXT STEPS ===${NC}"
echo -e "1. If all tests pass, check your VoIP application dashboard"
echo -e "2. The system status should show Asterisk as 'healthy'"
echo -e "3. You can now register SIP clients with extensions 1000-1003"
echo -e "4. Test calls between extensions"

echo -e "\n${GREEN}Connectivity test complete!${NC}"
