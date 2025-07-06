#!/bin/bash

# Fix AMI Admin User Configuration
echo "Adding admin user to manager.conf..."

# Add admin user configuration
cat >> /etc/asterisk/manager.conf << 'EOF'

[admin]
secret = amp111
read = all
write = all
permit = 172.20.10.0/24
permit = 127.0.0.1/32
EOF

echo "Admin user added to manager.conf"
echo "Reloading manager module..."

# Reload manager module
asterisk -rx "module reload manager"

echo "Manager module reloaded"
echo "Checking manager users..."

# Show configured users
asterisk -rx "manager show users"

echo "AMI configuration complete!"
