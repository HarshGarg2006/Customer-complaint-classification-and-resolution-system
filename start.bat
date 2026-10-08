@echo off
title ResolveAI - Customer Complaint AI

cd /d "%~dp0"

echo ================================================
echo       ResolveAI Customer Complaint AI
echo ================================================
echo.

echo Starting Backend...
start "ResolveAI Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python app.py"

timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "ResolveAI Frontend" cmd /k "cd /d "%~dp0" && py -m http.server 5500"

timeout /t 3 /nobreak >nul

echo.
echo Backend  : http://127.0.0.1:5000
echo Frontend : http://127.0.0.1:5500
echo.

start "" "http://127.0.0.1:5500"

echo.
echo ResolveAI started.
pause