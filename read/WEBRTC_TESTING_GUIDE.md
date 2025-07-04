# WebRTC Testing Guide

## Overview

This guide provides comprehensive testing procedures for the enhanced WebRTC implementation to ensure proper voice communication.

## Pre-Testing Checklist

### 1. Browser Requirements
- **Chrome/Edge**: Version 80+ (recommended)
- **Firefox**: Version 75+
- **Safari**: Version 13+
- **HTTPS**: Required for production (HTTP works for localhost)

### 2. Microphone Permissions
- Ensure microphone access is granted
- Test microphone in browser settings
- Check for conflicting applications using microphone

### 3. Network Configuration
- Stable internet connection
- STUN servers accessible (Google STUN servers used)
- No restrictive firewall blocking WebRTC traffic

## Testing Procedures

### Test 1: Media Setup Verification

**Objective**: Verify microphone access and audio stream creation

**Steps**:
1. Open browser console (F12 → Console)
2. Navigate to application
3. Login with test account
4. Look for console messages:
   ```
   [WebRTCCallService] Setting up local media...
   [WebRTCCallService] Local media setup successful
   ```

**Expected Results**:
- No permission errors
- Audio tracks successfully created
- Stream ID logged in console

**Troubleshooting**:
- If permission denied: Grant microphone access in browser
- If no microphone found: Check hardware connections
- If microphone busy: Close other applications using microphone

### Test 2: WebSocket Connection

**Objective**: Verify real-time communication channel

**Steps**:
1. Check console for WebSocket messages:
   ```
   [WebRTCCallService] WebSocket connected
   [WebRTCCallService] WebSocket ready for extension: 1001
   ```
2. Verify connection status shows "Ready"

**Expected Results**:
- WebSocket connection established
- Extension properly registered
- No connection errors

### Test 3: Call Initiation

**Objective**: Test outgoing call setup

**Steps**:
1. Login with two different accounts (e.g., ext 1001 and 1002)
2. From first account, initiate call to second extension
3. Monitor console for:
   ```
   [WebRTCCallService] Creating peer connection
   [WebRTCCallService] Local media setup complete
   [WebRTCCallService] Creating offer
   [WebRTCCallService] Offer sent to: 1002
   ```

**Expected Results**:
- Call invitation sent successfully
- Peer connection created
- Offer generated and transmitted

### Test 4: Call Acceptance and Answer

**Objective**: Test incoming call handling and WebRTC negotiation

**Steps**:
1. On receiving end, accept incoming call
2. Monitor console for:
   ```
   [WebRTCCallService] Call accepted by target
   [WebRTCCallService] Setting remote description with offer
   [WebRTCCallService] Creating answer
   [WebRTCCallService] Answer sent
   ```

**Expected Results**:
- Offer received and processed
- Answer created and sent
- No SDP parsing errors

### Test 5: ICE Candidate Exchange

**Objective**: Verify network connectivity establishment

**Steps**:
1. During call setup, monitor for ICE candidates:
   ```
   [WebRTCCallService] Sending ICE candidate
   [WebRTCCallService] Received ICE candidate
   [WebRTCCallService] Adding ICE candidate
   ```
2. Check ICE connection state:
   ```
   [WebRTCCallService] ICE connection state: checking
   [WebRTCCallService] ICE connection state: connected
   ```

**Expected Results**:
- ICE candidates generated and exchanged
- ICE connection reaches "connected" state
- No candidate addition errors

### Test 6: Audio Stream Connection

**Objective**: Verify bidirectional audio communication

**Steps**:
1. After ICE connection established, check for:
   ```
   [WebRTCCallService] Received remote stream
   [WebRTCCallService] Remote audio playing successfully
   [WebRTCCallService] Audio Connected
   ```
2. Test speaking into microphone
3. Verify audio is heard on both ends

**Expected Results**:
- Remote audio stream received
- Audio elements properly configured
- Bidirectional voice communication established

### Test 7: Performance Monitoring

**Objective**: Verify call quality monitoring

**Steps**:
1. During active call, monitor performance stats:
   ```
   [WebRTCCallService] Connection quality: good
   [WebRTCCallService] Performance stats: {...}
   ```
2. Check for quality degradation warnings

**Expected Results**:
- Performance monitoring active
- Quality metrics collected
- Warnings for poor connection quality

### Test 8: Call Termination

**Objective**: Test proper call cleanup

**Steps**:
1. End call from either side
2. Monitor cleanup process:
   ```
   [WebRTCCallService] Ending call...
   [WebRTCCallService] Performing cleanup...
   [WebRTCCallService] Cleanup complete
   ```

**Expected Results**:
- All resources properly cleaned up
- Media streams stopped
- Peer connection closed
- UI returns to ready state

## Common Issues and Solutions

### Issue 1: "Microphone permission denied"
**Solution**: 
- Grant microphone permission in browser
- Reload page after granting permission
- Check browser settings for site permissions

### Issue 2: "ICE connection failed"
**Solution**:
- Check internet connection
- Verify STUN servers are accessible
- Try different network if behind restrictive firewall

### Issue 3: "No audio heard"
**Solution**:
- Check audio output device
- Verify remote audio element is playing
- Test with different browsers
- Check for audio autoplay restrictions

### Issue 4: "Call gets stuck at 'Connecting...'"
**Solution**:
- Check console for specific errors
- Verify both parties have granted microphone access
- Ensure WebSocket connection is stable
- Try refreshing both browser windows

## Performance Benchmarks

### Good Connection Quality
- Packet Loss: < 1%
- Round Trip Time: < 100ms
- Jitter: < 20ms
- Audio Quality: Clear, no dropouts

### Acceptable Connection Quality
- Packet Loss: 1-3%
- Round Trip Time: 100-200ms
- Jitter: 20-50ms
- Audio Quality: Slight degradation, occasional dropouts

### Poor Connection Quality
- Packet Loss: > 5%
- Round Trip Time: > 300ms
- Jitter: > 50ms
- Audio Quality: Significant degradation, frequent dropouts

## Success Criteria

A successful WebRTC call should achieve:
1. ✅ Microphone access granted and audio stream created
2. ✅ WebSocket connection established
3. ✅ Call invitation sent and received
4. ✅ Offer/Answer exchange completed without errors
5. ✅ ICE candidates exchanged and connection established
6. ✅ Bidirectional audio communication working
7. ✅ Performance monitoring active
8. ✅ Proper cleanup on call termination

## Next Steps

If all tests pass, the WebRTC implementation is working correctly. If issues persist:
1. Check browser compatibility
2. Verify network configuration
3. Test with different devices/networks
4. Review console logs for specific errors
5. Consider TURN server for restrictive networks
