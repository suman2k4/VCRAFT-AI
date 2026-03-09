# VCRAFT AI - Start Backend with ngrok Tunnel
# ==============================================
# This script starts the FastAPI backend on port 8000
# and creates an ngrok tunnel to expose it publicly.
#
# Prerequisites:
#   1. Install ngrok: https://ngrok.com/download  (or: choco install ngrok)
#   2. Sign up at https://ngrok.com and get your auth token
#   3. Run once: ngrok config add-authtoken YOUR_TOKEN
#
# Usage:
#   .\start_ngrok.ps1
# ==============================================

param(
    [int]$Port = 8000
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VCRAFT AI - ngrok Backend Hosting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "ERROR: ngrok is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install ngrok:" -ForegroundColor Yellow
    Write-Host "  Option 1: choco install ngrok" -ForegroundColor White
    Write-Host "  Option 2: Download from https://ngrok.com/download" -ForegroundColor White
    Write-Host ""
    Write-Host "Then authenticate:" -ForegroundColor Yellow
    Write-Host "  ngrok config add-authtoken YOUR_AUTH_TOKEN" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "[1/3] Activating virtual environment..." -ForegroundColor Green
try {
    & .\venv\Scripts\Activate.ps1
} catch {
    Write-Host "WARNING: Could not activate venv. Continuing with system Python..." -ForegroundColor Yellow
}

Write-Host "[2/3] Starting FastAPI backend on port $Port..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", $Port `
    -PassThru -NoNewWindow

# Wait for backend to be ready
Write-Host "    Waiting for backend to initialize..." -ForegroundColor Gray
$maxRetries = 30
$retryCount = 0
$backendReady = $false

while (-not $backendReady -and $retryCount -lt $maxRetries) {
    Start-Sleep -Seconds 2
    $retryCount++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    } catch {
        Write-Host "    Attempt $retryCount/$maxRetries - Backend not ready yet..." -ForegroundColor Gray
    }
}

if (-not $backendReady) {
    Write-Host "ERROR: Backend failed to start within 60 seconds." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "    Backend is running on http://localhost:$Port" -ForegroundColor Green

Write-Host "[3/3] Starting ngrok tunnel..." -ForegroundColor Green
Write-Host ""

# Start ngrok and capture the public URL
$ngrokProcess = Start-Process -FilePath "ngrok" `
    -ArgumentList "http", $Port, "--log=stdout" `
    -PassThru -NoNewWindow

# Wait for ngrok to establish tunnel
Start-Sleep -Seconds 3

# Get the public URL from ngrok API
try {
    $ngrokApi = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $publicUrl = ($ngrokApi.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
    
    if (-not $publicUrl) {
        $publicUrl = ($ngrokApi.tunnels | Select-Object -First 1).public_url
    }
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  NGROK TUNNEL ACTIVE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Public URL:  $publicUrl" -ForegroundColor Yellow
    Write-Host "  Local URL:   http://localhost:$Port" -ForegroundColor White
    Write-Host "  API Docs:    $publicUrl/docs" -ForegroundColor White
    Write-Host "  Health:      $publicUrl/health" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  FRONTEND SETUP:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Set this in frontend/.env:" -ForegroundColor Yellow
    Write-Host "  VITE_API_BASE_URL=$publicUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "  Then restart the frontend dev server." -ForegroundColor Gray
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Press Ctrl+C to stop both servers" -ForegroundColor Gray
    Write-Host "========================================" -ForegroundColor Cyan
} catch {
    Write-Host "WARNING: Could not fetch ngrok URL automatically." -ForegroundColor Yellow
    Write-Host "Check http://localhost:4040 for the tunnel URL." -ForegroundColor Yellow
}

# Keep running until Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Check if processes are still running
        if ($backendProcess.HasExited) {
            Write-Host "Backend process exited unexpectedly!" -ForegroundColor Red
            break
        }
        if ($ngrokProcess.HasExited) {
            Write-Host "ngrok process exited unexpectedly!" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "Shutting down..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $ngrokProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "All processes stopped." -ForegroundColor Green
}
