@echo off
REM KFA Validation Queue Worker
REM This script starts the Laravel queue worker
REM Keep this window open to process background jobs

echo ====================================
echo KFA Validation Queue Worker
echo ====================================
echo.
echo Starting queue worker...
echo Press Ctrl+C to stop
echo.

cd /d "%~dp0"
php artisan queue:work --tries=3 --timeout=600 --sleep=3

pause
