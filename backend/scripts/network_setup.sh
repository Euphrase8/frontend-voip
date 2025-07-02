#!/bin/bash

# Network Setup and Testing Script for VoIP Backend
# This script helps identify the correct network configuration for multi-device calling

echo "=== VoIP Backend Network Setup ==="
echo

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get server's IP addresses
echo "1. Server Network Information:"
echo "------------------------------"

if command_exists ip; then
    echo "Available network interfaces:"
    ip addr show | grep -E "inet [0-9]" | grep -v "127.0.0.1" | awk '{print $2}' | cut -d'/' -f1 | while read ip; do
        echo "  - $ip"
    done
elif command_exists ifconfig; then
    echo "Available network interfaces:"
    ifconfig | grep -E "inet [0-9]" | grep -v "127.0.0.1" | awk '{print $2}' | while read ip; do
        echo "  - $ip"
    done
else
    echo "Cannot determine network interfaces. Please install 'ip' or 'ifconfig'."
fi

echo

# Check if server is running
echo "2. Server Status Check:"
echo "----------------------"

SERVER_PORT=${PORT:-8080}
echo "Checking if server is running on port $SERVER_PORT..."

if command_exists netstat; then
    if netstat -ln | grep -q ":$SERVER_PORT "; then
        echo "✓ Server is running on port $SERVER_PORT"
    else
        echo "✗ Server is not running on port $SERVER_PORT"
        echo "  Start the server with: go run main.go"
    fi
elif command_exists ss; then
    if ss -ln | grep -q ":$SERVER_PORT "; then
        echo "✓ Server is running on port $SERVER_PORT"
    else
        echo "✗ Server is not running on port $SERVER_PORT"
        echo "  Start the server with: go run main.go"
    fi
else
    echo "Cannot check server status. Please install 'netstat' or 'ss'."
fi

echo

# Test connectivity from different IPs
echo "3. Connectivity Test:"
echo "--------------------"

# Get the first non-localhost IP
if command_exists ip; then
    SERVER_IP=$(ip addr show | grep -E "inet [0-9]" | grep -v "127.0.0.1" | head -1 | awk '{print $2}' | cut -d'/' -f1)
elif command_exists ifconfig; then
    SERVER_IP=$(ifconfig | grep -E "inet [0-9]" | grep -v "127.0.0.1" | head -1 | awk '{print $2}')
else
    SERVER_IP="localhost"
fi

echo "Testing connectivity to server at $SERVER_IP:$SERVER_PORT"

if command_exists curl; then
    echo "Testing health endpoint..."
    if curl -s --connect-timeout 5 "http://$SERVER_IP:$SERVER_PORT/health" > /dev/null; then
        echo "✓ Server is accessible at http://$SERVER_IP:$SERVER_PORT"
    else
        echo "✗ Server is not accessible at http://$SERVER_IP:$SERVER_PORT"
        echo "  Check firewall settings and server configuration"
    fi
    
    echo "Testing config endpoint..."
    if curl -s --connect-timeout 5 "http://$SERVER_IP:$SERVER_PORT/config" > /dev/null; then
        echo "✓ Config endpoint is accessible"
        echo "  Frontend should use: http://$SERVER_IP:$SERVER_PORT"
        echo "  WebSocket URL: ws://$SERVER_IP:$SERVER_PORT/ws"
    else
        echo "✗ Config endpoint is not accessible"
    fi
else
    echo "curl not available. Please install curl for connectivity testing."
fi

echo

# WebSocket test
echo "4. WebSocket Test:"
echo "-----------------"

if command_exists go; then
    echo "Testing WebSocket connection..."
    echo "You can test WebSocket connectivity with:"
    echo "  cd scripts && go run test_websocket.go http://$SERVER_IP:$SERVER_PORT 1000"
else
    echo "Go not available. Install Go to test WebSocket connections."
fi

echo

# Configuration recommendations
echo "5. Configuration Recommendations:"
echo "--------------------------------"

echo "For multi-device calling on local network:"
echo
echo "Environment Variables:"
echo "  export PUBLIC_HOST=$SERVER_IP"
echo "  export PORT=$SERVER_PORT"
echo "  export DEBUG=true"
echo "  export CORS_ORIGINS=*"
echo
echo "Frontend Configuration:"
echo "  const API_URL = \"http://$SERVER_IP:$SERVER_PORT\";"
echo "  const WS_URL = \"ws://$SERVER_IP:$SERVER_PORT/ws\";"
echo
echo "Device Connection:"
echo "  Each device should connect to: ws://$SERVER_IP:$SERVER_PORT/ws?extension=XXXX"
echo

# Firewall check
echo "6. Firewall Configuration:"
echo "-------------------------"

echo "Ensure the following ports are open:"
echo "  - TCP $SERVER_PORT (HTTP/WebSocket)"
echo "  - Allow connections from local network devices"
echo

if command_exists ufw; then
    echo "Ubuntu/Debian firewall commands:"
    echo "  sudo ufw allow $SERVER_PORT"
    echo "  sudo ufw reload"
elif command_exists firewall-cmd; then
    echo "CentOS/RHEL firewall commands:"
    echo "  sudo firewall-cmd --permanent --add-port=$SERVER_PORT/tcp"
    echo "  sudo firewall-cmd --reload"
elif command_exists iptables; then
    echo "Generic iptables command:"
    echo "  sudo iptables -A INPUT -p tcp --dport $SERVER_PORT -j ACCEPT"
fi

echo

# Testing commands
echo "7. Testing Commands:"
echo "-------------------"

echo "Test server health:"
echo "  curl http://$SERVER_IP:$SERVER_PORT/health"
echo
echo "Test login (replace credentials):"
echo "  curl -X POST -H \"Content-Type: application/json\" \\"
echo "       -d '{\"username\":\"admin\",\"password\":\"password\"}' \\"
echo "       http://$SERVER_IP:$SERVER_PORT/api/login"
echo
echo "Test WebSocket connection:"
echo "  cd scripts && go run test_websocket.go http://$SERVER_IP:$SERVER_PORT 1000"
echo
echo "Check connection status (with auth token):"
echo "  curl -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "       http://$SERVER_IP:$SERVER_PORT/protected/extensions/status"
echo

echo "=== Setup Complete ==="
echo "Use the information above to configure your frontend and test connections."
echo "For troubleshooting, see WEBRTC_TROUBLESHOOTING.md"
