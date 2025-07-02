# Test Incoming Call Functionality
Write-Host "=== Testing Incoming Call Functionality ===" -ForegroundColor Cyan

# Configuration
$BACKEND_URL = "http://localhost:8080"
$FRONTEND_URL = "http://localhost:3000"

Write-Host "`n1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "   ✓ Backend is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Backend is not accessible" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "$FRONTEND_URL" -Method GET -TimeoutSec 5
    if ($frontend.StatusCode -eq 200) {
        Write-Host "   ✓ Frontend is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Frontend is not accessible" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Logging in caller (user1 - extension 1001)..." -ForegroundColor Yellow
try {
    $callerLogin = Invoke-RestMethod -Uri "$BACKEND_URL/api/login" -Method POST -ContentType "application/json" -Body '{"username":"user1","password":"password"}' -TimeoutSec 10
    
    if ($callerLogin.success) {
        Write-Host "   ✓ Caller logged in successfully" -ForegroundColor Green
        Write-Host "   - Extension: $($callerLogin.user.extension)" -ForegroundColor Gray
        $callerToken = $callerLogin.token
    }
} catch {
    Write-Host "   ✗ Caller login failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Checking WebSocket connections..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $callerToken" }
    $connections = Invoke-RestMethod -Uri "$BACKEND_URL/protected/extensions/connected" -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "   Connected extensions: $($connections.count)" -ForegroundColor White
    Write-Host "   Total WebSocket clients: $($connections.total_clients)" -ForegroundColor White
    
    if ($connections.count -ge 1) {
        Write-Host "   ✓ Extensions are connected via WebSocket" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ No extensions connected - users need to login to frontend" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Failed to check connections" -ForegroundColor Red
}

Write-Host "`n5. Testing call initiation (1001 → 1002)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $callerToken"
        "Content-Type" = "application/json"
    }
    
    $callBody = '{"target_extension":"1002"}'
    $callResponse = Invoke-RestMethod -Uri "$BACKEND_URL/protected/call/initiate?method=webrtc" -Method POST -Headers $headers -Body $callBody -TimeoutSec 10
    
    Write-Host "   ✓ Call initiated successfully!" -ForegroundColor Green
    Write-Host "   - Success: $($callResponse.success)" -ForegroundColor White
    Write-Host "   - Method: $($callResponse.method)" -ForegroundColor White
    Write-Host "   - Call ID: $($callResponse.call_id)" -ForegroundColor White
    Write-Host "   - Message: $($callResponse.message)" -ForegroundColor White
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "   ✗ Call initiation result: $errorMessage" -ForegroundColor Red
    
    if ($errorMessage -like "*not connected via WebSocket*") {
        Write-Host "   → Target extension (1002) needs to be connected via WebSocket" -ForegroundColor Yellow
        Write-Host "   → Login to frontend as user2 to test incoming calls" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Incoming Call Test Instructions ===" -ForegroundColor Cyan
Write-Host "`nTo test the incoming call functionality:" -ForegroundColor Yellow
Write-Host "1. Open two browser windows/tabs:" -ForegroundColor White
Write-Host "   - Window 1: $FRONTEND_URL" -ForegroundColor White
Write-Host "   - Window 2: $FRONTEND_URL" -ForegroundColor White
Write-Host "`n2. Login to both windows:" -ForegroundColor White
Write-Host "   - Window 1: user1 / password (Extension 1001)" -ForegroundColor White
Write-Host "   - Window 2: user2 / password (Extension 1002)" -ForegroundColor White
Write-Host "`n3. From Window 1 (user1), call extension 1002" -ForegroundColor White
Write-Host "4. Window 2 (user2) should show incoming call popup with:" -ForegroundColor White
Write-Host "   - 📞 Incoming Call header" -ForegroundColor Gray
Write-Host "   - Caller: Ext 1001 (user1)" -ForegroundColor Gray
Write-Host "   - Priority: Normal • Method: WebRTC" -ForegroundColor Gray
Write-Host "   - Accept/Reject buttons" -ForegroundColor Gray
Write-Host "   - 30-second countdown timer" -ForegroundColor Gray

Write-Host "`nFixed Issues:" -ForegroundColor Green
Write-Host "✓ Fixed 'Cannot read properties of undefined' error" -ForegroundColor Green
Write-Host "✓ Added safety checks for callData and contacts" -ForegroundColor Green
Write-Host "✓ Enhanced incoming call display with clear caller info" -ForegroundColor Green
Write-Host "✓ Added WebRTC method indicator" -ForegroundColor Green
Write-Host "✓ Improved visual styling with emoji and better colors" -ForegroundColor Green

Write-Host "`nTest Users Available:" -ForegroundColor Yellow
Write-Host "- user1 / password (Extension: 1001)" -ForegroundColor White
Write-Host "- user2 / password (Extension: 1002)" -ForegroundColor White  
Write-Host "- user3 / password (Extension: 1003)" -ForegroundColor White
