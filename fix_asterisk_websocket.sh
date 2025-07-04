#!/bin/bash

# Fix Asterisk WebSocket Configuration Script
# This script fixes the WebSocket connection issues with Asterisk

echo "🔧 Asterisk WebSocket Fix Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

print_status "Step 1: Backing up current Asterisk configuration..."
BACKUP_DIR="/etc/asterisk/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /etc/asterisk/http.conf "$BACKUP_DIR/" 2>/dev/null || print_warning "Could not backup http.conf"
cp /etc/asterisk/pjsip.conf "$BACKUP_DIR/" 2>/dev/null || print_warning "Could not backup pjsip.conf"
print_success "Configuration backed up to $BACKUP_DIR"

print_status "Step 2: Copying new configuration files..."
# Copy the fixed configuration files
if [ -f "./asterisk-config/http.conf" ]; then
    cp "./asterisk-config/http.conf" "/etc/asterisk/http.conf"
    print_success "Updated http.conf"
else
    print_error "asterisk-config/http.conf not found in current directory"
    exit 1
fi

if [ -f "./asterisk-config/pjsip.conf" ]; then
    cp "./asterisk-config/pjsip.conf" "/etc/asterisk/pjsip.conf"
    print_success "Updated pjsip.conf"
else
    print_error "asterisk-config/pjsip.conf not found in current directory"
    exit 1
fi

print_status "Step 2.1: Ensuring correct WebSocket path configuration..."
# Make sure the prefix is commented out in http.conf
sed -i 's/^prefix=asterisk/;prefix=asterisk/' /etc/asterisk/http.conf
sed -i 's/^prefix=/;prefix=/' /etc/asterisk/http.conf
print_success "WebSocket path configuration updated"

print_status "Step 3: Setting correct file permissions..."
chown asterisk:asterisk /etc/asterisk/http.conf
chown asterisk:asterisk /etc/asterisk/pjsip.conf
chmod 640 /etc/asterisk/http.conf
chmod 640 /etc/asterisk/pjsip.conf
print_success "File permissions set"

print_status "Step 4: Testing configuration syntax..."
asterisk -T -C /etc/asterisk/asterisk.conf
if [ $? -eq 0 ]; then
    print_success "Configuration syntax is valid"
else
    print_error "Configuration syntax error detected"
    print_warning "Restoring backup configuration..."
    cp "$BACKUP_DIR/http.conf" "/etc/asterisk/http.conf" 2>/dev/null
    cp "$BACKUP_DIR/pjsip.conf" "/etc/asterisk/pjsip.conf" 2>/dev/null
    exit 1
fi

print_status "Step 5: Restarting Asterisk service..."
systemctl restart asterisk
sleep 3

# Check if Asterisk is running
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk service restarted successfully"
else
    print_error "Asterisk service failed to start"
    print_warning "Check logs with: journalctl -u asterisk -f"
    exit 1
fi

print_status "Step 6: Testing WebSocket endpoint..."
sleep 2

# Test HTTP endpoint
HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8088/" 2>/dev/null)
if [ "$HTTP_TEST" = "200" ] || [ "$HTTP_TEST" = "404" ]; then
    print_success "HTTP endpoint is responding (HTTP $HTTP_TEST)"
else
    print_warning "HTTP endpoint test failed (HTTP $HTTP_TEST)"
fi

# Test WebSocket endpoint (should return 426 Upgrade Required)
WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8088/ws" 2>/dev/null)
if [ "$WS_TEST" = "426" ]; then
    print_success "WebSocket endpoint is responding correctly (HTTP 426 - Upgrade Required)"
elif [ "$WS_TEST" = "400" ]; then
    print_success "WebSocket endpoint is responding (HTTP 400 - Bad Request, but endpoint exists)"
else
    print_warning "WebSocket endpoint test returned HTTP $WS_TEST"
fi

print_status "Step 6.1: Testing WebSocket with proper headers..."
# Test WebSocket with proper upgrade headers
WS_UPGRADE_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Connection: Upgrade" \
    -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" \
    -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    --connect-timeout 5 "http://localhost:8088/ws" 2>/dev/null)

if [ "$WS_UPGRADE_TEST" = "101" ]; then
    print_success "WebSocket upgrade test successful (HTTP 101 - Switching Protocols)"
elif [ "$WS_UPGRADE_TEST" = "426" ]; then
    print_success "WebSocket endpoint responding to upgrade requests (HTTP 426)"
else
    print_warning "WebSocket upgrade test returned HTTP $WS_UPGRADE_TEST"
fi

print_status "Step 7: Checking Asterisk modules..."
asterisk -rx "module show like websocket" | grep -q "res_http_websocket.so"
if [ $? -eq 0 ]; then
    print_success "WebSocket module is loaded"
else
    print_warning "WebSocket module not found, attempting to load..."
    asterisk -rx "module load res_http_websocket.so"
fi

asterisk -rx "module show like pjsip" | grep -q "res_pjsip.so"
if [ $? -eq 0 ]; then
    print_success "PJSIP module is loaded"
else
    print_warning "PJSIP module not found, attempting to load..."
    asterisk -rx "module load res_pjsip.so"
fi

print_status "Step 8: Displaying current configuration status..."
echo ""
echo "=== Asterisk Status ==="
asterisk -rx "core show version"
echo ""
echo "=== HTTP Configuration ==="
asterisk -rx "http show status"
echo ""
echo "=== PJSIP Transports ==="
asterisk -rx "pjsip show transports"
echo ""
echo "=== PJSIP Endpoints ==="
asterisk -rx "pjsip show endpoints"

echo ""
print_success "Asterisk WebSocket configuration fix completed!"
echo ""
print_status "Next steps:"
echo "1. Test WebSocket connection from your application"
echo "2. Check browser console for WebSocket connection logs"
echo "3. Monitor Asterisk logs: tail -f /var/log/asterisk/messages"
echo ""
print_status "If issues persist, check:"
echo "- Firewall settings (port 8088 should be open)"
echo "- Network connectivity between application and Asterisk"
echo "- Browser WebSocket support and security settings"
