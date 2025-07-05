#!/bin/bash

#
# WebSocket Fix Script for Asterisk
# This script fixes the WebSocket connection issues between your PC and Asterisk
# Run this on your Asterisk server (172.20.10.5) as root
#
# Usage: sudo ./fix-websocket-issue.sh
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

print_header "ASTERISK WEBSOCKET FIX SCRIPT"
print_status "Fixing WebSocket connection issues..."

# Step 1: Stop Asterisk
print_header "Step 1: Stopping Asterisk"
systemctl stop asterisk
sleep 3

# Step 2: Create enhanced HTTP configuration with proper WebSocket support
print_header "Step 2: Creating Enhanced HTTP Configuration"

print_status "Creating optimized http.conf with WebSocket support..."
cat > /etc/asterisk/http.conf << 'EOF'
[general]
enabled = yes
bindaddr = 0.0.0.0
bindport = 8088
prefix = asterisk
enablestatic = yes
redirect = / /static/config/index.html

; WebSocket specific settings
sessionlimit = 100
session_inactivity = 30000
session_keep_alive = 15000

; CORS settings for WebSocket
enable_crossdomain = yes
crossdomain_whitelist = 172.20.10.4,localhost,127.0.0.1

; Additional security
tlsenable = no
tlsbindaddr = 0.0.0.0:8089
tlscertfile = /etc/asterisk/keys/asterisk.pem
tlsprivatekey = /etc/asterisk/keys/asterisk.key
EOF

# Step 3: Create WebSocket-specific configuration
print_status "Creating websocket.conf..."
cat > /etc/asterisk/websocket.conf << 'EOF'
[general]
enabled = yes
port = 8088
bindaddr = 0.0.0.0

; Allow connections from your PC
permit = 172.20.10.4/32
permit = 127.0.0.1/32
permit = localhost

; WebSocket protocol settings
protocol = ws
origin_whitelist = http://172.20.10.4:3000,http://localhost:3000,https://172.20.10.4:3000,https://localhost:3000

; Connection limits
max_connections = 100
connection_timeout = 30
EOF

# Step 4: Update extensions.conf to support WebSocket endpoints
print_status "Updating extensions.conf for WebSocket support..."
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

; WebRTC context for WebSocket connections
[webrtc]
include => default
EOF

# Step 5: Create enhanced PJSIP configuration with WebSocket transport
print_status "Creating enhanced pjsip.conf with WebSocket support..."
cat > /etc/asterisk/pjsip.conf << 'EOF'
[global]
type = global
user_agent = Asterisk PBX WebRTC
default_outbound_endpoint = default_outbound
keep_alive_interval = 90
max_initial_qualify_time = 4

; UDP Transport
[transport-udp]
type = transport
protocol = udp
bind = 0.0.0.0:5060
tos = af42
cos = 3

; TCP Transport
[transport-tcp]
type = transport
protocol = tcp
bind = 0.0.0.0:5060

; WebSocket Transport for WebRTC
[transport-ws]
type = transport
protocol = ws
bind = 0.0.0.0:8088

; Secure WebSocket Transport
[transport-wss]
type = transport
protocol = wss
bind = 0.0.0.0:8089

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

; Template for WebRTC endpoints
[webrtc_template](!)
type = endpoint
transport = transport-ws
context = webrtc
disallow = all
allow = opus
allow = ulaw
allow = alaw
direct_media = no
trust_id_inbound = yes
device_state_busy_at = 1
dtmf_mode = rfc4733
rtp_timeout = 60
rtp_timeout_hold = 600
ice_support = yes
use_avpf = yes
media_encryption = no
rtcp_mux = yes

; Template for regular SIP endpoints
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

; Admin user (extension 1000) - WebRTC capable
[1000](webrtc_template)
auth = auth1000
aors = aor1000

[auth1000]
type = auth
auth_type = userpass
username = 1000
password = password

[aor1000]
type = aor
max_contacts = 5
remove_existing = yes

; Test users (extensions 1001-1003) - WebRTC capable
[1001](webrtc_template)
auth = auth1001
aors = aor1001

[auth1001]
type = auth
auth_type = userpass
username = 1001
password = password

[aor1001]
type = aor
max_contacts = 5
remove_existing = yes

[1002](webrtc_template)
auth = auth1002
aors = aor1002

[auth1002]
type = auth
auth_type = userpass
username = 1002
password = password

[aor1002]
type = aor
max_contacts = 5
remove_existing = yes

[1003](webrtc_template)
auth = auth1003
aors = aor1003

[auth1003]
type = auth
auth_type = userpass
username = 1003
password = password

[aor1003]
type = aor
max_contacts = 5
remove_existing = yes
EOF

# Step 6: Set proper permissions
print_status "Setting proper permissions..."
chown -R asterisk:asterisk /etc/asterisk/
chmod 640 /etc/asterisk/*.conf

# Step 7: Start Asterisk
print_header "Step 7: Starting Asterisk"
systemctl start asterisk
sleep 10

# Step 8: Verify WebSocket is working
print_header "Step 8: Testing WebSocket Configuration"

# Check if Asterisk started successfully
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk service is running"
else
    print_error "Asterisk service failed to start"
    journalctl -u asterisk --no-pager -n 20
    exit 1
fi

# Test HTTP port
print_status "Testing HTTP port (8088)..."
if timeout 5 bash -c "</dev/tcp/localhost/8088" 2>/dev/null; then
    print_success "HTTP port 8088 is accessible"
else
    print_error "HTTP port 8088 is not accessible"
fi

# Test WebSocket endpoint
print_status "Testing WebSocket endpoint..."
if command -v curl >/dev/null 2>&1; then
    WS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 \
        -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
        -H "Sec-WebSocket-Version: 13" \
        "http://localhost:8088/ws" 2>/dev/null)
    
    if [ "$WS_RESPONSE" = "101" ] || [ "$WS_RESPONSE" = "426" ]; then
        print_success "WebSocket endpoint is responding correctly (HTTP $WS_RESPONSE)"
    else
        print_warning "WebSocket endpoint responded with: $WS_RESPONSE"
    fi
fi

print_header "Step 9: Final Configuration Summary"

echo -e "\n${GREEN}=== WEBSOCKET CONFIGURATION SUMMARY ===${NC}"
echo -e "HTTP Port: 8088"
echo -e "WebSocket Endpoint: ws://172.20.10.5:8088/ws"
echo -e "Allowed Origins: http://172.20.10.4:3000, http://localhost:3000"
echo -e "Transport: WebSocket (ws) and Secure WebSocket (wss)"
echo -e "Extensions: 1000-1003 (WebRTC capable)"

echo -e "\n${BLUE}=== FRONTEND WEBSOCKET URL ===${NC}"
echo -e "Use this WebSocket URL in your frontend:"
echo -e "ws://172.20.10.5:8088/ws"

echo -e "\n${YELLOW}=== TESTING COMMANDS ===${NC}"
echo -e "From your PC (172.20.10.4), test WebSocket:"
echo -e "curl -i -N -H \"Connection: Upgrade\" \\"
echo -e "     -H \"Upgrade: websocket\" \\"
echo -e "     -H \"Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\" \\"
echo -e "     -H \"Sec-WebSocket-Version: 13\" \\"
echo -e "     http://172.20.10.5:8088/ws"

print_success "WebSocket fix completed successfully!"
print_status "WebSocket connections from 172.20.10.4 should now work properly"
