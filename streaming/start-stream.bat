@echo off
title SAMTEK VMS — Streaming Server
color 0A

echo.
echo  ============================================
echo   SAMTEK VMS — Streaming Server
echo  ============================================
echo.

cd /d "%~dp0"
echo [CHECK] Verifying dependencies...

if not exist "mediamtx.exe" (
    echo.
    echo [ERROR] mediamtx.exe not found in: %CD%
    echo.
    echo   Download from:
    echo   https://github.com/bluenviron/mediamtx/releases
    echo.
    echo   Extract mediamtx.exe into this folder.
    echo.
    pause
    exit /b 1
)

where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] ffmpeg not found in PATH.
    echo.
    echo   Install with:  winget install ffmpeg
    echo   Or download:   https://ffmpeg.org/download.html
    echo.
    pause
    exit /b 1
)

if not exist "traffic.mp4" (
    echo.
    echo [ERROR] traffic.mp4 not found in: %CD%
    echo.
    echo   Copy or symlink your video file here:
    echo   copy "..\ai-service\traffic.mp4" "traffic.mp4"
    echo.
    pause
    exit /b 1
)

echo [OK] All checks passed.
echo.
echo [INFO] Starting MediaMTX...
echo.
echo   RTSP  ──  rtsp://localhost:8554/live
echo   WebRTC ── http://localhost:8889/live
echo.
echo   Frontend WHEP ── http://localhost:8889/live/whep
echo   AI Service ───── rtsp://localhost:8554/live
echo.
echo ──────────────────────────────────────────
echo   Press Ctrl+C to stop the server
echo ──────────────────────────────────────────
echo.

mediamtx.exe mediamtx.yml
