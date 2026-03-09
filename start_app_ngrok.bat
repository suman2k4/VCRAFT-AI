@echo off
echo ========================================
echo  VCRAFT AI - ngrok Backend + Frontend
echo ========================================
echo.

echo [1/2] Starting Backend + ngrok tunnel...
start "VCRAFT AI Backend + ngrok" powershell -NoExit -Command "cd 'e:\VCRAFT AI\backend'; .\start_ngrok.ps1"

echo Waiting for backend and ngrok to initialize (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo [2/2] Starting Frontend Server (Port 5173)...
start "VCRAFT AI Frontend" powershell -NoExit -Command "cd 'e:\VCRAFT AI\frontend'; Write-Host 'Frontend starting...' -ForegroundColor Cyan; npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  VCRAFT AI Application Started!
echo ========================================
echo.
echo  IMPORTANT: Check the Backend terminal
echo  for your ngrok public URL, then set it
echo  in frontend/.env as VITE_API_BASE_URL
echo.
echo  ngrok Dashboard: http://localhost:4040
echo  Frontend:        http://localhost:5173
echo ========================================
echo.
pause
