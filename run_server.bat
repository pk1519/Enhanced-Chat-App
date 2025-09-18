@echo off
echo Starting Enhanced Chat Application Server...
echo.
echo The application will be available at:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Try different server options
if exist "C:\Python*\python.exe" (
    echo Using Python server...
    python -m http.server 8000
) else if exist "C:\Program Files\nodejs\node.exe" (
    echo Using Node.js server...
    npx serve . -p 8000
) else (
    echo No Python or Node.js found. 
    echo Please install Python or Node.js to run a local server.
    echo.
    echo Alternatively, you can:
    echo 1. Open index.html directly in your browser
    echo 2. Use any other local server solution
    echo.
    pause
)
