# VCRAFT AI Backend Startup Script
Write-Host "Starting VCRAFT AI Backend Server..." -ForegroundColor Green

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Start uvicorn server
Write-Host "Launching server on http://localhost:8000" -ForegroundColor Cyan
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Keep the terminal open if there's an error
if ($LASTEXITCODE -ne 0) {
    Write-Host "Server exited with error code: $LASTEXITCODE" -ForegroundColor Red
    pause
}
