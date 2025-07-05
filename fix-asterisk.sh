#!/bin/bash

#
# Comprehensive Asterisk Fix Script
# This script will diagnose and fix all Asterisk issues to make it healthy and running
# Run this on your Asterisk server (172.20.10.5) as root
#
# Usage: sudo ./fix-asterisk.sh
#

set -e

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

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_header "ASTERISK COMPREHENSIVE FIX SCRIPT"
print_status "Starting Asterisk diagnosis and repair..."

# Step 1: Stop any existing Asterisk processes
print_header "Step 1: Stopping Existing Asterisk Processes"
print_status "Stopping Asterisk service..."
systemctl stop asterisk 2>/dev/null || true

print_status "Killing any remaining Asterisk processes..."
pkill -f asterisk 2>/dev/null || true
sleep 2

# Check if any Asterisk processes are still running
if pgrep -f asterisk > /dev/null; then
    print_warning "Force killing remaining Asterisk processes..."
    pkill -9 -f asterisk 2>/dev/null || true
    sleep 2
fi

print_success "All Asterisk processes stopped"

# Step 2: Install/Update Asterisk
print_header "Step 2: Installing/Updating Asterisk"
print_status "Updating package list..."
apt update

print_status "Installing Asterisk and required packages..."
apt install -y asterisk asterisk-modules asterisk-config asterisk-doc

# Install additional useful packages
apt install -y net-tools telnet curl

print_success "Asterisk packages installed"

