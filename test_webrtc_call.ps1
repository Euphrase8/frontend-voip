# Test WebRTC Call Method
# This script tests the new WebRTC calling method that bypasses Asterisk AMI

Write-Host "=== WebRTC Call Method Test ===" -ForegroundColor Green

# Configuration
$BACKEND_URL = "http://172.20.10.8:8080"

Write-Host "`nTesting WebRTC call method..." -ForegroundColor Cyan

# Check if backend is running
Write-Host "1. Checking backend connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "   ✓ Backend is running" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ✗ Backend is not reachable. Start it with: cd backend && go run main.go" -ForegroundColor Red
    exit 1
}

# Get JWT token
Write-Host "`n2. Getting JWT token..." -ForegroundColor Yellow
Write-Host "   Please follow these steps to get your JWT token:" -ForegroundColor White
Write-Host "   a) Open browser and go to http://localhost:3000" -ForegroundColor White
Write-Host "   b) Login with your credentials" -ForegroundColor White
Write-Host "   c) Open browser console (F12)" -ForegroundColor White
Write-Host "   d) Run: localStorage.getItem('token')" -ForegroundColor White
Write-Host "   e) Copy the token (without quotes)" -ForegroundColor White

$token = Read-Host "`n   Paste your JWT token here"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "   No token provided. Exiting." -ForegroundColor Red
    exit 1
}

# Get target extension
$targetExtension = Read-Host "`n3. Enter target extension to call (e.g., 1000)"

if ([string]::IsNullOrWhiteSpace($targetExtension)) {
    Write-Host "   No target extension provided. Exiting." -ForegroundColor Red
    exit 1
}

# Test WebRTC call initiation
Write-Host "`n4. Testing WebRTC call initiation..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        target_extension = $targetExtension
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BACKEND_URL/protected/call/initiate?method=webrtc" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    
    Write-Host "   ✓ WebRTC call initiated successfully!" -ForegroundColor Green
    Write-Host "`n   Response details:" -ForegroundColor Cyan
    Write-Host "   - Success: $($response.success)" -ForegroundColor White
    Write-Host "   - Message: $($response.message)" -ForegroundColor White
    Write-Host "   - Call ID: $($response.call_id)" -ForegroundColor White
    Write-Host "   - Method: $($response.method)" -ForegroundColor White
    Write-Host "   - Target: $($response.target)" -ForegroundColor White
    
} catch {
    Write-Host "   ✗ WebRTC call initiation failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "   HTTP Status: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "   → Token may be expired. Please get a fresh token." -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "   → Target extension not found in database." -ForegroundColor Yellow
        } elseif ($statusCode -eq 400) {
            Write-Host "   → Target user may not be online." -ForegroundColor Yellow
        }
    }
    exit 1
}

Write-Host "`n=== Test Results ===" -ForegroundColor Green
Write-Host "✓ Backend is running and accessible" -ForegroundColor Green
Write-Host "✓ JWT authentication is working" -ForegroundColor Green
Write-Host "✓ WebRTC call initiation is working" -ForegroundColor Green
Write-Host "✓ WebSocket notification should be sent to target user" -ForegroundColor Green

Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "1. Open your frontend application: http://localhost:3000" -ForegroundColor White
Write-Host "2. Login with the target extension ($targetExtension)" -ForegroundColor White
Write-Host "3. You should see an incoming call notification" -ForegroundColor White
Write-Host "4. Or go to: http://localhost:3000/webrtc-test to test the full WebRTC interface" -ForegroundColor White

Write-Host "`n=== Advantages of WebRTC Method ===" -ForegroundColor Cyan
Write-Host "✅ No dependency on Asterisk endpoint registration" -ForegroundColor Green
Write-Host "✅ Faster call setup (no AMI delays)" -ForegroundColor Green
Write-Host "✅ Direct peer-to-peer audio" -ForegroundColor Green
Write-Host "✅ Works even if Asterisk SIP endpoints are not configured" -ForegroundColor Green
Write-Host "✅ Easier to debug and troubleshoot" -ForegroundColor Green
Write-Host "✅ Better error handling and user feedback" -ForegroundColor Green

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
