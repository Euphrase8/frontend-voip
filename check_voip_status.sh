#!/bin/bash

# VoIP System Status Checker
# Run this script from your PC (172.20.10.8) to check the status of your VoIP system

echo "=== VoIP System Status Checker ==="
echo "Checking connectivity and status..."

# Configuration
ASTERISK_IP="172.20.10.6"
BACKEND_IP="172.20.10.8"
AMI_PORT=5038
WEBSOCKET_PORT=8088
BACKEND_PORT=8080

echo ""
echo "1. Testing Network Connectivity..."

# Test AMI port
echo -n "   Testing AMI port ($ASTERISK_IP:$AMI_PORT)..."
if timeout 3 bash -c "</dev/tcp/$ASTERISK_IP/$AMI_PORT" 2>/dev/null; then
    echo " ✓ OPEN"
else
    echo " ✗ CLOSED"
fi

# Test WebSocket port
echo -n "   Testing WebSocket port ($ASTERISK_IP:$WEBSOCKET_PORT)..."
if timeout 3 bash -c "</dev/tcp/$ASTERISK_IP/$WEBSOCKET_PORT" 2>/dev/null; then
    echo " ✓ OPEN"
else
    echo " ✗ CLOSED"
fi

# Test Backend port
echo -n "   Testing Backend port ($BACKEND_IP:$BACKEND_PORT)..."
if timeout 3 bash -c "</dev/tcp/$BACKEND_IP/$BACKEND_PORT" 2>/dev/null; then
    echo " ✓ OPEN"
else
    echo " ✗ CLOSED"
fi

echo ""
echo "2. Testing Backend Health..."
if command -v curl >/dev/null 2>&1; then
    response=$(curl -s --connect-timeout 5 "http://$BACKEND_IP:$BACKEND_PORT/health" 2>/dev/null)
    if echo "$response" | grep -q '"status":"ok"'; then
        echo "   Backend health: ✓ OK"
    else
        echo "   Backend health: ✗ UNHEALTHY"
    fi
else
    echo "   Backend health: ? CURL NOT AVAILABLE"
fi

echo ""
echo "3. Testing WebSocket Endpoint..."
if command -v curl >/dev/null 2>&1; then
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$ASTERISK_IP:$WEBSOCKET_PORT/ws" 2>/dev/null)
    if [ "$http_code" = "426" ] || [ "$http_code" = "200" ]; then
        echo "   WebSocket endpoint: ✓ RESPONDING"
    else
        echo "   WebSocket endpoint: ✗ NOT RESPONDING (HTTP $http_code)"
    fi
else
    echo "   WebSocket endpoint: ? CURL NOT AVAILABLE"
fi

echo ""
echo "4. Manual Commands to Run on Asterisk Server:"
echo "   SSH to your Kali Linux server (172.20.10.6) and run:"
echo "   sudo asterisk -rx 'pjsip show endpoints'"
echo "   sudo asterisk -rx 'pjsip show contacts'"
echo "   sudo asterisk -rx 'pjsip show transports'"
echo "   sudo asterisk -rx 'manager show connected'"

echo ""
echo "5. Backend Diagnostic Endpoint:"
echo "   To check backend diagnostics, you need a JWT token."
echo "   1. Login to your frontend application"
echo "   2. Open browser console and run: localStorage.getItem('token')"
echo "   3. Then run this command with your token:"
echo "   curl -H \"Authorization: Bearer YOUR_TOKEN\" http://172.20.10.8:8080/protected/diagnostics"

echo ""
echo "=== Next Steps ==="
echo "1. If any ports are CLOSED, check firewall settings on Asterisk server"
echo "2. If backend is UNREACHABLE, make sure it's running with 'cd backend && make dev'"
echo "3. Run the manual commands on Asterisk server to check endpoint configuration"
echo "4. Check the TROUBLESHOOTING_GUIDE.md file for detailed solutions"

echo ""
echo "Press Enter to continue..."
read
