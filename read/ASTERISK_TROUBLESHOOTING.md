# Asterisk Connection Troubleshooting Guide

## Problem: Asterisk showing as "offline" in system health

Based on your system status showing Asterisk as offline while it's actually running, here are the most common causes and solutions:

## Quick Diagnosis

1. **Open the Admin Dashboard** → **Settings Tab** → **Click "Asterisk Diagnostics"**
2. This will run comprehensive tests and provide specific recommendations

## Common Issues and Solutions

### 1. Configuration Mismatch

**Problem**: Backend is trying to connect to wrong Asterisk host/IP

**Check**: Look at your backend configuration
```bash
# Check if you have a .env file in the backend directory
cat backend/.env

# Or check the default configuration
grep -r "ASTERISK_HOST" backend/
```

**Solution**: Update the Asterisk host configuration
```bash
# In backend/.env file, set the correct Asterisk IP:
ASTERISK_HOST=172.20.10.5  # Replace with your actual Asterisk IP
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USERNAME=admin
ASTERISK_AMI_SECRET=amp111
```

### 2. AMI (Asterisk Manager Interface) Not Configured

**Check**: Verify AMI is enabled and configured
```bash
# On Asterisk server, check manager.conf
sudo cat /etc/asterisk/manager.conf

# Check if AMI port is listening
sudo netstat -tlnp | grep 5038
```

**Solution**: Configure AMI properly
```bash
# Edit manager.conf
sudo nano /etc/asterisk/manager.conf

# Add/verify these settings:
[general]
enabled = yes
port = 5038
bindaddr = 0.0.0.0

[admin]
secret = amp111
read = all
write = all
permit = 172.20.10.0/24
permit = 127.0.0.1/32
```

### 3. Firewall Blocking AMI Port

**Check**: Test if port 5038 is accessible
```bash
# From your backend server, test connection to Asterisk
telnet 172.20.10.5 5038  # Replace with your Asterisk IP

# Or use nc (netcat)
nc -zv 172.20.10.5 5038
```

**Solution**: Open firewall port
```bash
# On Asterisk server (Ubuntu/Debian)
sudo ufw allow 5038

# On Asterisk server (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5038/tcp
sudo firewall-cmd --reload
```

### 4. Asterisk Service Issues

**Check**: Verify Asterisk is running properly
```bash
# Check Asterisk status
sudo systemctl status asterisk

# Check Asterisk logs
sudo tail -f /var/log/asterisk/messages

# Connect to Asterisk CLI
sudo asterisk -r
```

**Solution**: Restart Asterisk if needed
```bash
# Restart Asterisk
sudo systemctl restart asterisk

# Or reload configuration
sudo asterisk -rx "core reload"
```

### 5. Network Connectivity Issues

**Check**: Test basic network connectivity
```bash
# Ping Asterisk server from backend
ping 172.20.10.5  # Replace with your Asterisk IP

# Check if HTTP interface is working
curl -I http://172.20.10.5:8088/
```

**Solution**: Fix network configuration
- Ensure both servers are on the same network
- Check routing tables
- Verify IP addresses are correct

## Step-by-Step Troubleshooting

### Step 1: Identify Your Asterisk IP
```bash
# On Asterisk server, find IP address
ip addr show
# or
hostname -I
```

### Step 2: Update Backend Configuration
```bash
# Navigate to backend directory
cd backend/

# Create or edit .env file
nano .env

# Add these lines (replace IP with your Asterisk IP):
ASTERISK_HOST=172.20.10.5
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USERNAME=admin
ASTERISK_AMI_SECRET=amp111
```

### Step 3: Restart Backend
```bash
# If running with Go
go run main.go

# Or if using systemd
sudo systemctl restart voip-backend
```

### Step 4: Test Connection
1. Open your VoIP application
2. Go to Admin Dashboard → Settings
3. Click "Asterisk Diagnostics"
4. Review the test results

## Advanced Troubleshooting

### Check AMI Authentication
```bash
# Test AMI login manually
telnet 172.20.10.5 5038

# Once connected, try to login:
Action: Login
Username: admin
Secret: amp111

# You should see a success response
```

### Check Backend Logs
```bash
# Check backend logs for AMI connection errors
tail -f backend/logs/app.log

# Or check console output when running backend
```

### Verify Asterisk Configuration
```bash
# On Asterisk server, check if manager is loaded
sudo asterisk -rx "manager show settings"

# Check manager users
sudo asterisk -rx "manager show users"
```

## Quick Fixes

### Fix 1: Reset AMI Configuration
```bash
# Copy the provided manager.conf
sudo cp asterisk-config/manager.conf /etc/asterisk/
sudo systemctl restart asterisk
```

### Fix 2: Use IP Instead of Hostname
```bash
# In backend/.env, use IP instead of hostname
ASTERISK_HOST=172.20.10.5  # Instead of asterisk.local
```

### Fix 3: Check Permissions
```bash
# Ensure asterisk user owns config files
sudo chown asterisk:asterisk /etc/asterisk/*.conf
sudo chmod 640 /etc/asterisk/*.conf
```

## Verification

After making changes:

1. **Check System Health**: Admin Dashboard should show Asterisk as "online"
2. **Test Call**: Try making a test call between extensions
3. **Check Logs**: No AMI connection errors in backend logs

## Still Having Issues?

1. **Run Diagnostics**: Use the built-in Asterisk Diagnostics tool
2. **Check Logs**: Review both Asterisk and backend logs
3. **Network Test**: Ensure network connectivity between servers
4. **Configuration Review**: Double-check all configuration files

## Common Error Messages

- **"AMI client not available"**: Backend can't connect to Asterisk
- **"AMI command failed"**: Connected but authentication failed
- **"Connection timeout"**: Network/firewall issue
- **"Login failed"**: Wrong username/password

Each error points to a specific issue that can be resolved using the steps above.
