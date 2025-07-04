#!/bin/bash

#
# Asterisk Setup Script for VoIP Application
# 
# This script configures Asterisk on Kali Linux for your VoIP application
# Run this script on your Asterisk server at 172.20.10.2
#
# Usage: sudo ./setup-asterisk.sh
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Starting Asterisk configuration for VoIP application..."

# Backup existing configuration files
print_status "Backing up existing Asterisk configuration..."
BACKUP_DIR="/etc/asterisk/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "/etc/asterisk/http.conf" ]; then
    cp /etc/asterisk/http.conf "$BACKUP_DIR/"
    print_status "Backed up http.conf"
fi

if [ -f "/etc/asterisk/pjsip.conf" ]; then
    cp /etc/asterisk/pjsip.conf "$BACKUP_DIR/"
    print_status "Backed up pjsip.conf"
fi

if [ -f "/etc/asterisk/manager.conf" ]; then
    cp /etc/asterisk/manager.conf "$BACKUP_DIR/"
    print_status "Backed up manager.conf"
fi

if [ -f "/etc/asterisk/extensions.conf" ]; then
    cp /etc/asterisk/extensions.conf "$BACKUP_DIR/"
    print_status "Backed up extensions.conf"
fi

print_success "Configuration files backed up to $BACKUP_DIR"

# Install Asterisk if not already installed
if ! command -v asterisk &> /dev/null; then
    print_status "Asterisk not found. Installing Asterisk..."
    apt update
    apt install -y asterisk asterisk-modules asterisk-config
    print_success "Asterisk installed"
else
    print_status "Asterisk is already installed"
fi

# Copy new configuration files
print_status "Installing new configuration files..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy configuration files
cp "$SCRIPT_DIR/http.conf" /etc/asterisk/
cp "$SCRIPT_DIR/pjsip.conf" /etc/asterisk/
cp "$SCRIPT_DIR/manager.conf" /etc/asterisk/
cp "$SCRIPT_DIR/extensions.conf" /etc/asterisk/

# Set proper permissions
chown asterisk:asterisk /etc/asterisk/*.conf
chmod 640 /etc/asterisk/*.conf

print_success "Configuration files installed"

# Enable and start Asterisk service
print_status "Configuring Asterisk service..."
systemctl enable asterisk
systemctl restart asterisk

# Wait for Asterisk to start
sleep 5

# Check if Asterisk is running
if systemctl is-active --quiet asterisk; then
    print_success "Asterisk service is running"
else
    print_error "Asterisk service failed to start"
    print_status "Checking Asterisk logs..."
    journalctl -u asterisk --no-pager -n 20
    exit 1
fi

# Test AMI connection
print_status "Testing AMI connection..."
if nc -z localhost 5038; then
    print_success "AMI port 5038 is accessible"
else
    print_warning "AMI port 5038 is not accessible"
fi

# Test HTTP interface
print_status "Testing HTTP interface..."
if nc -z localhost 8088; then
    print_success "HTTP port 8088 is accessible"
else
    print_warning "HTTP port 8088 is not accessible"
fi

# Configure firewall (if ufw is active)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    print_status "Configuring firewall rules..."
    ufw allow 5038/tcp comment "Asterisk AMI"
    ufw allow 8088/tcp comment "Asterisk HTTP"
    ufw allow 5060/udp comment "Asterisk SIP"
    ufw allow 10000:20000/udp comment "Asterisk RTP"
    print_success "Firewall rules added"
fi

# Display connection information
print_success "Asterisk configuration completed!"
echo
echo -e "${GREEN}=== Connection Information ===${NC}"
echo -e "Asterisk Server IP: ${BLUE}172.20.10.2${NC}"
echo -e "AMI Port: ${BLUE}5038${NC}"
echo -e "HTTP Port: ${BLUE}8088${NC}"
echo -e "SIP Port: ${BLUE}5060${NC}"
echo -e "AMI Username: ${BLUE}admin${NC}"
echo -e "AMI Password: ${BLUE}amp111${NC}"
echo
echo -e "${GREEN}=== Test Extensions ===${NC}"
echo -e "Extension 1000: password1000"
echo -e "Extension 1001: password1001"
echo -e "Extension 1002: password1002"
echo -e "Extension 1003: password1003"
echo -e "Extension 1004: password1004"
echo -e "Extension 1005: password1005"
echo
echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Test the connection from your VoIP application"
echo "2. Use the 'Test Connections' button in the IP configuration page"
echo "3. If tests pass, save the configuration and proceed to login"
echo
echo -e "${YELLOW}Note:${NC} Configuration backup saved to: $BACKUP_DIR"

print_success "Setup complete! Your Asterisk server is ready for the VoIP application."
