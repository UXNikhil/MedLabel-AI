@echo off
cd /d "%~dp0"
echo Starting MedLabel AI Backend on http://127.0.0.1:8000...
"C:\Users\asus\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn main:app --reload --port 8000
pause
