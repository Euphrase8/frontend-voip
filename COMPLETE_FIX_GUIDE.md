# Complete VoIP System Fix Guide

## Overview

This guide provides comprehensive solutions for all three major issues:
1. **Asterisk showing unhealthy** - Backend configuration and Asterisk setup
2. **System status loading slowly** - Performance optimization
3. **Microphone access errors** - Enhanced browser compatibility and error handling

## 🚀 Quick Fix Instructions

### Step 1: Fix Asterisk Server (172.20.10.5)

SSH into your Asterisk server and run the comprehensive fix:

```bash
# SSH into Asterisk server
ssh kali@172.20.10.5

# Make script executable and run
chmod +x fix-all-issues.sh
sudo ./fix-all-issues.sh
```

This script will:
- ✅ Stop and restart Asterisk with optimized configuration
- ✅ Create proper manager.conf, http.conf, pjsip.conf, extensions.conf
- ✅ Set correct permissions and firewall rules
- ✅ Optimize system performance settings
- ✅ Test all connections and provide status report

### Step 2: Update Backend Configuration

Copy the new backend configuration:

```bash
# On your PC (172.20.10.4)
cd /path/to/your/backend
cp backend.env .env

# Restart your backend service with new configuration
# The new .env file has the correct Asterisk IP (172.20.10.5)
```

### Step 3: Test All Fixes

Run the comprehensive test from your PC:

```bash
# Make script executable and run
chmod +x test-all-fixes.sh
./test-all-fixes.sh
```

## 🔧 What Each Fix Does

### 1. Asterisk Health Fix

**Problem**: Backend can't connect to Asterisk AMI
**Solution**: 
- Fixed Asterisk configuration with correct IP binding
- Optimized AMI settings for better performance
- Added proper firewall rules
- Set correct file permissions

**Key Changes**:
- `manager.conf`: Enabled AMI on 0.0.0.0:5038 with admin/amp111 credentials
- `http.conf`: Enabled HTTP interface on 0.0.0.0:8088
- `pjsip.conf`: Configured SIP extensions 1000-1003
- Backend `.env`: Set ASTERISK_HOST=172.20.10.5

### 2. System Performance Fix

**Problem**: System status loads slowly and times out
**Solution**:
- Added request timeouts (10 seconds) to prevent hanging
- Optimized system settings for VoIP traffic
- Improved error handling and retry logic
- Enhanced backend configuration

**Key Changes**:
- Added AbortController for request timeouts
- Optimized network settings in `/etc/sysctl.conf`
- Increased file descriptor limits
- Enhanced systemd service configuration

### 3. Microphone Access Fix

**Problem**: Microphone permission errors despite browser access
**Solution**:
- Created comprehensive microphone fix utility
- Enhanced error messages with step-by-step instructions
- Added multiple fallback methods for getUserMedia
- Implemented audio level testing

**Key Changes**:
- New `microphoneFix.js` utility with advanced error handling
- Updated `audioManager.js` to use enhanced microphone fix
- Browser-specific troubleshooting instructions
- Real-time audio level testing

## 📋 Configuration Details

### Asterisk Configuration

**AMI Settings** (`manager.conf`):
- Port: 5038
- Admin user: admin/amp111
- Monitor user: monitor/monitor123
- Bind: 0.0.0.0 (all interfaces)
- Permits: 172.20.10.0/24, 127.0.0.1

**HTTP Interface** (`http.conf`):
- Port: 8088
- Bind: 0.0.0.0
- WebSocket support enabled

**SIP Extensions** (`pjsip.conf`):
- 1000: Admin extension
- 1001-1003: User extensions
- Password: "password" for all
- Transport: UDP/TCP on port 5060

### Backend Configuration

**Environment Variables** (`.env`):
```env
ASTERISK_HOST=172.20.10.5
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USERNAME=admin
ASTERISK_AMI_SECRET=amp111
SIP_DOMAIN=172.20.10.5
PUBLIC_HOST=172.20.10.5
CORS_ORIGINS=http://172.20.10.4:3000,http://localhost:3000
```

