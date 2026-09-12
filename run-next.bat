@echo off
title Daily Stock & CPU Tracker (Next.js + Supabase)
cd /d "%~dp0"
echo ========================================================
echo   Daily Stock ^& CPU Tracker (Full-Stack Next.js 14)
echo   Tube Coffee ^& OnMart Enterprise Cloud Edition
echo ========================================================
echo.
set "PATH=C:\Users\USER\AppData\Local\Programs\nodejs;%PATH%"
echo Starting Next.js Server on http://localhost:3000 ...
echo.
call npm run dev -- -p 3000
pause
