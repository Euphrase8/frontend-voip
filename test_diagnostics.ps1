# Quick VoIP Diagnostics Test
# This script will help you test the diagnostic endpoint

Write-Host "=== VoIP Diagnostics Test ===" -ForegroundColor Green

# Check if backend is running
Write-Host "`nTesting backend connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://172.20.10.8:8080/health" -Method GET -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "✓ Backend is running" -ForegroundColor Green
    } else {
        Write-Host "✗ Backend health check failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Backend is not reachable. Make sure it's running with 'cd backend && make dev'" -ForegroundColor Red
    exit 1
}

# Get JWT token
Write-Host "`nTo test diagnostics, we need a JWT token." -ForegroundColor Yellow
Write-Host "Please follow these steps:" -ForegroundColor White
Write-Host "1. Open your browser and go to http://localhost:3000" -ForegroundColor White
Write-Host "2. Login with your credentials" -ForegroundColor White
Write-Host "3. Open browser console (F12)" -ForegroundColor White
Write-Host "4. Run: localStorage.getItem('token')" -ForegroundColor White
Write-Host "5. Copy the token (without quotes)" -ForegroundColor White

$token = Read-Host "`nPaste your JWT token here"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "No token provided. Exiting." -ForegroundColor Red
    exit 1
}

# Test diagnostics endpoint
Write-Host "`nTesting diagnostics endpoint..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "http://172.20.10.8:8080/protected/diagnostics" -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "✓ Diagnostics endpoint responded" -ForegroundColor Green
    Write-Host "`n=== DIAGNOSTIC RESULTS ===" -ForegroundColor Yellow
    
    # Display results in a readable format
    $diag = $response.diagnostics
    
    Write-Host "Timestamp: $($diag.timestamp)" -ForegroundColor White
    Write-Host "AMI Status: $($diag.ami_status)" -ForegroundColor $(if ($diag.ami_status -eq "connected") { "Green" } else { "Red" })
    
    if ($diag.errors -and $diag.errors.Count -gt 0) {
        Write-Host "`nErrors found:" -ForegroundColor Red
        foreach ($error in $diag.errors) {
            Write-Host "  - $error" -ForegroundColor Red
        }
    } else {
        Write-Host "`nNo errors found" -ForegroundColor Green
    }
    
    if ($diag.endpoints -and $diag.endpoints.Count -gt 0) {
        Write-Host "`nEndpoint Status:" -ForegroundColor Cyan
        foreach ($endpoint in $diag.endpoints) {
            $ext = $endpoint.extension
            $configured = $endpoint.endpoint_configured
            $contactCount = if ($endpoint.contacts) { $endpoint.contacts.Count } else { 0 }
            
            Write-Host "  Extension $ext:" -ForegroundColor White
            Write-Host "    Configured: $configured" -ForegroundColor $(if ($configured) { "Green" } else { "Red" })
            Write-Host "    Contacts: $contactCount" -ForegroundColor $(if ($contactCount -gt 0) { "Green" } else { "Yellow" })
            
            if ($endpoint.errors -and $endpoint.errors.Count -gt 0) {
                Write-Host "    Errors:" -ForegroundColor Red
                foreach ($error in $endpoint.errors) {
                    Write-Host "      - $error" -ForegroundColor Red
                }
            }
        }
    }
    
    Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Yellow
    
    if ($diag.ami_status -ne "connected") {
        Write-Host "1. AMI is not connected. Check Asterisk server and AMI configuration." -ForegroundColor Red
    }
    
    $hasUnconfiguredEndpoints = $false
    $hasUnregisteredEndpoints = $false
    
    foreach ($endpoint in $diag.endpoints) {
        if (-not $endpoint.endpoint_configured) {
            $hasUnconfiguredEndpoints = $true
        } elseif ($endpoint.contacts.Count -eq 0) {
            $hasUnregisteredEndpoints = $true
        }
    }
    
    if ($hasUnconfiguredEndpoints) {
        Write-Host "2. Some endpoints are not configured in Asterisk. Add them to /etc/asterisk/pjsip.conf" -ForegroundColor Red
    }
    
    if ($hasUnregisteredEndpoints) {
        Write-Host "3. Some endpoints are configured but not registered. Check frontend SIP registration." -ForegroundColor Yellow
    }
    
    if ($diag.ami_status -eq "connected" -and -not $hasUnconfiguredEndpoints -and -not $hasUnregisteredEndpoints) {
        Write-Host "✓ System looks healthy! Try making a call." -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ Failed to get diagnostics: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Token may be expired. Please get a fresh token." -ForegroundColor Yellow
    }
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
