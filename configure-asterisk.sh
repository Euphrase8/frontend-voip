#!/bin/bash

echo ""
echo "========================================"
echo "   Asterisk Auto-Configuration Tool"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if script exists
if [ ! -f "scripts/configure-asterisk.js" ]; then
    echo "ERROR: Configuration script not found"
    echo "Make sure you're running this from the project root directory"
    exit 1
fi

# Make script executable
chmod +x scripts/configure-asterisk.js

# Run the configuration
echo "Running Asterisk auto-configuration..."
echo ""
node scripts/configure-asterisk.js configure

echo ""
echo "========================================"
echo "Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server"
echo "2. Restart your frontend server (npm start)"
echo "3. Test connection in admin dashboard"
echo ""
echo "SSH to Asterisk server:"
echo "  ssh kali@172.20.10.5"
echo "  Password: kali"
echo "========================================"
echo ""
