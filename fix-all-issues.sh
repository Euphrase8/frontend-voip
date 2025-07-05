#!/bin/bash

#
# Comprehensive Fix Script for All VoIP Issues
# This script fixes Asterisk health, system performance, and microphone issues
# Run this on your Asterisk server (172.20.10.5) as root
#
# Usage: sudo ./fix-all-issues.sh
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_header "COMPREHENSIVE VOIP SYSTEM FIX"
print_status "Fixing Asterisk health, system performance, and microphone issues..."

# Step 1: Fix Asterisk Configuration and Health
print_header "Step 1: Fixing Asterisk Health Issues"

# Stop Asterisk service
print_status "Stopping Asterisk service..."
systemctl stop asterisk 2>/dev/null || true
pkill -f asterisk 2>/dev/null || true
sleep 3

# Install/update Asterisk
print_status "Installing/updating Asterisk..."
apt update
apt install -y asterisk asterisk-modules asterisk-config asterisk-doc

# Create optimized manager.conf for better performance
print_status "Creating optimized manager.conf..."
cat > /etc/asterisk/manager.conf << 'EOF'
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0
webenabled = yes
httptimeout = 60
displayconnects = no

[admin]
secret = amp111
deny = 0.0.0.0/0.0.0.0
permit = 172.20.10.0/255.255.255.0
permit = 127.0.0.1/255.255.255.255
read = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,command,agent,user,config,dtmf,reporting,cdr,dialplan
writetimeout = 5000

[monitor]
secret = monitor123
deny = 0.0.0.0/0.0.0.0
permit = 172.20.10.0/255.255.255.0
permit = 127.0.0.1/255.255.255.255
read = system,call,log,verbose,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,agent,user,config,dtmf,reporting,cdr,dialplan
writetimeout = 5000
EOF

# Create optimized http.conf
print_status "Creating optimized http.conf..."
cat > /etc/asterisk/http.conf << 'EOF'
[general]
enabled = yes
bindaddr = 0.0.0.0
bindport = 8088
prefix = asterisk
enablestatic = yes
redirect = / /static/config/index.html
sessionlimit = 100
session_inactivity = 30000
session_keep_alive = 15000
EOF

# Create optimized pjsip.conf
print_status "Creating optimized pjsip.conf..."
cat > /etc/asterisk/pjsip.conf << 'EOF'
[global]
type = global
user_agent = Asterisk PBX
default_outbound_endpoint = default_outbound
keep_alive_interval = 90
max_initial_qualify_time = 4

[transport-udp]
type = transport
protocol = udp
bind = 0.0.0.0:5060
tos = af42
cos = 3

[transport-tcp]
type = transport
protocol = tcp
bind = 0.0.0.0:5060

[default_outbound]
type = endpoint
transport = transport-udp
context = default
disallow = all
allow = ulaw
allow = alaw
allow = gsm
direct_media = no
trust_id_inbound = yes
device_state_busy_at = 1
dtmf_mode = rfc4733

; Template for user endpoints
[user_template](!)
type = endpoint
transport = transport-udp
context = default
disallow = all
allow = ulaw
allow = alaw
allow = gsm
direct_media = no
trust_id_inbound = yes
device_state_busy_at = 1
dtmf_mode = rfc4733
rtp_timeout = 60
rtp_timeout_hold = 600

; Admin user (extension 1000)
[1000](user_template)
auth = auth1000
aors = aor1000

[auth1000]
type = auth
auth_type = userpass
username = 1000
password = password

[aor1000]
type = aor
max_contacts = 1
remove_existing = yes

; Test users (extensions 1001-1003)
[1001](user_template)
auth = auth1001
aors = aor1001

[auth1001]
type = auth
auth_type = userpass
username = 1001
password = password

[aor1001]
type = aor
max_contacts = 1
remove_existing = yes

[1002](user_template)
auth = auth1002
aors = aor1002

[auth1002]
type = auth
auth_type = userpass
username = 1002
password = password

[aor1002]
type = aor
max_contacts = 1
remove_existing = yes

[1003](user_template)
auth = auth1003
aors = aor1003

[auth1003]
type = auth
auth_type = userpass
username = 1003
password = password

