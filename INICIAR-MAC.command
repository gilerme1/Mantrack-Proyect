#!/bin/bash
cd "$(dirname "$0")"
clear
echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║   MantTrack v1.0 · Single Tenant ║"
echo "  ╚══════════════════════════════════╝"
echo ""

if ! command -v node &>/dev/null; then
  echo "  ⚠️  Node.js no encontrado."
  echo "  Instala desde: https://nodejs.org (versión 18+)"
  read -n 1
  open "https://nodejs.org"
  exit 1
fi
echo "  ✓ Node.js $(node -v)"

if [ ! -d "node_modules" ]; then
  echo ""
  echo "  📦 Primera ejecución: instalando dependencias (~1-2 min)..."
  npm install --no-audit --no-fund --loglevel=error
  if [ $? -ne 0 ]; then echo "  ❌ Error. Verifica tu conexión."; read -n 1; exit 1; fi
  echo "  ✓ Dependencias instaladas"
fi

echo ""
echo "  🗄️  Verificando base de datos..."
DB_WAS_MISSING=0
if [ ! -f "prisma/manttrack.db" ]; then DB_WAS_MISSING=1; fi
npx prisma db push --accept-data-loss >/dev/null

if [ "$DB_WAS_MISSING" = "1" ]; then
  echo ""
  echo "  🗄️  Configurando datos iniciales..."
  node prisma/seed.js
  echo "  ✓ Base de datos lista"
fi

echo ""
echo "  🚀 Iniciando MantTrack..."
echo ""
echo "  App:  http://localhost:5173"
echo "  API:  http://localhost:3001"
echo ""
echo "  Login: admin@empresa.com / admin123"
echo "  Recuperar clave: npm run password:reset -- email@empresa.com nuevaClave"
echo ""
echo "  Para detener: Ctrl+C o cierra esta ventana"
echo ""

(sleep 3 && open "http://localhost:5173") &
npx concurrently --names "API,APP" --prefix-colors "cyan,green" \
  "node server/index.js" \
  "npx vite"
