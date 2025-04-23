@echo off
echo Starting LLaVA Place Recognition Application...

echo.
echo 1. Starting backend API server...
start cmd /k "cd backend && python app.py"

echo.
echo 2. Starting frontend server...
echo Wait for backend to initialize before testing the application
start cmd /k "cd frontend && npx http-server . -p 3000 --cors"

echo.
echo Application starting:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo.
echo To test the connection: http://localhost:8000/ping
echo.
echo Press any key to exit this window (services will continue running)
pause > nul 