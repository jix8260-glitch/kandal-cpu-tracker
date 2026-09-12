@echo off
title Push CPU Stock Tracker to GitHub
cd /d "%~dp0"
echo ====================================================================
echo   Pushing Kandal Commissary CPU Tracker to GitHub
echo   Repository: https://github.com/jix8260-glitch/kandal-cpu-tracker
echo ====================================================================
echo.

set "PATH=C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Users\USER\AppData\Local\Programs\Git\cmd;%PATH%"

echo 1. Initializing Git...
git init

echo 2. Adding files (ignoring node_modules via .gitignore)...
git add .

echo 3. Creating Commit...
git commit -m "CPU Stock Tracker - Kandal Commissary Kitchen (Tube Coffee & OnMart)"

echo 4. Setting branch to main...
git branch -M main

echo 5. Connecting remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/jix8260-glitch/kandal-cpu-tracker.git

echo.
echo 6. Pushing to GitHub...
echo (ប្រសិនបើមានផ្ទាំង Browser លោតឡើង សូមចុច 'Sign in with your browser' ដើម្បី Authorize)
echo.
git push -u origin main

echo.
echo ====================================================================
echo   ជោគជ័យ! (Success) ឥឡូវអ្នកអាចចូលទៅកាន់ Vercel ដើម្បី Import បានហើយ!
echo ====================================================================
pause
