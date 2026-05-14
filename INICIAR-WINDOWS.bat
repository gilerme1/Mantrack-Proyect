@echo off
chcp 65001 >nul
cd /d "%~dp0"
cls
echo.
echo   ==================================
echo   MantTrack v1.0 - Single Tenant
echo   ==================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo   ERROR: Node.js no encontrado.
  echo   Instala desde: https://nodejs.org
  pause & start https://nodejs.org & exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set VER=%%i
echo   OK Node.js %VER%

if not exist "node_modules\" (
  echo.
  echo   Instalando dependencias (primera vez ~2 min)...
  call npm install --no-audit --no-fund --loglevel=error
  if %errorlevel% neq 0 ( echo   ERROR de instalacion. & pause & exit /b 1 )
)

echo.
echo   Verificando base de datos...
set DB_WAS_MISSING=0
if not exist "prisma\manttrack.db" set DB_WAS_MISSING=1
call npx prisma db push --accept-data-loss >nul

if "%DB_WAS_MISSING%"=="1" (
  echo.
  echo   Configurando datos iniciales...
  call node prisma/seed.js
)

echo.
echo   Iniciando MantTrack...
echo   App: http://localhost:5173
echo   Login: admin@empresa.com / admin123
echo.

start "" cmd /c "timeout /t 4 >nul && start http://localhost:5173"
call npx concurrently --names "API,APP" "node server/index.js" "npx vite"
pause
