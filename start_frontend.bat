@echo off
cd /d "%~dp0\frontend"
echo Starting MedLabel AI Frontend on http://localhost:5173...
call npm.cmd run dev
pause