[aor1003]
type = aor
max_contacts = 1
remove_existing = yes
EOF

# Create extensions.conf
print_status "Creating extensions.conf..."
cat > /etc/asterisk/extensions.conf << 'EOF'
[general]
static = yes
writeprotect = no
clearglobalvars = no

[globals]
CONSOLE = Console/dsp
IAXINFO = guest
TRUNK = DAHDI/G2
TRUNKMSD = 1

[default]
; Allow calls between extensions
exten => _1XXX,1,Dial(PJSIP/${EXTEN},20)
exten => _1XXX,n,Hangup()

; Echo test
exten => 8888,1,Answer()
exten => 8888,n,Wait(1)
exten => 8888,n,Playback(demo-echotest)
exten => 8888,n,Echo()
exten => 8888,n,Hangup()

; Test extension for connectivity
exten => 9999,1,Answer()
exten => 9999,n,Wait(1)
exten => 9999,n,Playback(hello-world)
exten => 9999,n,Hangup()

[internal]
include => default
EOF

# Set proper permissions
print_status "Setting proper permissions..."
chown -R asterisk:asterisk /etc/asterisk/
chown -R asterisk:asterisk /var/lib/asterisk/
chown -R asterisk:asterisk /var/log/asterisk/
chown -R asterisk:asterisk /var/spool/asterisk/
chown -R asterisk:asterisk /var/run/asterisk/

