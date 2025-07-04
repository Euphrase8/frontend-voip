#!/bin/bash

# Complete WebSocket Fix Script
# This script fixes both Asterisk configuration and backend WebSocket paths

echo "🔧 Complete WebSocket Fix Script"
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

# Check if running as root for Asterisk configuration
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo) to configure Asterisk"
        exit 1
    fi
}

print_status "Step 1: Checking prerequisites..."

# Check if Asterisk is installed
if ! command -v asterisk &> /dev/null; then
    print_error "Asterisk is not installed or not in PATH"
    exit 1
fi

# Check if Go is available for backend rebuild
if ! command -v go &> /dev/null; then
    print_warning "Go is not installed - backend rebuild will be skipped"
    GO_AVAILABLE=false
else
    GO_AVAILABLE=true
fi

print_success "Prerequisites checked"

print_status "Step 2: Backing up Asterisk configuration..."
BACKUP_DIR="/etc/asterisk/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /etc/asterisk/http.conf "$BACKUP_DIR/" 2>/dev/null || print_warning "Could not backup http.conf"
cp /etc/asterisk/pjsip.conf "$BACKUP_DIR/" 2>/dev/null || print_warning "Could not backup pjsip.conf"
print_success "Configuration backed up to $BACKUP_DIR"

print_status "Step 3: Fixing Asterisk HTTP configuration..."

# Fix the HTTP configuration
if [ -f "/etc/asterisk/http.conf" ]; then
    # Comment out any prefix lines
    sed -i 's/^prefix=/#prefix=/' /etc/asterisk/http.conf
    sed -i 's/^prefix /#prefix /' /etc/asterisk/http.conf
    
    # Ensure websocket is enabled
    if ! grep -q "websocket_enabled=yes" /etc/asterisk/http.conf; then
        echo "websocket_enabled=yes" >> /etc/asterisk/http.conf
    fi
    
    print_success "HTTP configuration fixed"
else
    print_error "/etc/asterisk/http.conf not found"
    exit 1
fi

print_status "Step 4: Copying updated configuration files..."
# Copy the fixed configuration files if they exist
if [ -f "./asterisk-config/http.conf" ]; then
    cp "./asterisk-config/http.conf" "/etc/asterisk/http.conf"
    print_success "Updated http.conf from project"
fi

if [ -f "./asterisk-config/pjsip.conf" ]; then
    cp "./asterisk-config/pjsip.conf" "/etc/asterisk/pjsip.conf"
    print_success "Updated pjsip.conf from project"
fi

print_status "Step 5: Setting correct file permissions..."
chown asterisk:asterisk /etc/asterisk/http.conf 2>/dev/null || print_warning "Could not set ownership for http.conf"
chown asterisk:asterisk /etc/asterisk/pjsip.conf 2>/dev/null || print_warning "Could not set ownership for pjsip.conf"
chmod 640 /etc/asterisk/http.conf 2>/dev/null || print_warning "Could not set permissions for http.conf"
chmod 640 /etc/asterisk/pjsip.conf 2>/dev/null || print_warning "Could not set permissions for pjsip.conf"
print_success "File permissions set"

print_status "Step 6: Testing Asterisk configuration syntax..."
asterisk -T -C /etc/asterisk/asterisk.conf
if [ $? -eq 0 ]; then
    print_success "Asterisk configuration syntax is valid"
else
    print_error "Asterisk configuration syntax error detected"
    print_warning "Restoring backup configuration..."
    cp "$BACKUP_DIR/http.conf" "/etc/asterisk/http.conf" 2>/dev/null
    cp "$BACKUP_DIR/pjsip.conf" "/etc/asterisk/pjsip.conf" 2>/dev/null
    exit 1
fi

print_status "Step 7: Restarting Asterisk..."
systemctl restart asterisk
sleep 3

# Check if Asterisk is running
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk restarted successfully"
else
    print_error "Asterisk failed to start"
    print_warning "Check logs with: journalctl -u asterisk -f"
    exit 1
fi

print_status "Step 8: Rebuilding backend (if Go is available)..."
if [ "$GO_AVAILABLE" = true ]; then
    if [ -d "./backend" ]; then
        cd backend
        print_status "Building backend with updated WebSocket paths..."
        go build -o voip-backend main.go
        if [ $? -eq 0 ]; then
            print_success "Backend rebuilt successfully"
            
            # Restart backend if it's running
            if pgrep -f "voip-backend" > /dev/null; then
                print_status "Restarting backend service..."
                pkill -f "voip-backend"
                sleep 2
                nohup ./voip-backend > backend.log 2>&1 &
                print_success "Backend restarted"
            else
                print_warning "Backend not running - start it manually with: ./voip-backend"
            fi
        else
            print_error "Backend build failed"
        fi
        cd ..
    else
        print_warning "Backend directory not found"
    fi
else
    print_warning "Go not available - backend rebuild skipped"
fi

print_status "Step 9: Testing WebSocket endpoints..."
sleep 2

# Test HTTP endpoint
HTTP_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8088/" 2>/dev/null)
if [ "$HTTP_TEST" = "200" ] || [ "$HTTP_TEST" = "404" ]; then
    print_success "Asterisk HTTP endpoint is responding (HTTP $HTTP_TEST)"
else
    print_warning "Asterisk HTTP endpoint test failed (HTTP $HTTP_TEST)"
fi

# Test WebSocket endpoint (should return 426 Upgrade Required)
WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8088/ws" 2>/dev/null)
if [ "$WS_TEST" = "426" ]; then
    print_success "Asterisk WebSocket endpoint is responding correctly (HTTP 426 - Upgrade Required)"
elif [ "$WS_TEST" = "400" ]; then
    print_success "Asterisk WebSocket endpoint is responding (HTTP 400 - Bad Request, but endpoint exists)"
else
    print_warning "Asterisk WebSocket endpoint test returned HTTP $WS_TEST"
fi

# Test backend WebSocket if running
BACKEND_WS_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:8080/ws" 2>/dev/null)
if [ "$BACKEND_WS_TEST" = "400" ]; then
    print_success "Backend WebSocket endpoint is responding (HTTP 400 - requires extension parameter)"
elif [ "$BACKEND_WS_TEST" = "426" ]; then
    print_success "Backend WebSocket endpoint is responding (HTTP 426 - Upgrade Required)"
else
    print_warning "Backend WebSocket endpoint test returned HTTP $BACKEND_WS_TEST"
fi

print_status "Step 10: Checking Asterisk modules..."
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

print_status "Step 11: Displaying current status..."
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
print_success "Complete WebSocket fix completed!"
echo ""
print_status "Next steps:"
echo "1. Refresh your VoIP application page"
echo "2. Check the connection test - WebSocket should now show 'Connected'"
echo "3. Test making a call between extensions"
echo "4. Monitor logs if issues persist:"
echo "   - Asterisk: tail -f /var/log/asterisk/messages"
echo "   - Backend: tail -f backend/backend.log"
echo ""
print_status "Expected results:"
echo "✅ WebSocket test should show 'Connected' instead of 'Failed'"
echo "✅ No more 'did not request WebSocket' errors in Asterisk CLI"
echo "✅ Application should show 'Asterisk: Online'"
