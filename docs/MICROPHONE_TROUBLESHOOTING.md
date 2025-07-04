# 🎤 Microphone Troubleshooting Guide

This comprehensive guide helps you fix microphone issues in the VoIP application.

## 🚨 Quick Fixes

### 1. **Immediate Solutions**
```bash
# Test microphone in browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone working');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(error => console.error('❌ Microphone failed:', error));
```

### 2. **Permission Issues**
- **Chrome**: Click the microphone icon in address bar → Allow
- **Firefox**: Click the microphone icon in address bar → Allow
- **Safari**: Safari → Preferences → Websites → Microphone → Allow
- **Edge**: Click the microphone icon in address bar → Allow

### 3. **HTTP vs HTTPS Issues**
- **Best Solution**: Use HTTPS in production
- **Development**: Access via `localhost` or `127.0.0.1`
- **Network Access**: Follow browser-specific HTTP setup below

## 🔧 Browser-Specific Solutions

### Google Chrome
```bash
# Method 1: Command line flags (Recommended for development)
chrome.exe --unsafely-treat-insecure-origin-as-secure="http://your-ip:3000" --user-data-dir="C:\temp\chrome-dev"

# Method 2: Chrome flags
# 1. Open chrome://flags/
# 2. Search "Insecure origins treated as secure"
# 3. Add your URL: http://your-ip:3000
# 4. Restart Chrome
```

### Mozilla Firefox
```bash
# Method 1: about:config
# 1. Open about:config
# 2. Search media.devices.insecure.enabled
# 3. Set to true
# 4. Restart Firefox
```

### Microsoft Edge
```bash
# Method 1: Edge flags
# 1. Open edge://flags/
# 2. Search "Insecure origins treated as secure"
# 3. Add your URL
# 4. Restart Edge
```

### Safari
- Requires HTTPS for microphone access
- Use Safari Technology Preview for development
- Enable "Develop" menu for testing options

## 🛠️ Hardware Troubleshooting

### Check Microphone Hardware
1. **Windows**:
   ```
   Settings → System → Sound → Input → Test your microphone
   ```

2. **macOS**:
   ```
   System Preferences → Sound → Input → Test microphone levels
   ```

3. **Linux**:
   ```bash
   # Test microphone
   arecord -l  # List audio devices
   arecord -d 5 test.wav  # Record 5-second test
   aplay test.wav  # Play back test
   ```

### Common Hardware Issues
- **No microphone detected**: Check USB/audio jack connections
- **Microphone in use**: Close Zoom, Teams, Discord, etc.
- **Low volume**: Adjust microphone levels in system settings
- **Wrong device**: Select correct microphone in browser settings

## 🔍 Diagnostic Tools

### Built-in App Diagnostics
The VoIP app includes comprehensive diagnostics:

1. **Access Diagnostics**:
   - Click "Fix Microphone" button when issues occur
   - Or manually trigger from dashboard

2. **Diagnostic Tests**:
   - ✅ Browser support check
   - ✅ Secure context verification
   - ✅ Device availability scan
   - ✅ Permission status check
   - ✅ Audio context test
   - ✅ Media stream test

3. **Automatic Fixes**:
   - Permission requests
   - Browser-specific recommendations
   - Hardware troubleshooting steps

### Manual Browser Tests
```javascript
// Test 1: Check getUserMedia support
console.log('getUserMedia support:', !!(
  navigator.mediaDevices?.getUserMedia ||
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia
));

// Test 2: Check permissions
navigator.permissions?.query({ name: 'microphone' })
  .then(result => console.log('Permission:', result.state));

// Test 3: List audio devices
navigator.mediaDevices?.enumerateDevices()
  .then(devices => {
    const audioInputs = devices.filter(d => d.kind === 'audioinput');
    console.log('Audio inputs:', audioInputs.length);
  });
```

## ⚠️ Common Error Messages

### "NotAllowedError"
**Cause**: Permission denied by user
**Fix**: 
1. Grant microphone permission in browser
2. Reload page after granting permission
3. Check site permissions in browser settings

### "NotFoundError"
**Cause**: No microphone device found
**Fix**:
1. Connect a microphone or headset
2. Check device connections
3. Verify microphone works in system settings

### "NotReadableError"
**Cause**: Microphone being used by another app
**Fix**:
1. Close video conferencing apps (Zoom, Teams, etc.)
2. Close other browser tabs using microphone
3. Restart browser if needed

### "SecurityError"
**Cause**: HTTPS required or security restrictions
**Fix**:
1. Use HTTPS in production
2. Use localhost for development
3. Follow browser-specific HTTP setup

### "OverconstrainedError"
**Cause**: Microphone doesn't support requested settings
**Fix**:
1. Try basic audio constraints: `{ audio: true }`
2. Use different microphone if available
3. Update audio drivers

## 🚀 Production Deployment

### HTTPS Setup
```bash
# Option 1: Let's Encrypt (Free SSL)
certbot --nginx -d yourdomain.com

# Option 2: Self-signed certificate (Development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Option 3: Cloudflare (Automatic HTTPS)
# Just point your domain to Cloudflare
```

### Server Configuration
```nginx
# Nginx HTTPS configuration
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📱 Mobile Considerations

### iOS Safari
- **Requires HTTPS** - no workarounds
- Test on desktop first
- Use HTTPS for mobile testing

### Android Chrome
- Follows desktop Chrome rules
- Can use HTTP with proper flags
- HTTPS recommended for production

## 🔗 Additional Resources

- [WebRTC Troubleshooting Guide](./WEBRTC_TESTING_GUIDE.md)
- [HTTP Microphone Access Guide](./HTTP_MICROPHONE_ACCESS.md)
- [Browser Compatibility Guide](../README.md#browser-support)

## 📞 Still Having Issues?

1. **Check Browser Console**: Look for specific error messages
2. **Try Different Browser**: Test with Chrome, Firefox, or Edge
3. **Test Hardware**: Verify microphone works in other applications
4. **Use Diagnostics**: Run the built-in diagnostic tool in the app
5. **Check Network**: Ensure stable internet connection

The VoIP application includes comprehensive error handling and user guidance to help resolve most microphone issues automatically.