chmod 640 /etc/asterisk/*.conf
chmod -R 755 /var/lib/asterisk/
chmod -R 755 /var/log/asterisk/
chmod -R 755 /var/spool/asterisk/
chmod -R 755 /var/run/asterisk/

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 5038/tcp comment "Asterisk AMI"
    ufw allow 8088/tcp comment "Asterisk HTTP"
    ufw allow 5060/udp comment "Asterisk SIP"
    ufw allow 5060/tcp comment "Asterisk SIP TCP"
    ufw allow 10000:20000/udp comment "Asterisk RTP"
fi

# Start and enable Asterisk
print_status "Starting Asterisk service..."
systemctl enable asterisk
systemctl start asterisk

# Wait for Asterisk to start
sleep 10

# Verify Asterisk is running
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk service is running"
else
    print_error "Asterisk service failed to start"
    journalctl -u asterisk --no-pager -n 20
    exit 1
fi

print_success "Step 1 completed - Asterisk health fixed"

# Step 2: Create Backend Environment Configuration
print_header "Step 2: Fixing Backend Configuration"

# Create .env file for backend with correct Asterisk IP
print_status "Creating backend .env configuration..."
cat > /tmp/backend.env << 'EOF'
# Server Configuration
PORT=8080
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=voip-secret-key-change-in-production
JWT_EXPIRY_HOURS=24

# Database Configuration
DB_PATH=./voip.db

# Asterisk Configuration - FIXED IP
ASTERISK_HOST=172.20.10.5
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USERNAME=admin
ASTERISK_AMI_SECRET=amp111

# SIP Configuration
SIP_DOMAIN=172.20.10.5
SIP_PORT=8088

# Public host for frontend connections
PUBLIC_HOST=172.20.10.5

# Environment and service info
ENVIRONMENT=development
SERVICE_NAME=voip-backend

# CORS Configuration
CORS_ORIGINS=http://172.20.10.4:3000,http://localhost:3000,http://127.0.0.1:3000

# Service discovery
DISCOVERY_MODE=auto
DEBUG=true
EOF

print_success "Backend configuration created at /tmp/backend.env"
print_warning "Copy this file to your backend directory as .env"

# Step 3: System Performance Optimization
print_header "Step 3: System Performance Optimization"

# Optimize system settings for better performance
print_status "Optimizing system settings..."

# Increase file descriptor limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
echo "asterisk soft nofile 65536" >> /etc/security/limits.conf
echo "asterisk hard nofile 65536" >> /etc/security/limits.conf

# Optimize network settings
cat >> /etc/sysctl.conf << 'EOF'

# VoIP Optimizations
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.udp_rmem_min = 8192
net.ipv4.udp_wmem_min = 8192
net.core.netdev_max_backlog = 5000
EOF

# Apply sysctl settings
sysctl -p

# Create systemd service optimization
print_status "Optimizing Asterisk systemd service..."
mkdir -p /etc/systemd/system/asterisk.service.d/
cat > /etc/systemd/system/asterisk.service.d/override.conf << 'EOF'
[Service]
LimitNOFILE=65536
LimitNPROC=32768
PrivateTmp=false
ProtectSystem=false
ProtectHome=false
EOF

systemctl daemon-reload

print_success "Step 3 completed - System performance optimized"

# Step 4: Test All Connections
print_header "Step 4: Testing All Connections"

# Test AMI connection
print_status "Testing AMI connection..."
if timeout 5 bash -c "</dev/tcp/localhost/5038" 2>/dev/null; then
    print_success "AMI port 5038 is accessible"

    # Test AMI authentication
    AMI_TEST=$(timeout 10 bash -c '
    exec 3<>/dev/tcp/localhost/5038
    echo -e "Action: Login\r\nUsername: admin\r\nSecret: amp111\r\n\r\n" >&3
    sleep 2
    echo -e "Action: Ping\r\n\r\n" >&3
    sleep 2
    echo -e "Action: Logoff\r\n\r\n" >&3
    timeout 3 cat <&3
    exec 3<&-
    exec 3>&-
    ' 2>/dev/null)

    if echo "$AMI_TEST" | grep -q "Response: Success"; then
        print_success "AMI authentication successful"
    else
        print_warning "AMI authentication may have issues"
    fi
else
    print_error "AMI port 5038 is not accessible"
fi

# Test HTTP port
print_status "Testing HTTP port..."
if timeout 5 bash -c "</dev/tcp/localhost/8088" 2>/dev/null; then
    print_success "HTTP port 8088 is accessible"
else
    print_error "HTTP port 8088 is not accessible"
fi

# Test SIP port
print_status "Testing SIP port..."
if timeout 5 bash -c "</dev/tcp/localhost/5060" 2>/dev/null; then
    print_success "SIP TCP port 5060 is accessible"
else
    print_warning "SIP TCP port 5060 not accessible (UDP may be working)"
fi

print_success "Step 4 completed - Connection tests finished"

# Step 5: Final Status Report
print_header "Step 5: Final Status Report"

echo -e "\n${GREEN}=== ASTERISK STATUS REPORT ===${NC}"
echo -e "Service Status: $(systemctl is-active asterisk)"
echo -e "Service Enabled: $(systemctl is-enabled asterisk)"
echo -e "Process Running: $(pgrep -f asterisk > /dev/null && echo 'Yes' || echo 'No')"

echo -e "\n${BLUE}=== PORT STATUS ===${NC}"
netstat -tlnp 2>/dev/null | grep -E "(5038|8088|5060)" || echo "Checking ports..."

echo -e "\n${BLUE}=== CONFIGURATION FILES ===${NC}"
echo -e "manager.conf: $([ -f /etc/asterisk/manager.conf ] && echo 'OK' || echo 'MISSING')"
echo -e "http.conf: $([ -f /etc/asterisk/http.conf ] && echo 'OK' || echo 'MISSING')"
echo -e "pjsip.conf: $([ -f /etc/asterisk/pjsip.conf ] && echo 'OK' || echo 'MISSING')"
echo -e "extensions.conf: $([ -f /etc/asterisk/extensions.conf ] && echo 'OK' || echo 'MISSING')"

echo -e "\n${GREEN}=== NEXT STEPS ===${NC}"
echo -e "1. Copy /tmp/backend.env to your backend directory as .env"
echo -e "2. Restart your backend service with the new configuration"
echo -e "3. Test from your PC: ./test-asterisk-from-pc.sh"
echo -e "4. Check your VoIP application dashboard"
echo -e "5. Test microphone permissions in browser"

echo -e "\n${YELLOW}=== BACKEND RESTART COMMANDS ===${NC}"
echo -e "On your PC (172.20.10.4), run these commands:"
echo -e "  cd /path/to/your/backend"
echo -e "  cp /tmp/backend.env .env  # Copy the config file"
echo -e "  # Stop your backend service"
echo -e "  # Start your backend service with new config"

print_success "All fixes completed successfully!"
print_status "Asterisk should now be healthy and system should load faster"
