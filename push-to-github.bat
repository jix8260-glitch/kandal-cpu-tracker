@echo off
title Push CPU Stock Tracker to GitHub
cd /d "%~dp0"
echo ====================================================================
echo   Pushing Kandal Commissary CPU Tracker to GitHub
echo   Repository: https://github.com/jix8260-glitch/kandal-cpu-tracker
echo ====================================================================
echo.

set "PATH=C:\Users\USER\AppData\Local\Programs\MinGit\cmd;%PATH%"

echo 1. Adding latest files...
git add .

echo 2. Committing latest changes...
git commit -m "Update CPU Tracker with permanent storage and branding" 2>nul

echo 3. Setting branch to main...
git branch -M main

echo 4. Pushing to GitHub...
echo (ប្រសិនបើមានផ្ទាំង Browser លោតឡើង សូមចុច 'Sign in with your browser' ដើម្បី Authorize)
echo.
git push -u origin main

echo.
echo ====================================================================
echo   ជោគជ័យ! (Success) ឥឡូវអ្នកអាចចូលទៅកាន់ Vercel ដើម្បី Import បានហើយ!
echo ====================================================================
pause
