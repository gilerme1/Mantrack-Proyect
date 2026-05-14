// server/routes/reports.js
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { status, type, equipmentId, search, dateFrom, dateTo, limit = '50', offset = '0' } = req.query
    const parseDateStart = (value) => {
      const [y, m, d] = String(value || '').split('-').map(Number)
      return y && m && d ? new Date(y, m - 1, d) : null
    }
    const parseDateEndExclusive = (value) => {
      const [y, m, d] = String(value || '').split('-').map(Number)
      return y && m && d ? new Date(y, m - 1, d + 1) : null
    }
    const from = parseDateStart(dateFrom)
    const toExclusive = parseDateEndExclusive(dateTo)
    let assignedEquipmentIds = null
    if (req.user.role === 'TECH') {
      const assignments = await prisma.equipmentAssignment.findMany({
        where: { userId: req.user.userId },
        select: { equipmentId: true },
      })
      if (assignments.length > 0) assignedEquipmentIds = assignments.map(a => a.equipmentId)
    }
    const where = {
      ...(assignedEquipmentIds ? { equipmentId: { in: assignedEquipmentIds } } : {}),
      ...(status      ? { status }      : {}),
      ...(type        ? { type }        : {}),
      ...(equipmentId ? { equipmentId: assignedEquipmentIds ? { in: assignedEquipmentIds.filter(id => id === equipmentId) } : equipmentId } : {}),
      ...((from || toExclusive) ? { createdAt: { ...(from ? { gte: from } : {}), ...(toExclusive ? { lt: toExclusive } : {}) } } : {}),
      ...(search ? { OR: [
        { equipment: { name: { contains: search } } },
        { tech:      { name: { contains: search } } },
      ]} : {}),
    }
    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        include: {
          tech:      { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take:    parseInt(limit),
        skip:    parseInt(offset),
      }),
    ])
    res.json({ total, reports })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where:   { id: req.params.id },
      include: {
        tech:      { select: { id: true, name: true, email: true } },
        equipment: { include: { client: true } },
        template:  { include: { sections: { include: { items: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } } },
      },
    })
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' })
    res.json(report)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { equipmentId, type, status, notes, duration, templateId, checklistJson, photosJson } = req.body
    if (!equipmentId || !type) return res.status(400).json({ error: 'Equipo y tipo requeridos' })

    if (req.user.role === 'TECH') {
      const assignments = await prisma.equipmentAssignment.findMany({
        where: { userId: req.user.userId },
        select: { equipmentId: true },
      })
      if (assignments.length > 0 && !assignments.some(a => a.equipmentId === equipmentId)) {
        return res.status(403).json({ error: 'Este equipo no está asignado a tu usuario' })
      }
    }

    const [report] = await prisma.$transaction([
      prisma.report.create({
        data: {
          type, status: status || 'COMPLETED', notes,
          duration: duration ? parseInt(duration) : null,
          equipmentId, techId: req.user.userId,
          templateId: templateId || null,
          checklistJson: checklistJson || null,
          photosJson: photosJson || null,
        },
        include: {
          tech:      { select: { id: true, name: true } },
          equipment: { select: { id: true, name: true } },
          template:  { select: { id: true, name: true } },
        },
      }),
      prisma.equipment.update({
        where: { id: equipmentId },
        data:  { lastMaint: new Date(), ...(status === 'COMPLETED' ? { status: 'ACTIVE' } : {}) },
      }),
    ])
    res.status(201).json(report)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { equipmentId, techId, type, status, notes, duration, templateId, checklistJson, photosJson } = req.body
    if (equipmentId && req.user.role === 'TECH') {
      const assignments = await prisma.equipmentAssignment.findMany({
        where: { userId: req.user.userId },
        select: { equipmentId: true },
      })
      if (assignments.length > 0 && !assignments.some(a => a.equipmentId === equipmentId)) {
        return res.status(403).json({ error: 'Este equipo no está asignado a tu usuario' })
      }
    }
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data:  {
        ...(equipmentId ? { equipmentId } : {}),
        ...(techId ? { techId } : {}),
        ...(type     ? { type }   : {}),
        ...(status   ? { status } : {}),
        ...(notes    !== undefined ? { notes }    : {}),
        ...(duration !== undefined ? { duration: duration ? parseInt(duration) : null } : {}),
        ...(templateId   !== undefined ? { templateId: templateId || null }       : {}),
        ...(checklistJson !== undefined ? { checklistJson: checklistJson || null } : {}),
        ...(photosJson    !== undefined ? { photosJson: photosJson || null }       : {}),
      },
      include: {
        tech:      { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true } },
        template:  { select: { id: true, name: true } },
      },
    })
    res.json(report)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
