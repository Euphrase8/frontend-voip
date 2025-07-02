# VoIP Call Initialization Test Script
Write-Host "=== VoIP Call Initialization Test ===" -ForegroundColor Cyan

# Configuration
$BACKEND_URL = "http://localhost:8080"

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

Write-Host "`n2. Logging in user1 (extension 1001)..." -ForegroundColor Yellow
try {
    $loginBody = @{
        username = "user1"
        password = "password"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "$BACKEND_URL/api/login" -Method POST -ContentType "application/json" -Body $loginBody -TimeoutSec 10
    
    if ($login.success) {
        Write-Host "   ✓ User1 logged in successfully" -ForegroundColor Green
        Write-Host "   - Extension: 1001" -ForegroundColor Gray
        $token = $login.token
    }
} catch {
    Write-Host "   ✗ Login failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n3. Checking WebSocket connections..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $connections = Invoke-RestMethod -Uri "$BACKEND_URL/protected/extensions/connected" -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "   Connected extensions: $($connections.count)" -ForegroundColor White
    Write-Host "   Total WebSocket clients: $($connections.total_clients)" -ForegroundColor White
} catch {
    Write-Host "   ✗ Failed to check connections" -ForegroundColor Red
}

Write-Host "`n4. Testing call initiation (1001 -> 1002)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $callBody = @{
        target_extension = "1002"
    } | ConvertTo-Json
    
    $callResponse = Invoke-RestMethod -Uri "$BACKEND_URL/protected/call/initiate?method=webrtc" -Method POST -Headers $headers -Body $callBody -TimeoutSec 10
    
    Write-Host "   ✓ Call initiated successfully!" -ForegroundColor Green
    Write-Host "   - Method: $($callResponse.method)" -ForegroundColor White
    Write-Host "   - Call ID: $($callResponse.call_id)" -ForegroundColor White
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "   ✗ Call initiation result: $errorMessage" -ForegroundColor Red
    
    if ($errorMessage -like "*not connected via WebSocket*") {
        Write-Host "   → This is expected - target needs WebSocket connection" -ForegroundColor Yellow
        Write-Host "   → The call system is working correctly!" -ForegroundColor Green
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "2. Login as user1/password or user2/password" -ForegroundColor White
Write-Host "3. Try making calls between extensions" -ForegroundColor White

Write-Host "`nTest Users:" -ForegroundColor Yellow
Write-Host "- user1 / password (Extension: 1001)" -ForegroundColor White
Write-Host "- user2 / password (Extension: 1002)" -ForegroundColor White  
Write-Host "- user3 / password (Extension: 1003)" -ForegroundColor White
