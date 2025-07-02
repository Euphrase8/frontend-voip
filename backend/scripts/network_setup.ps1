# Network Setup and Testing Script for VoIP Backend (Windows PowerShell)
# This script helps identify the correct network configuration for multi-device calling

Write-Host "=== VoIP Backend Network Setup ===" -ForegroundColor Green
Write-Host ""

# Get server's IP addresses
Write-Host "1. Server Network Information:" -ForegroundColor Yellow
Write-Host "------------------------------"

$networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual" }

Write-Host "Available network interfaces:"
foreach ($adapter in $networkAdapters) {
    Write-Host "  - $($adapter.IPAddress)" -ForegroundColor Cyan
}

Write-Host ""

# Check if server is running
Write-Host "2. Server Status Check:" -ForegroundColor Yellow
Write-Host "----------------------"

$serverPort = if ($env:PORT) { $env:PORT } else { "8080" }
Write-Host "Checking if server is running on port $serverPort..."

$serverProcess = Get-NetTCPConnection -LocalPort $serverPort -ErrorAction SilentlyContinue
if ($serverProcess) {
    Write-Host "✓ Server is running on port $serverPort" -ForegroundColor Green
} else {
    Write-Host "✗ Server is not running on port $serverPort" -ForegroundColor Red
    Write-Host "  Start the server with: go run main.go" -ForegroundColor Yellow
}

Write-Host ""

# Test connectivity
Write-Host "3. Connectivity Test:" -ForegroundColor Yellow
Write-Host "--------------------"

# Get the first non-localhost IP
$serverIP = ($networkAdapters | Select-Object -First 1).IPAddress
if (-not $serverIP) {
    $serverIP = "localhost"
}

Write-Host "Testing connectivity to server at $serverIP`:$serverPort"

try {
    $response = Invoke-WebRequest -Uri "http://$serverIP`:$serverPort/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Server is accessible at http://$serverIP`:$serverPort" -ForegroundColor Green
} catch {
    Write-Host "✗ Server is not accessible at http://$serverIP`:$serverPort" -ForegroundColor Red
    Write-Host "  Check firewall settings and server configuration" -ForegroundColor Yellow
}

try {
    $configResponse = Invoke-WebRequest -Uri "http://$serverIP`:$serverPort/config" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Config endpoint is accessible" -ForegroundColor Green
    Write-Host "  Frontend should use: http://$serverIP`:$serverPort" -ForegroundColor Cyan
    Write-Host "  WebSocket URL: ws://$serverIP`:$serverPort/ws" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Config endpoint is not accessible" -ForegroundColor Red
}

Write-Host ""

# WebSocket test
Write-Host "4. WebSocket Test:" -ForegroundColor Yellow
Write-Host "-----------------"

if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Host "Testing WebSocket connection..."
    Write-Host "You can test WebSocket connectivity with:" -ForegroundColor Cyan
    Write-Host "  cd scripts && go run test_websocket.go http://$serverIP`:$serverPort 1000" -ForegroundColor White
} else {
    Write-Host "Go not available. Install Go to test WebSocket connections." -ForegroundColor Yellow
}

Write-Host ""

# Configuration recommendations
Write-Host "5. Configuration Recommendations:" -ForegroundColor Yellow
Write-Host "--------------------------------"

Write-Host "For multi-device calling on local network:" -ForegroundColor White
Write-Host ""
Write-Host "Environment Variables:" -ForegroundColor Cyan
Write-Host "  `$env:PUBLIC_HOST = `"$serverIP`"" -ForegroundColor White
Write-Host "  `$env:PORT = `"$serverPort`"" -ForegroundColor White
Write-Host "  `$env:DEBUG = `"true`"" -ForegroundColor White
Write-Host "  `$env:CORS_ORIGINS = `"*`"" -ForegroundColor White
Write-Host ""
Write-Host "Frontend Configuration:" -ForegroundColor Cyan
Write-Host "  const API_URL = `"http://$serverIP`:$serverPort`";" -ForegroundColor White
Write-Host "  const WS_URL = `"ws://$serverIP`:$serverPort/ws`";" -ForegroundColor White
Write-Host ""
Write-Host "Device Connection:" -ForegroundColor Cyan
Write-Host "  Each device should connect to: ws://$serverIP`:$serverPort/ws?extension=XXXX" -ForegroundColor White
Write-Host ""

# Firewall check
Write-Host "6. Firewall Configuration:" -ForegroundColor Yellow
Write-Host "-------------------------"

Write-Host "Ensure the following ports are open:" -ForegroundColor White
Write-Host "  - TCP $serverPort (HTTP/WebSocket)" -ForegroundColor Cyan
Write-Host "  - Allow connections from local network devices" -ForegroundColor Cyan
Write-Host ""

Write-Host "Windows Firewall commands:" -ForegroundColor Cyan
Write-Host "  New-NetFirewallRule -DisplayName `"VoIP Backend`" -Direction Inbound -Protocol TCP -LocalPort $serverPort -Action Allow" -ForegroundColor White
Write-Host ""

# Testing commands
Write-Host "7. Testing Commands:" -ForegroundColor Yellow
Write-Host "-------------------"

Write-Host "Test server health:" -ForegroundColor Cyan
Write-Host "  Invoke-WebRequest -Uri http://$serverIP`:$serverPort/health" -ForegroundColor White
Write-Host ""
Write-Host "Test login (replace credentials):" -ForegroundColor Cyan
Write-Host "  `$body = @{username=`"admin`"; password=`"password`"} | ConvertTo-Json" -ForegroundColor White
Write-Host "  Invoke-WebRequest -Uri http://$serverIP`:$serverPort/api/login -Method POST -Body `$body -ContentType `"application/json`"" -ForegroundColor White
Write-Host ""
Write-Host "Test WebSocket connection:" -ForegroundColor Cyan
Write-Host "  cd scripts && go run test_websocket.go http://$serverIP`:$serverPort 1000" -ForegroundColor White
Write-Host ""
Write-Host "Check connection status (with auth token):" -ForegroundColor Cyan
Write-Host "  `$headers = @{Authorization=`"Bearer YOUR_TOKEN`"}" -ForegroundColor White
Write-Host "  Invoke-WebRequest -Uri http://$serverIP`:$serverPort/protected/extensions/status -Headers `$headers" -ForegroundColor White
Write-Host ""

Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host "Use the information above to configure your frontend and test connections." -ForegroundColor White
Write-Host "For troubleshooting, see WEBRTC_TROUBLESHOOTING.md" -ForegroundColor Yellow
