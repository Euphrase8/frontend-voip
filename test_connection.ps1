# Quick Connection Test for VoIP App
# Tests connectivity between your PC (172.20.10.4) and Asterisk (172.20.10.6)

Write-Host "=== VoIP Connection Test ===" -ForegroundColor Green
Write-Host "PC IP: 172.20.10.4" -ForegroundColor Cyan
Write-Host "Asterisk IP: 172.20.10.6" -ForegroundColor Cyan

# Test 1: Backend Health
Write-Host "`n1. Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://172.20.10.4:8080/health" -Method GET -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "   ✓ Backend is healthy" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Backend is not reachable" -ForegroundColor Red
    Write-Host "   Make sure backend is running: cd backend; go run main.go" -ForegroundColor Yellow
    exit 1
}

# Test 2: Backend Configuration
Write-Host "`n2. Testing Backend Configuration..." -ForegroundColor Yellow
try {
    $config = Invoke-RestMethod -Uri "http://172.20.10.4:8080/config" -Method GET -TimeoutSec 5
    Write-Host "   ✓ Configuration loaded" -ForegroundColor Green
    Write-Host "   API URL: $($config.config.api_url)" -ForegroundColor White
    Write-Host "   WebSocket: $($config.config.ws_url)" -ForegroundColor White
    Write-Host "   Asterisk: $($config.config.asterisk.host)" -ForegroundColor White
} catch {
    Write-Host "   ✗ Failed to get configuration" -ForegroundColor Red
}

# Test 3: Asterisk Connectivity
Write-Host "`n3. Testing Asterisk Connectivity..." -ForegroundColor Yellow

# Test AMI port (5038)
Write-Host "   Testing AMI port (172.20.10.6:5038)..." -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("172.20.10.6", 5038)
    $tcpClient.Close()
    Write-Host " ✓ OPEN" -ForegroundColor Green
} catch {
    Write-Host " ✗ CLOSED" -ForegroundColor Red
    Write-Host "   Check if Asterisk is running on 172.20.10.6" -ForegroundColor Yellow
}

# Test WebSocket port (8088)
Write-Host "   Testing WebSocket port (172.20.10.6:8088)..." -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("172.20.10.6", 8088)
    $tcpClient.Close()
    Write-Host " ✓ OPEN" -ForegroundColor Green
} catch {
    Write-Host " ✗ CLOSED" -ForegroundColor Red
    Write-Host "   Check Asterisk HTTP configuration" -ForegroundColor Yellow
}

# Test 4: Frontend Configuration
Write-Host "`n4. Checking Frontend Configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $apiUrl = ($envContent | Where-Object { $_ -match "REACT_APP_API_URL" }) -replace ".*=", ""
    $wsUrl = ($envContent | Where-Object { $_ -match "REACT_APP_WS_URL" }) -replace ".*=", ""
    $sipServer = ($envContent | Where-Object { $_ -match "REACT_APP_SIP_SERVER" }) -replace ".*=", ""
    
    Write-Host "   ✓ .env file found" -ForegroundColor Green
    Write-Host "   API URL: $apiUrl" -ForegroundColor White
    Write-Host "   WebSocket: $wsUrl" -ForegroundColor White
    Write-Host "   SIP Server: $sipServer" -ForegroundColor White
    
    if ($apiUrl -eq "http://172.20.10.4:8080" -and $sipServer -eq "172.20.10.6") {
        Write-Host "   ✓ Configuration looks correct" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Configuration may need adjustment" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ .env file not found" -ForegroundColor Red
    Write-Host "   Copy .env.example to .env and configure it" -ForegroundColor Yellow
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Green
Write-Host "1. If all tests pass, start your frontend: npm start" -ForegroundColor White
Write-Host "2. Login with your credentials" -ForegroundColor White
Write-Host "3. Try making a WebRTC call between extensions" -ForegroundColor White
Write-Host "4. Check browser console for any errors" -ForegroundColor White

Write-Host "`n=== Troubleshooting ===" -ForegroundColor Yellow
Write-Host "• If backend fails: cd backend && go run main.go" -ForegroundColor White
Write-Host "• If Asterisk ports closed: Check Asterisk server at 172.20.10.6" -ForegroundColor White
Write-Host "• If frontend fails: Check .env configuration" -ForegroundColor White
Write-Host "• For WebRTC calls: No Asterisk SIP registration needed!" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
