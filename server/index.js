// server/index.js
import express   from 'express'
import cors      from 'cors'
import helmet    from 'helmet'
import morgan    from 'morgan'
import path      from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import authRouter      from './routes/auth.js'
import clientsRouter   from './routes/clients.js'
import equipmentRouter from './routes/equipment.js'
import reportsRouter   from './routes/reports.js'
import statsRouter     from './routes/stats.js'
import templatesRouter from './routes/templates.js'
import openQRRouter    from './routes/openqr.js'
import geocodeRouter   from './routes/geocode.js'
import searchRouter    from './routes/search.js'
import publicRouter    from './routes/public.js'
import { authenticate } from './middleware/auth.js'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

const app  = express()
const PORT = process.env.PORT || process.env.API_PORT || 3001
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '..', 'dist')
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
const localFrontendOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin) || localFrontendOrigin.test(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '15mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use('/api/auth',      authRouter)
app.use('/api/public',    publicRouter)
app.use('/api/clients',   authenticate, clientsRouter)
app.use('/api/equipment', authenticate, equipmentRouter)
app.use('/api/reports',   authenticate, reportsRouter)
app.use('/api/stats',     authenticate, statsRouter)
app.use('/api/templates', authenticate, templatesRouter)
app.use('/api/openqr',    authenticate, openQRRouter)
app.use('/api/geocode',   authenticate, geocodeRouter)
app.use('/api/search',    authenticate, searchRouter)

if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err)
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno' : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`\n  🚀 MantTrack API → http://localhost:${PORT}`)
  console.log(`  📊 Health       → http://localhost:${PORT}/api/health\n`)
})

export default app
