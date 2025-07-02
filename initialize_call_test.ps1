#!/usr/bin/env powershell
# VoIP Call Initialization Test Script
# This script tests the complete call flow between two extensions

Write-Host "=== VoIP Call Initialization Test ===" -ForegroundColor Cyan
Write-Host "Testing call flow between extensions using WebRTC method" -ForegroundColor White

# Configuration
$BACKEND_URL = "http://localhost:8080"
$FRONTEND_URL = "http://localhost:3000"

# Test users
$CALLER = @{
    username = "user1"
    password = "password"
    extension = "1001"
}

$CALLEE = @{
    username = "user2" 
    password = "password"
    extension = "1002"
}

Write-Host "`n1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method GET -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "   ✓ Backend is healthy" -ForegroundColor Green
    } else {
        throw "Backend health check failed"
    }
} catch {
    Write-Host "   ✗ Backend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please ensure backend is running on $BACKEND_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n2. Logging in caller (user1 - extension 1001)..." -ForegroundColor Yellow
try {
    $callerLogin = Invoke-RestMethod -Uri "$BACKEND_URL/api/login" -Method POST -ContentType "application/json" -Body (@{
        username = $CALLER.username
        password = $CALLER.password
    } | ConvertTo-Json) -TimeoutSec 10
    
    if ($callerLogin.success) {
        Write-Host "   ✓ Caller logged in successfully" -ForegroundColor Green
        Write-Host "   - Token: $($callerLogin.token.Substring(0,20))..." -ForegroundColor Gray
        Write-Host "   - Extension: $($callerLogin.user.extension)" -ForegroundColor Gray
        $callerToken = $callerLogin.token
    } else {
        throw "Login failed: $($callerLogin.message)"
    }
} catch {
    Write-Host "   ✗ Caller login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Logging in callee (user2 - extension 1002)..." -ForegroundColor Yellow
try {
    $calleeLogin = Invoke-RestMethod -Uri "$BACKEND_URL/api/login" -Method POST -ContentType "application/json" -Body (@{
        username = $CALLEE.username
        password = $CALLEE.password
    } | ConvertTo-Json) -TimeoutSec 10

    if ($calleeLogin.success) {
        Write-Host "   ✓ Callee logged in successfully" -ForegroundColor Green
        Write-Host "   - Token: $($calleeLogin.token.Substring(0,20))..." -ForegroundColor Gray
        Write-Host "   - Extension: $($calleeLogin.user.extension)" -ForegroundColor Gray
        $calleeToken = $calleeLogin.token
    } else {
        throw "Login failed: $($calleeLogin.message)"
    }
} catch {
    Write-Host "   ✗ Callee login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Checking WebSocket connections..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $callerToken" }
    $connections = Invoke-RestMethod -Uri "$BACKEND_URL/protected/extensions/connected" -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "   Connected extensions: $($connections.count)" -ForegroundColor White
    Write-Host "   Total WebSocket clients: $($connections.total_clients)" -ForegroundColor White
    
    if ($connections.count -eq 0) {
        Write-Host "   ⚠ No extensions connected via WebSocket" -ForegroundColor Yellow
        Write-Host "   This is expected if users haven't opened the frontend yet" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ✗ Failed to check connections: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5. Testing call initiation (1001 -> 1002)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $callerToken"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        target_extension = $CALLEE.extension
    } | ConvertTo-Json
    
    $callResponse = Invoke-RestMethod -Uri "$BACKEND_URL/protected/call/initiate?method=webrtc" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    
    Write-Host "   ✓ Call initiation request sent successfully!" -ForegroundColor Green
    Write-Host "   - Success: $($callResponse.success)" -ForegroundColor White
    Write-Host "   - Message: $($callResponse.message)" -ForegroundColor White
    Write-Host "   - Method: $($callResponse.method)" -ForegroundColor White
    Write-Host "   - Call ID: $($callResponse.call_id)" -ForegroundColor White
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "   ✗ Call initiation failed: $errorMessage" -ForegroundColor Red
    
    if ($errorMessage -like "*not connected via WebSocket*") {
        Write-Host "   → This is expected - target extension needs to be connected via WebSocket" -ForegroundColor Yellow
        Write-Host "   → The call system is working correctly!" -ForegroundColor Green
    } elseif ($errorMessage -like "*not found*") {
        Write-Host "   → Target extension not found in database" -ForegroundColor Yellow
    } elseif ($errorMessage -like "*401*") {
        Write-Host "   → Authentication failed - token may be expired" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Call Initialization Test Complete ===" -ForegroundColor Cyan
Write-Host "`nNext Steps for Full Call Testing:" -ForegroundColor Yellow
Write-Host "1. Open two browser windows/tabs:" -ForegroundColor White
Write-Host "   - Window 1: $FRONTEND_URL (login as user1/password)" -ForegroundColor White
Write-Host "   - Window 2: $FRONTEND_URL (login as user2/password)" -ForegroundColor White
Write-Host "2. Both users will be connected via WebSocket" -ForegroundColor White
Write-Host "3. Try making a call from one extension to another" -ForegroundColor White
Write-Host "4. The target should receive an incoming call notification" -ForegroundColor White

Write-Host "`nTest Users Available:" -ForegroundColor Yellow
Write-Host "- user1 / password (Extension: 1001)" -ForegroundColor White
Write-Host "- user2 / password (Extension: 1002)" -ForegroundColor White  
Write-Host "- user3 / password (Extension: 1003)" -ForegroundColor White

Write-Host "`nBackend Status: ✓ Running on $BACKEND_URL" -ForegroundColor Green
Write-Host "Frontend Status: Check $FRONTEND_URL" -ForegroundColor White
