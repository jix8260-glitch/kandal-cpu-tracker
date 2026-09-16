@echo off
title Secure Local-First Data Management System
color 0A
cls
echo ==============================================================================
echo           SECURE LOCAL-FIRST DATA MANAGEMENT SYSTEM (ISOLATED LAN)
echo ==============================================================================
echo.
echo [1] Local Wi-Fi Host IP: 192.168.1.44
echo [2] Main Terminal:       http://localhost:3000
echo [3] Mobile QR Scan URL:  http://192.168.1.44:3000/request
echo [4] Owner Admin Console: http://localhost:3000/admin
echo.
echo ------------------------------------------------------------------------------
echo Ensuring local data and backup directories exist...
if not exist "data" mkdir data
if not exist "data\backups" mkdir data\backups
echo.
echo Starting Next.js Local Server on 0.0.0.0:3000...
echo Phones connected to the SAME Wi-Fi network can scan and submit requests!
echo ------------------------------------------------------------------------------
echo.
npm run local
pause