### Firewall Ports

**Required Open Ports**:
- 5038/tcp: Asterisk AMI
- 8088/tcp: Asterisk HTTP/WebSocket
- 5060/udp: SIP signaling
- 5060/tcp: SIP TCP (optional)
- 10000-20000/udp: RTP media

## 🧪 Testing and Verification

### 1. Asterisk Health Test

```bash
# Test AMI connection
telnet 172.20.10.5 5038

# Test HTTP interface
curl http://172.20.10.5:8088/

# Test with netcat
nc -zv 172.20.10.5 5038
```

### 2. Backend Health Test

```bash
# Test backend health endpoint
curl http://localhost:8080/api/health

# Should return JSON with "success": true and Asterisk as "healthy"
```

### 3. Microphone Test

1. Open VoIP application in browser
2. Try to make a call
3. Allow microphone access when prompted
4. Check browser console for microphone diagnostics
5. Enhanced error messages will guide you if issues occur

## 🔍 Expected Results

### When Everything Works Correctly:

1. **Asterisk Status**: `systemctl status asterisk` shows "active (running)"
2. **Ports Listening**: 5038, 8088, 5060 are accessible
3. **AMI Connection**: Can authenticate with admin/amp111
4. **Backend Health**: Returns Asterisk as "healthy"
5. **VoIP Dashboard**: System status shows all services as "healthy"
6. **Microphone**: Works without permission errors
7. **Performance**: System status loads in under 2 seconds

### System Status Dashboard:

- **Overall Status**: Healthy (green)
- **Asterisk Service**: Healthy
- **Database**: Connected
- **WebSocket**: Connected
- **Backend**: Running
- **Response Time**: < 100ms

## 🚨 Troubleshooting

### If Asterisk Still Shows Unhealthy:

1. Check backend logs for connection errors
2. Verify .env file has correct IP (172.20.10.5)
3. Test AMI connection manually: `telnet 172.20.10.5 5038`
4. Check firewall: `sudo ufw status`
5. Restart backend service with new configuration

### If System Status Loads Slowly:

1. Check network connectivity between PC and server
2. Verify backend is using new .env configuration
3. Check for timeout errors in browser console
4. Test backend health endpoint directly

### If Microphone Still Fails:

1. Check browser permissions: Settings > Privacy > Microphone
2. Try different browser (Chrome recommended)
3. Check browser console for detailed error messages
4. Follow enhanced error instructions provided by microphoneFix utility
5. Ensure HTTPS or localhost for microphone access

## 📞 Support Commands

### Asterisk Server Commands:
```bash
# Check service status
sudo systemctl status asterisk

# View logs
sudo journalctl -u asterisk -f

# Connect to Asterisk CLI
sudo asterisk -rvvv

# Test configuration
sudo asterisk -T
```

### Backend Commands:
```bash
# Check if backend is running
curl http://localhost:8080/api/health

# View backend logs (depends on how you run it)
# Check your backend startup logs
```

### Network Testing:
```bash
# Test connectivity
ping 172.20.10.5

# Test specific ports
nc -zv 172.20.10.5 5038
nc -zv 172.20.10.5 8088
```

## ✅ Success Checklist

- [ ] Asterisk service is running and healthy
- [ ] AMI port 5038 is accessible and authenticating
- [ ] HTTP port 8088 is responding
- [ ] Backend .env file has correct Asterisk IP
- [ ] Backend health endpoint returns Asterisk as healthy
- [ ] VoIP dashboard shows all services as healthy
- [ ] System status loads quickly (< 2 seconds)
- [ ] Microphone access works without errors
- [ ] Calls can be initiated and connected

## 🎯 Final Notes

This comprehensive fix addresses all known issues with the VoIP system. The enhanced error handling and performance optimizations should provide a much better user experience. If you encounter any remaining issues, the enhanced diagnostics will provide specific guidance for resolution.

**Remember**: After applying these fixes, restart your backend service and refresh your browser to ensure all changes take effect.
