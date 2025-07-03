# WebRTC Calling Troubleshooting Guide

## Overview

This guide helps troubleshoot WebRTC calling issues, particularly the "No client found for extension" error and setting up calls across different devices on a local network.

## Common Issues and Solutions

### 1. "No client found for extension: 1000" Error

This error occurs when:
- User is marked as "online" in the database but has no active WebSocket connection
- WebSocket connection was lost but user status wasn't updated
- Multiple devices trying to use the same extension

#### Solution Steps:

1. **Check WebSocket Connection Status**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8080/protected/extensions/status
   ```

2. **Verify Connected Extensions**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8080/protected/extensions/connected
   ```

3. **Test WebSocket Connection**
   ```bash
   cd backend/scripts
   go run test_websocket.go http://localhost:8080 1000
   ```

### 2. Multiple Devices Support

The system now supports multiple devices per extension:
- Each device creates a separate WebSocket connection
- Call invitations are sent to ALL connected devices for an extension
- Any device can answer the call

#### Device Connection Process:

1. **Frontend Connection**
   - Connect to WebSocket: `ws://SERVER_IP:8080/ws?extension=1000`
   - Maintain connection with periodic pings
   - Handle incoming call invitations

2. **Local Network Setup**
   - Ensure all devices can reach the server IP
   - Use the server's local network IP (e.g., 172.20.10.6)
   - Configure firewall to allow port 8080

### 3. Network Configuration

#### Server Configuration:
```bash
# Check server's network interfaces
ip addr show

# Find the correct local network IP
# Usually something like 192.168.x.x or 172.x.x.x
```

#### Frontend Configuration:
Update frontend to use server's local IP:
```javascript
const API_URL = "http://172.20.10.6:8080";
const WS_URL = "ws://172.20.10.6:8080/ws";
```

### 4. Debugging Commands

#### Check System Status:
```bash
# Get system statistics
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/protected/admin/stats

# Get connection status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/protected/extensions/status
```

#### Monitor WebSocket Connections:
```bash
# Watch server logs for WebSocket connections
tail -f /path/to/server.log | grep -E "(Client registered|Client unregistered|WebSocket)"
```

#### Test Call Initiation:
```bash
# Initiate WebRTC call
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"target_extension": "1001"}' \
     "http://localhost:8080/protected/call/initiate?method=webrtc"
```

## Setup for Multiple Devices

### 1. Server Setup
- Ensure server is accessible on local network
- Configure CORS to allow connections from all local IPs
- Use environment variable for PUBLIC_HOST if needed

### 2. Device Setup
Each device needs to:
1. Connect to the same server using local network IP
2. Authenticate and get a valid JWT token
3. Establish WebSocket connection with correct extension
4. Maintain connection with periodic pings

### 3. Network Requirements
- All devices on same local network (WiFi/Ethernet)
- Server port 8080 accessible from all devices
- No firewall blocking WebSocket connections
- Stable network connection for real-time communication

## Troubleshooting Steps

### Step 1: Verify Server Accessibility
```bash
# From each device, test server connectivity
curl http://SERVER_IP:8080/health
```

### Step 2: Check Authentication
```bash
# Login and get token
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password"}' \
     http://SERVER_IP:8080/api/login
```

### Step 3: Test WebSocket Connection
```bash
# Use the test script
go run backend/scripts/test_websocket.go http://SERVER_IP:8080 1000
```

### Step 4: Monitor Connection Status
```bash
# Check which extensions are connected
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://SERVER_IP:8080/protected/extensions/status
```

### Step 5: Test Call Flow
1. Ensure both caller and callee have active WebSocket connections
2. Verify both users are marked as "online"
3. Initiate call using WebRTC method
4. Check server logs for detailed error messages

## Configuration Files

### Environment Variables:
```bash
PUBLIC_HOST=172.20.10.6  # Use your server's local IP
PORT=8080
DEBUG=true
CORS_ORIGINS=*  # Allow all origins for development
```

### Frontend Configuration:
```javascript
const config = {
  apiUrl: "http://172.20.10.6:8080",
  wsUrl: "ws://172.20.10.6:8080/ws",
  // ... other config
};
```

## Common Error Messages

1. **"No client found for extension: 1000"**
   - Extension not connected via WebSocket
   - Check connection status endpoint

2. **"Target user is not online"**
   - User status in database is not "online"
   - Update user status or check login flow

3. **"WebSocket hub not available"**
   - Server initialization issue
   - Restart server and check logs

4. **"Failed to send call invitation"**
   - WebSocket connection lost during call
   - Check network stability

## Best Practices

1. **Connection Management**
   - Implement automatic reconnection in frontend
   - Handle connection drops gracefully
   - Send periodic pings to maintain connection

2. **Error Handling**
   - Check connection status before initiating calls
   - Provide clear error messages to users
   - Implement fallback mechanisms

3. **Network Optimization**
   - Use local network IPs for better performance
   - Minimize network hops
   - Ensure stable WiFi/Ethernet connections

4. **Monitoring**
   - Monitor WebSocket connection counts
   - Track call success/failure rates
   - Log detailed error information
