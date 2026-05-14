@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
cls

echo ==================================
echo MantTrack v1.0 - Single Tenant
echo ==================================
echo.

:: 1. Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no encontrado.
    pause
    start https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set VER=%%i
echo OK Node.js %VER%

:: 2. Instalacion de dependencias
if not exist "node_modules\" (
    echo.
    echo Instalando dependencias...
    echo (Esto incluye los motores de Prisma, puede tardar...)
    
    set "npm_config_fetch_retry_maxtimeout=60000"
    
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [X] ERROR DE INSTALACION.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas.
)

:: 3. Configurar base de datos (Prisma)
if not exist "prisma\manttrack.db" (
    echo.
    echo Configurando base de datos...
    call npx prisma generate
    call npx prisma db push --accept-data-loss
    call node prisma/seed.js
)

echo.
echo Iniciando MantTrack...
echo App: http://localhost:5173
echo.

start "" cmd /c "timeout /t 5 >nul && start http://localhost:5173"
call npx concurrently --names "API,APP" "node server/index.js" "npx vite"
pause