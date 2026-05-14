import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (q.length < 2) return res.json({ results: [] })

    const [clients, equipment, reports] = await Promise.all([
      prisma.client.findMany({
        where: { OR: [
          { name:    { contains: q } },
          { sector:  { contains: q } },
          { address: { contains: q } },
        ] },
        select: { id: true, name: true, sector: true, address: true },
        orderBy: { name: 'asc' },
        take: 5,
      }),
      prisma.equipment.findMany({
        where: { OR: [
          { name:     { contains: q } },
          { model:    { contains: q } },
          { serial:   { contains: q } },
          { plate:    { contains: q } },
          { location: { contains: q } },
          { place:    { name: { contains: q } } },
          { place:    { address: { contains: q } } },
          { client:   { name: { contains: q } } },
        ] },
        select: {
          id: true, name: true, model: true, serial: true, plate: true, status: true,
          client: { select: { name: true } },
          place:  { select: { name: true } },
        },
        orderBy: { name: 'asc' },
        take: 6,
      }),
      prisma.report.findMany({
        where: { OR: [
          { type:      { contains: q } },
          { notes:     { contains: q } },
          { equipment: { name: { contains: q } } },
          { equipment: { client: { name: { contains: q } } } },
          { tech:      { name: { contains: q } } },
        ] },
        select: {
          id: true, type: true, status: true, createdAt: true,
          tech: { select: { name: true } },
          equipment: { select: { name: true, client: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ])

    res.json({
      results: [
        ...clients.map(c => ({
          type: 'client',
          id: c.id,
          title: c.name,
          subtitle: [c.sector, c.address].filter(Boolean).join(' · '),
        })),
        ...equipment.map(e => ({
          type: 'equipment',
          id: e.id,
          title: e.name,
          subtitle: [e.client?.name, e.place?.name, e.model, e.plate && `Matr. ${e.plate}`, e.serial && `#${e.serial}`].filter(Boolean).join(' · '),
          status: e.status,
        })),
        ...reports.map(r => ({
          type: 'report',
          id: r.id,
          title: r.equipment?.name || 'Reporte',
          subtitle: [r.equipment?.client?.name, r.tech?.name, r.type].filter(Boolean).join(' · '),
          status: r.status,
          date: r.createdAt,
        })),
      ].slice(0, 12),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
