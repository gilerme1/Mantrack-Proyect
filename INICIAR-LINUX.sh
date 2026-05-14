#!/bin/bash
cd "$(dirname "$0")"
echo "MantTrack v1.0 · Single Tenant"
command -v node &>/dev/null || { echo "Instala Node.js desde https://nodejs.org"; exit 1; }
[ ! -d "node_modules" ] && npm install --no-audit --no-fund --loglevel=error
DB_WAS_MISSING=0
[ ! -f "prisma/manttrack.db" ] && DB_WAS_MISSING=1
npx prisma db push --accept-data-loss >/dev/null
[ "$DB_WAS_MISSING" = "1" ] && node prisma/seed.js
echo "Login: admin@empresa.com / admin123"
(sleep 3 && (xdg-open http://localhost:5173 2>/dev/null || open http://localhost:5173 2>/dev/null)) &
npx concurrently --names "API,APP" "node server/index.js" "npx vite"
