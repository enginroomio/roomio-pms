@echo off
setlocal EnableExtensions

REM Roomio PMS — Windows kısayolu
set "SCRIPT_DIR=%~dp0"
set "ROOT=%SCRIPT_DIR%.."

if exist "%ROOT%\package.json" goto :found
if defined ROOMIO_ROOT if exist "%ROOMIO_ROOT%\package.json" set "ROOT=%ROOMIO_ROOT%" & goto :found
if exist "%USERPROFILE%\Projects\roomio-pms\package.json" set "ROOT=%USERPROFILE%\Projects\roomio-pms" & goto :found

echo Roomio proje klasoru bulunamadi.
pause
exit /b 1

:found
cd /d "%ROOT%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js gerekli: https://nodejs.org
  pause
  exit /b 1
)

node scripts\roomio-desktop.mjs
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" pause
exit /b %EC%
