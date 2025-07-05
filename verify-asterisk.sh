#!/bin/bash

#
# Asterisk Verification Script
# Quick script to verify Asterisk is healthy and running
# Run this after the fix script to confirm everything is working
#
# Usage: ./verify-asterisk.sh
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
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

echo -e "${BLUE}=== ASTERISK HEALTH VERIFICATION ===${NC}\n"

# Check 1: Service Status
print_status "Checking Asterisk service status..."
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk service is active"
else
    print_error "Asterisk service is not active"
fi

# Check 2: Process Running
print_status "Checking Asterisk process..."
if pgrep -f asterisk > /dev/null; then
    ASTERISK_PID=$(pgrep -f asterisk)
    print_success "Asterisk process running (PID: $ASTERISK_PID)"
else
    print_error "Asterisk process not found"
fi

# Check 3: Port Accessibility
print_status "Checking port accessibility..."

# AMI Port (5038)
if timeout 3 bash -c "</dev/tcp/localhost/5038" 2>/dev/null; then
    print_success "AMI port 5038 is accessible"
else
    print_error "AMI port 5038 is not accessible"
fi

# HTTP Port (8088)
if timeout 3 bash -c "</dev/tcp/localhost/8088" 2>/dev/null; then
    print_success "HTTP port 8088 is accessible"
else
    print_error "HTTP port 8088 is not accessible"
fi

# SIP Port (5060)
if timeout 3 bash -c "</dev/tcp/localhost/5060" 2>/dev/null; then
    print_success "SIP TCP port 5060 is accessible"
else
    print_warning "SIP TCP port 5060 not accessible (UDP may be working)"
fi

# Check 4: Configuration Files
print_status "Checking configuration files..."

CONFIG_FILES=("manager.conf" "http.conf" "pjsip.conf" "extensions.conf")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "/etc/asterisk/$file" ]; then
        print_success "Configuration file $file exists"
    else
        print_error "Configuration file $file missing"
    fi
done

# Check 5: Permissions
print_status "Checking file permissions..."
if [ "$(stat -c %U /etc/asterisk/manager.conf 2>/dev/null)" = "asterisk" ]; then
    print_success "Configuration files have correct ownership"
else
    print_error "Configuration files have incorrect ownership"
fi

# Check 6: AMI Connection Test
print_status "Testing AMI connection..."
AMI_TEST=$(timeout 5 bash -c '
exec 3<>/dev/tcp/localhost/5038
echo -e "Action: Login\r\nUsername: admin\r\nSecret: amp111\r\n\r\n" >&3
sleep 1
echo -e "Action: Ping\r\n\r\n" >&3
sleep 1
echo -e "Action: Logoff\r\n\r\n" >&3
cat <&3 &
sleep 2
kill $! 2>/dev/null
exec 3<&-
exec 3>&-
' 2>/dev/null)

if echo "$AMI_TEST" | grep -q "Response: Success"; then
    print_success "AMI authentication successful"
else
    print_error "AMI authentication failed"
fi

# Check 7: Network Connectivity from External
print_status "Checking external network connectivity..."
EXTERNAL_IP=$(hostname -I | awk '{print $1}')
echo -e "   Server IP: $EXTERNAL_IP"

# Check 8: Recent Logs for Errors
print_status "Checking recent logs for errors..."
ERROR_COUNT=$(journalctl -u asterisk --since "10 minutes ago" | grep -i error | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_success "No recent errors in Asterisk logs"
else
    print_warning "Found $ERROR_COUNT error(s) in recent logs"
fi

# Summary
echo -e "\n${BLUE}=== SUMMARY ===${NC}"
echo -e "Service Status: $(systemctl is-active asterisk)"
echo -e "Service Enabled: $(systemctl is-enabled asterisk)"
echo -e "Server IP: $EXTERNAL_IP"
echo -e "AMI Port: 5038"
echo -e "HTTP Port: 8088"
echo -e "SIP Port: 5060"

echo -e "\n${BLUE}=== TEST COMMANDS ===${NC}"
echo -e "From your PC (172.20.10.4), test these commands:"
echo -e "  telnet $EXTERNAL_IP 5038"
echo -e "  curl http://$EXTERNAL_IP:8088/"
echo -e "  nc -zv $EXTERNAL_IP 5038"

echo -e "\n${BLUE}=== TROUBLESHOOTING ===${NC}"
echo -e "If issues persist:"
echo -e "  sudo journalctl -u asterisk -f    # View live logs"
echo -e "  sudo asterisk -rvvv               # Connect to Asterisk CLI"
echo -e "  sudo systemctl restart asterisk   # Restart service"

echo -e "\n${GREEN}Verification complete!${NC}"
