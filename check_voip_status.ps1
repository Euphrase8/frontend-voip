# VoIP System Status Checker
# Run this script from your PC (172.20.10.8) to check the status of your VoIP system

Write-Host "=== VoIP System Status Checker ===" -ForegroundColor Green
Write-Host "Checking connectivity and status..." -ForegroundColor Yellow

# Configuration
$ASTERISK_IP = "172.20.10.6"
$BACKEND_IP = "172.20.10.8"
$AMI_PORT = 5038
$WEBSOCKET_PORT = 8088
$BACKEND_PORT = 8080

Write-Host "`n1. Testing Network Connectivity..." -ForegroundColor Cyan

# Test AMI port
Write-Host "   Testing AMI port ($ASTERISK_IP:$AMI_PORT)..." -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($ASTERISK_IP, $AMI_PORT)
    $tcpClient.Close()
    Write-Host " ✓ OPEN" -ForegroundColor Green
} catch {
    Write-Host " ✗ CLOSED" -ForegroundColor Red
}

# Test WebSocket port
Write-Host "   Testing WebSocket port ($ASTERISK_IP:$WEBSOCKET_PORT)..." -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($ASTERISK_IP, $WEBSOCKET_PORT)
    $tcpClient.Close()
    Write-Host " ✓ OPEN" -ForegroundColor Green
} catch {
    Write-Host " ✗ CLOSED" -ForegroundColor Red
}

# Test Backend port
Write-Host "   Testing Backend port ($BACKEND_IP:$BACKEND_PORT)..." -NoNewline
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect($BACKEND_IP, $BACKEND_PORT)
    $tcpClient.Close()
    Write-Host " ✓ OPEN" -ForegroundColor Green
} catch {
    Write-Host " ✗ CLOSED" -ForegroundColor Red
}

Write-Host "`n2. Testing Backend Health..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://$BACKEND_IP:$BACKEND_PORT/health" -Method GET -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "   Backend health: ✓ OK" -ForegroundColor Green
    } else {
        Write-Host "   Backend health: ✗ UNHEALTHY" -ForegroundColor Red
    }
} catch {
    Write-Host "   Backend health: ✗ UNREACHABLE" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Testing WebSocket Endpoint..." -ForegroundColor Cyan
try {
    # Simple HTTP request to WebSocket endpoint (should get upgrade required)
    $response = Invoke-WebRequest -Uri "http://$ASTERISK_IP:$WEBSOCKET_PORT/ws" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "   WebSocket endpoint: ✓ RESPONDING" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 426) {
        Write-Host "   WebSocket endpoint: ✓ RESPONDING (Upgrade Required - Normal)" -ForegroundColor Green
    } else {
        Write-Host "   WebSocket endpoint: ✗ NOT RESPONDING" -ForegroundColor Red
    }
}

Write-Host "`n4. Manual Commands to Run on Asterisk Server:" -ForegroundColor Cyan
Write-Host "   SSH to your Kali Linux server (172.20.10.6) and run:" -ForegroundColor Yellow
Write-Host "   sudo asterisk -rx 'pjsip show endpoints'" -ForegroundColor White
Write-Host "   sudo asterisk -rx 'pjsip show contacts'" -ForegroundColor White
Write-Host "   sudo asterisk -rx 'pjsip show transports'" -ForegroundColor White
Write-Host "   sudo asterisk -rx 'manager show connected'" -ForegroundColor White

Write-Host "`n5. Backend Diagnostic Endpoint:" -ForegroundColor Cyan
Write-Host "   To check backend diagnostics, you need a JWT token." -ForegroundColor Yellow
Write-Host "   1. Login to your frontend application" -ForegroundColor White
Write-Host "   2. Open browser console and run: localStorage.getItem('token')" -ForegroundColor White
Write-Host "   3. Then run this command with your token:" -ForegroundColor White
Write-Host "   curl -H `"Authorization: Bearer YOUR_TOKEN`" http://172.20.10.8:8080/protected/diagnostics" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Green
Write-Host "1. If any ports are CLOSED, check firewall settings on Asterisk server" -ForegroundColor White
Write-Host "2. If backend is UNREACHABLE, make sure it's running with 'cd backend && make dev'" -ForegroundColor White
Write-Host "3. Run the manual commands on Asterisk server to check endpoint configuration" -ForegroundColor White
Write-Host "4. Check the TROUBLESHOOTING_GUIDE.md file for detailed solutions" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
