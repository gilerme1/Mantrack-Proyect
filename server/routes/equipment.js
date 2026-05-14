// server/routes/equipment.js
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { status, clientId, locationId, search } = req.query
    let assignedFilter = {}
    if (req.user.role === 'TECH') {
      const assignments = await prisma.equipmentAssignment.findMany({
        where: { userId: req.user.userId },
        select: { equipmentId: true },
      })
      if (assignments.length > 0) {
        assignedFilter = { id: { in: assignments.map(a => a.equipmentId) } }
      }
    }
    const equipment = await prisma.equipment.findMany({
      where: {
        ...assignedFilter,
        ...(status     ? { status }     : {}),
        ...(clientId   ? { clientId }   : {}),
        ...(locationId ? { locationId } : {}),
        ...(search     ? { OR: [
          { name:   { contains: search } },
          { model:  { contains: search } },
          { serial: { contains: search } },
          { plate:  { contains: search } },
          { location: { contains: search } },
          { place: { name: { contains: search } } },
        ]} : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        place:  { select: { id: true, name: true, type: true, address: true } },
        openQR: { select: { id: true, assignedAt: true, label: true } },
        _count:  { select: { reports: true } },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    })
    res.json(equipment)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const equip = await prisma.equipment.findUnique({
      where:   { id: req.params.id },
      include: {
        client:  true,
        place:   true,
        openQR:  true,
        reports: {
          include:  { tech: { select: { id: true, name: true } } },
          orderBy:  { createdAt: 'desc' },
          take:     20,
        },
      },
    })
    if (!equip) return res.status(404).json({ error: 'Equipo no encontrado' })
    res.json(equip)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, model, serial, plate, location, locationId, status, clientId, nextMaint } = req.body
    if (!name?.trim() || !clientId) return res.status(400).json({ error: 'Nombre y cliente requeridos' })
    if (locationId) {
      const place = await prisma.clientLocation.findFirst({ where: { id: locationId, clientId }, select: { id: true } })
      if (!place) return res.status(400).json({ error: 'El lugar no pertenece al cliente seleccionado' })
    }
    const equip = await prisma.equipment.create({
      data:    { name: name.trim(), model, serial, plate, location, locationId: locationId || null, status: status || 'ACTIVE', clientId, nextMaint: nextMaint ? new Date(nextMaint) : null },
      include: {
        client: { select: { id: true, name: true } },
        place:  { select: { id: true, name: true, type: true, address: true } },
        openQR: { select: { id: true, assignedAt: true, label: true } },
      },
    })
    res.status(201).json(equip)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, model, serial, plate, location, locationId, status, nextMaint, lastMaint } = req.body
    if (locationId !== undefined && locationId) {
      const equip = await prisma.equipment.findUnique({ where: { id: req.params.id }, select: { clientId: true } })
      if (!equip) return res.status(404).json({ error: 'Equipo no encontrado' })
      const place = await prisma.clientLocation.findFirst({ where: { id: locationId, clientId: equip.clientId }, select: { id: true } })
      if (!place) return res.status(400).json({ error: 'El lugar no pertenece al cliente del equipo' })
    }
    const updated = await prisma.equipment.update({
      where: { id: req.params.id },
      data:  {
        ...(name      ? { name: name.trim() } : {}),
        ...(model     !== undefined ? { model }     : {}),
        ...(serial    !== undefined ? { serial }    : {}),
        ...(plate     !== undefined ? { plate }     : {}),
        ...(location  !== undefined ? { location }  : {}),
        ...(locationId !== undefined ? { locationId: locationId || null } : {}),
        ...(status    ? { status }  : {}),
        ...(nextMaint !== undefined ? { nextMaint: nextMaint ? new Date(nextMaint) : null } : {}),
        ...(lastMaint !== undefined ? { lastMaint: lastMaint ? new Date(lastMaint) : null } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        place:  { select: { id: true, name: true, type: true, address: true } },
        openQR: { select: { id: true, assignedAt: true, label: true } },
      },
    })
    res.json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.equipment.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
