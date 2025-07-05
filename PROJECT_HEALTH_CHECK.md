# VoIP Application - Project Health Check

## 🚀 Quick Health Check

Run these commands to check and fix your project:

```bash
# Check for errors
npm run check-errors

# Fix all detected errors
npm run fix-errors

# Configure Asterisk automatically
npm run configure-asterisk
```

## ✅ **Fixed Issues**

### **1. Environment Configuration**
- ✅ **Fixed Asterisk IP**: Updated from 172.20.10.2 to 172.20.10.5
- ✅ **Backend Configuration**: Verified backend/.env has correct settings
- ✅ **Frontend Configuration**: Updated .env with correct Asterisk server

### **2. Project Structure**
- ✅ **All Required Files**: Present and accounted for
- ✅ **Dependencies**: All necessary packages installed
- ✅ **Configuration Files**: Tailwind, PostCSS, package.json all correct

### **3. Code Quality**
- ✅ **Import/Export**: All imports properly configured
- ✅ **Component Structure**: React components properly structured
- ✅ **Utility Functions**: UI utilities and helpers working correctly

## 🔧 **Available Tools**

### **Error Detection & Fixing**
```bash
npm run check-errors    # Check for common issues
npm run fix-errors      # Automatically fix detected issues
```

### **Asterisk Configuration**
```bash
npm run configure-asterisk  # Auto-configure Asterisk connection
npm run discover-asterisk   # Discover Asterisk servers on network
npm run show-config        # Show current configuration
```

### **Development**
```bash
npm start              # Start development server
npm run build          # Build for production
npm test              # Run tests
```

## 📋 **Current Configuration Status**

### **Frontend (.env)**
```bash
REACT_APP_API_URL=http://172.20.10.4:8080
REACT_APP_SIP_SERVER=172.20.10.5          # ✅ Correct Asterisk IP
REACT_APP_SIP_WS_URL=ws://172.20.10.5:8088/ws  # ✅ Correct WebSocket URL
REACT_APP_CLIENT_IP=172.20.10.4
```

### **Backend (backend/.env)**
```bash
ASTERISK_HOST=172.20.10.5                 # ✅ Correct Asterisk IP
ASTERISK_AMI_PORT=5038                     # ✅ Correct AMI port
ASTERISK_AMI_USERNAME=admin                # ✅ Correct username
ASTERISK_AMI_SECRET=amp111                 # ✅ Correct password
```

### **Network Setup**
- **Asterisk Server**: 172.20.10.5 (Kali Linux) ✅
- **Backend Server**: 172.20.10.4 (Windows) ✅
- **Frontend Client**: 172.20.10.4 (Windows) ✅

## 🎯 **Next Steps**

### **1. Start the Application**
```bash
# Start frontend
npm start

# Start backend (in separate terminal)
cd backend
npm start
```

### **2. Test Asterisk Connection**
1. Open application in browser
2. Go to **Admin Dashboard** → **Settings**
3. Click **"Asterisk Diagnostics"**
4. Run diagnostics to verify connection

### **3. Test VoIP Functionality**
1. Login to the application
2. Try making a test call
3. Check call logs
4. Verify audio functionality

## 🔍 **Troubleshooting**

### **If Asterisk Shows Offline**
```bash
# SSH to Asterisk server
ssh kali@172.20.10.5
# Password: kali

# Check Asterisk status
sudo systemctl status asterisk

# Restart if needed
sudo systemctl restart asterisk
```

### **If Frontend Won't Start**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run check-errors
npm run fix-errors
```

### **If Backend Connection Fails**
```bash
# Check backend configuration
npm run show-config

# Reconfigure Asterisk
npm run configure-asterisk
```

## 📊 **Project Health Status**

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Configuration | ✅ Fixed | Asterisk IP corrected |
| Backend Configuration | ✅ Good | All settings correct |
| Dependencies | ✅ Good | All packages installed |
| Code Quality | ✅ Good | No syntax errors |
| Asterisk Connection | ⚠️ Needs Testing | Run diagnostics |
| Network Setup | ✅ Good | IPs configured correctly |

## 🛠️ **Maintenance Commands**

### **Regular Health Checks**
```bash
# Weekly health check
npm run check-errors

# After any configuration changes
npm run configure-asterisk
```

### **Development Workflow**
```bash
# Before starting development
npm run check-errors
npm start

# Before committing changes
npm run build
npm test
```

### **Production Deployment**
```bash
# Pre-deployment check
npm run fix-errors
npm run build
npm test
```

## 📞 **Support**

If you encounter issues:

1. **Run diagnostics**: `npm run check-errors`
2. **Auto-fix**: `npm run fix-errors`
3. **Check Asterisk**: Use web diagnostics tool
4. **Review logs**: Check browser console and backend logs

Your VoIP application is now properly configured and ready for use! 🎉
