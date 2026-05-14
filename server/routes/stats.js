// server/routes/stats.js
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const toDateInput = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    const [
      totalClients,
      equipment,
      reportsThisMonth,
      reportsPrevMonth,
      pendingReports,
      recentReports,
      upcomingEquip,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.equipment.findMany({ select: { id: true, status: true } }),
      prisma.report.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.report.count({ where: { createdAt: { gte: prevStart, lt: monthStart } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.findMany({
        include: {
          tech:      { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true, client: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.equipment.findMany({
        where:   { nextMaint: { not: null }, status: { in: ['ACTIVE', 'SCHEDULED'] } },
        include: { client: { select: { name: true } } },
        orderBy: { nextMaint: 'asc' },
        take: 5,
      }),
    ])

    // Serie mensual (6 meses)
    const monthly = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const next  = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const end   = new Date(next.getFullYear(), next.getMonth(), 0)
      const count = await prisma.report.count({ where: { createdAt: { gte: start, lt: next } } })
      monthly.push({
        label: start.toLocaleDateString('es-CL', { month: 'short' }),
        value: count,
        current: i === 0,
        dateFrom: toDateInput(start),
        dateTo: toDateInput(end),
      })
    }

    // Top clientes por equipos
    const topClients = await prisma.client.findMany({
      include: {
        equipment: { select: { status: true } },
        _count:    { select: { equipment: true } },
      },
      orderBy: { equipment: { _count: 'desc' } },
      take: 5,
    })

    const growthPct = reportsPrevMonth > 0
      ? Math.round(((reportsThisMonth - reportsPrevMonth) / reportsPrevMonth) * 100)
      : null

    res.json({
      kpis: {
        clients:          totalClients,
        totalEquipment:   equipment.length,
        activeEquipment:  equipment.filter(e => e.status === 'ACTIVE').length,
        overdueEquipment: equipment.filter(e => e.status === 'OVERDUE').length,
        reportsThisMonth,
        pendingReports,
        growthPct,
      },
      equipmentByStatus: {
        active:    equipment.filter(e => e.status === 'ACTIVE').length,
        overdue:   equipment.filter(e => e.status === 'OVERDUE').length,
        scheduled: equipment.filter(e => e.status === 'SCHEDULED').length,
        inactive:  equipment.filter(e => e.status === 'INACTIVE').length,
      },
      monthly,
      recentReports,
      upcomingEquip,
      topClients: topClients.map(c => ({
        id:      c.id,
        name:    c.name,
        sector:  c.sector,
        total:   c._count.equipment,
        active:  c.equipment.filter(e => e.status === 'ACTIVE').length,
        overdue: c.equipment.filter(e => e.status === 'OVERDUE').length,
      })),
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