# Step 3: Create backup of existing configuration
print_header "Step 3: Backing Up Existing Configuration"
BACKUP_DIR="/etc/asterisk/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d "/etc/asterisk" ]; then
    cp -r /etc/asterisk/* "$BACKUP_DIR/" 2>/dev/null || true
    print_success "Configuration backed up to $BACKUP_DIR"
else
    print_warning "No existing Asterisk configuration found"
fi

# Step 4: Create proper directory structure
print_header "Step 4: Creating Directory Structure"
print_status "Creating Asterisk directories..."

# Create all necessary directories
mkdir -p /etc/asterisk
mkdir -p /var/lib/asterisk
mkdir -p /var/log/asterisk
mkdir -p /var/spool/asterisk
mkdir -p /var/run/asterisk

print_success "Directory structure created"

# Step 5: Create configuration files
print_header "Step 5: Creating Configuration Files"

# Create manager.conf
print_status "Creating manager.conf..."
cat > /etc/asterisk/manager.conf << 'EOF'
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0
webenabled = yes

[admin]
secret = amp111
deny = 0.0.0.0/0.0.0.0
permit = 172.20.10.0/255.255.255.0
permit = 127.0.0.1/255.255.255.255
read = system,call,log,verbose,command,agent,user,config,command,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,command,agent,user,config,command,dtmf,reporting,cdr,dialplan

[monitor]
secret = monitor123
deny = 0.0.0.0/0.0.0.0
permit = 172.20.10.0/255.255.255.0
permit = 127.0.0.1/255.255.255.255
read = system,call,log,verbose,agent,user,config,dtmf,reporting,cdr,dialplan
write = system,call,log,verbose,agent,user,config,dtmf,reporting,cdr,dialplan
EOF

# Create http.conf
print_status "Creating http.conf..."
cat > /etc/asterisk/http.conf << 'EOF'
[general]
enabled = yes
bindaddr = 0.0.0.0
bindport = 8088
prefix = asterisk
enablestatic = yes
redirect = / /static/config/index.html
EOF

# Create pjsip.conf
print_status "Creating pjsip.conf..."
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

print_success "Configuration files created"

# Step 6: Set proper permissions
print_header "Step 6: Setting Proper Permissions"
print_status "Setting ownership and permissions..."

# Create asterisk user if it doesn't exist
if ! id "asterisk" &>/dev/null; then
    print_status "Creating asterisk user..."
    useradd -r -d /var/lib/asterisk -s /bin/false asterisk
fi

# Set ownership
chown -R asterisk:asterisk /etc/asterisk/
chown -R asterisk:asterisk /var/lib/asterisk/
chown -R asterisk:asterisk /var/log/asterisk/
chown -R asterisk:asterisk /var/spool/asterisk/
chown -R asterisk:asterisk /var/run/asterisk/

# Set permissions
chmod -R 750 /etc/asterisk/
chmod 640 /etc/asterisk/*.conf
chmod -R 755 /var/lib/asterisk/
chmod -R 755 /var/log/asterisk/
chmod -R 755 /var/spool/asterisk/
chmod -R 755 /var/run/asterisk/

print_success "Permissions set correctly"

# Step 7: Configure firewall
print_header "Step 7: Configuring Firewall"
if command -v ufw &> /dev/null; then
    print_status "Configuring UFW firewall rules..."
    ufw allow 5038/tcp comment "Asterisk AMI"
    ufw allow 8088/tcp comment "Asterisk HTTP"
    ufw allow 5060/udp comment "Asterisk SIP"
    ufw allow 5060/tcp comment "Asterisk SIP TCP"
    ufw allow 10000:20000/udp comment "Asterisk RTP"
    print_success "UFW firewall rules configured"
elif command -v iptables &> /dev/null; then
    print_status "Configuring iptables firewall rules..."
    iptables -A INPUT -p tcp --dport 5038 -j ACCEPT
    iptables -A INPUT -p tcp --dport 8088 -j ACCEPT
    iptables -A INPUT -p udp --dport 5060 -j ACCEPT
    iptables -A INPUT -p tcp --dport 5060 -j ACCEPT
    iptables -A INPUT -p udp --dport 10000:20000 -j ACCEPT
    print_success "iptables firewall rules configured"
else
    print_warning "No firewall detected, skipping firewall configuration"
fi

# Step 8: Enable and start Asterisk service
print_header "Step 8: Starting Asterisk Service"
print_status "Enabling Asterisk service..."
systemctl enable asterisk

print_status "Starting Asterisk service..."
systemctl start asterisk

# Wait for Asterisk to start
print_status "Waiting for Asterisk to start..."
sleep 10

# Step 9: Verify Asterisk is running
print_header "Step 9: Verifying Asterisk Status"

# Check service status
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk service is running"
else
    print_error "Asterisk service failed to start"
    print_status "Checking Asterisk logs..."
    journalctl -u asterisk --no-pager -n 20
    exit 1
fi

# Check if Asterisk process is running
if pgrep -f asterisk > /dev/null; then
    print_success "Asterisk process is running"
else
    print_error "Asterisk process not found"
    exit 1
fi

# Step 10: Test connectivity
print_header "Step 10: Testing Connectivity"

# Test AMI port
print_status "Testing AMI port (5038)..."
if timeout 5 bash -c "</dev/tcp/localhost/5038" 2>/dev/null; then
    print_success "AMI port 5038 is accessible"
else
    print_error "AMI port 5038 is not accessible"
fi

# Test HTTP port
print_status "Testing HTTP port (8088)..."
if timeout 5 bash -c "</dev/tcp/localhost/8088" 2>/dev/null; then
    print_success "HTTP port 8088 is accessible"
else
    print_error "HTTP port 8088 is not accessible"
fi

# Test SIP port
print_status "Testing SIP port (5060)..."
if timeout 5 bash -c "</dev/tcp/localhost/5060" 2>/dev/null; then
    print_success "SIP port 5060 is accessible"
else
    print_warning "SIP port 5060 may not be accessible (UDP only)"
fi

# Step 11: Test AMI connection
print_header "Step 11: Testing AMI Connection"
print_status "Testing AMI login..."

# Create a simple AMI test
cat > /tmp/ami_test.sh << 'EOF'
#!/bin/bash
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
EOF

chmod +x /tmp/ami_test.sh
if timeout 10 /tmp/ami_test.sh 2>/dev/null | grep -q "Response: Success"; then
    print_success "AMI connection test successful"
else
    print_warning "AMI connection test failed, but service may still be working"
fi

rm -f /tmp/ami_test.sh

# Step 12: Display final status
print_header "Step 12: Final Status Report"

echo -e "\n${GREEN}=== ASTERISK STATUS REPORT ===${NC}"
echo -e "Service Status: $(systemctl is-active asterisk)"
echo -e "Service Enabled: $(systemctl is-enabled asterisk)"
echo -e "Process Running: $(pgrep -f asterisk > /dev/null && echo 'Yes' || echo 'No')"

echo -e "\n${BLUE}=== PORT STATUS ===${NC}"
netstat -tlnp 2>/dev/null | grep -E "(5038|8088|5060)" || echo "No ports found (may be normal)"

echo -e "\n${BLUE}=== RECENT LOGS ===${NC}"
journalctl -u asterisk --no-pager -n 5 --since "5 minutes ago"

echo -e "\n${GREEN}=== CONFIGURATION SUMMARY ===${NC}"
echo -e "AMI Port: 5038 (admin/amp111, monitor/monitor123)"
echo -e "HTTP Port: 8088"
echo -e "SIP Port: 5060"
echo -e "Extensions: 1000 (admin), 1001-1003 (users)"
echo -e "Test Extensions: 8888 (echo), 9999 (hello)"

echo -e "\n${GREEN}=== NEXT STEPS ===${NC}"
echo -e "1. Test from your PC: telnet 172.20.10.5 5038"
echo -e "2. Test HTTP: curl http://172.20.10.5:8088/"
echo -e "3. Check your VoIP application dashboard"
echo -e "4. Register SIP clients with extensions 1000-1003"

print_success "Asterisk fix script completed successfully!"
print_status "Asterisk should now be healthy and running"
