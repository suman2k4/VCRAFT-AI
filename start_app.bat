@echo off
echo Starting VCRAFT AI - Complete Application
echo.
echo Starting Backend Server (Port 8000)...
start "VCRAFT AI Backend" powershell -NoExit -Command "cd 'e:\VCRAFT AI\backend'; .\venv\Scripts\Activate.ps1; Write-Host 'Backend starting...' -ForegroundColor Green; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend Server (Port 3000)...
start "VCRAFT AI Frontend" powershell -NoExit -Command "cd 'e:\VCRAFT AI\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Cyan; npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo VCRAFT AI Application Started!
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to open the application...
pause >nul
start http://localhost:3000
