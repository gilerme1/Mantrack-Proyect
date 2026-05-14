# MantTrack · Single Tenant

Sistema de gestión de mantenimiento de equipos — versión para un solo cliente/empresa.

---

## ⚡ Requisito único
Node.js 18+ → https://nodejs.org

## 🚀 Ejecutar

| Sistema | Archivo |
|---------|---------|
| **macOS** | Doble click → `INICIAR-MAC.command` |
| **Windows** | Doble click → `INICIAR-WINDOWS.bat` |
| **Linux** | `./INICIAR-LINUX.sh` |

**Primera vez:** instala dependencias (~2 min) y crea la base de datos automáticamente.  
**Siguientes veces:** abre en ~5 segundos.

> En macOS, si aparece un aviso de seguridad, abrir con click derecho → **Abrir**.
> El equipo debe tener Node.js 18+ instalado y conexión a internet en la primera ejecución.

---

## 🔑 Acceso por defecto

```
Admin:   admin@empresa.com / admin123
Técnico: luis@empresa.com  / tech123
```

Cambia los emails/contraseñas en `prisma/seed.js` antes de entregar al cliente.  
Luego corre: `npm run db:reset`

## 🔐 Recuperar contraseña

Si nadie puede entrar, resetea la clave desde la carpeta de MantTrack:

```
npm run password:reset -- admin@empresa.com nuevaClave123
```

Si no escribes una nueva clave, el comando genera una temporal segura:

```
npm run password:reset -- admin@empresa.com
```

---

## 📱 PWA (instalar en celular)

- **Android Chrome:** menú ⋮ → Agregar a pantalla de inicio
- **iOS Safari:** Compartir → Agregar a pantalla de inicio  
- **Chrome desktop:** ícono ⊕ en barra de direcciones

---

## 🗄️ Base de datos

Por defecto usa **SQLite** (archivo local `prisma/manttrack.db`, sin configuración).

Para producción con PostgreSQL, edita `.env`:
```
DB_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:pass@host:5432/manttrack"
```

---

## 🏗️ Estructura

```
manttrack/
├── server/
│   ├── index.js           ← API Express
│   ├── middleware/auth.js ← JWT
│   └── routes/            ← clients, equipment, reports, stats
├── src/
│   ├── components/        ← UI, Sidebar, Topbar, PWABanner
│   ├── pages/             ← Dashboard, Clients, Equipment, Reports, QR
│   └── lib/api.js         ← Cliente HTTP
├── prisma/
│   ├── schema.prisma      ← Modelos BD
│   └── seed.js            ← Datos iniciales
└── INICIAR-*.command/.bat ← Launchers
```

---

## Diferencias vs versión multi-tenant

| Multi-tenant | Single-tenant |
|---|---|
| Modelo `Tenant` en BD | ✗ eliminado |
| `tenantId` en cada query | ✗ eliminado |
| Selector de empresa | ✗ eliminado |
| Plan FREE/PRO/ENTERPRISE | ✗ eliminado |
| Login con roles | ✓ igual |
| Todas las funciones | ✓ igual |

---

MantTrack v1.0 · Single Tenant
