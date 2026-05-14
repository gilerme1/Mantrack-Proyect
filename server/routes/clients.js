// server/routes/clients.js
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

const parseCoord = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const cleanLocationPayload = (body) => ({
  name:    body.name?.trim(),
  type:    body.type || null,
  address: body.address || null,
  notes:   body.notes || null,
  lat:     parseCoord(body.lat),
  lng:     parseCoord(body.lng),
})

router.get('/', async (req, res) => {
  try {
    const { search } = req.query
    const clients = await prisma.client.findMany({
      where: search ? { OR: [
        { name:   { contains: search } },
        { sector: { contains: search } },
      ]} : undefined,
      include: {
        _count:    { select: { equipment: true } },
        locations: { select: { id: true, name: true, type: true, address: true, lat: true, lng: true } },
        equipment: { select: { status: true } },
      },
      orderBy: { name: 'asc' },
    })
    res.json(clients.map(c => ({
      id:        c.id,
      name:      c.name,
      sector:    c.sector,
      address:   c.address,
      contact:   c.contact,
      phone:     c.phone,
      lat:       c.lat,
      lng:       c.lng,
      createdAt: c.createdAt,
      equipment: c._count.equipment,
      locations: c.locations,
      locationCount: c.locations.length,
      active:    c.equipment.filter(e => e.status === 'ACTIVE').length,
      overdue:   c.equipment.filter(e => e.status === 'OVERDUE').length,
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        locations: {
          include: { _count: { select: { equipment: true } } },
          orderBy: [{ name: 'asc' }],
        },
        equipment: {
          include: { place: { select: { id: true, name: true, type: true, address: true } } },
          orderBy: { name: 'asc' },
        },
      },
    })
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json(client)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, sector, address, contact, phone, lat, lng } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' })
    const client = await prisma.client.create({ data: { name: name.trim(), sector, address, contact, phone, lat: parseCoord(lat), lng: parseCoord(lng) } })
    res.status(201).json(client)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, sector, address, contact, phone, lat, lng } = req.body
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data:  { name, sector, address, contact, phone, lat: parseCoord(lat), lng: parseCoord(lng) },
    })
    res.json(client)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/:id/locations', async (req, res) => {
  try {
    const data = cleanLocationPayload(req.body)
    if (!data.name) return res.status(400).json({ error: 'Nombre del lugar requerido' })
    const client = await prisma.client.findUnique({ where: { id: req.params.id }, select: { id: true } })
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
    const location = await prisma.clientLocation.create({
      data: { ...data, clientId: req.params.id },
      include: { _count: { select: { equipment: true } } },
    })
    res.status(201).json(location)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:clientId/locations/:locationId', async (req, res) => {
  try {
    const data = cleanLocationPayload(req.body)
    if (!data.name) return res.status(400).json({ error: 'Nombre del lugar requerido' })
    const existing = await prisma.clientLocation.findFirst({
      where: { id: req.params.locationId, clientId: req.params.clientId },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ error: 'Lugar no encontrado' })
    const location = await prisma.clientLocation.update({
      where: { id: req.params.locationId },
      data,
      include: { _count: { select: { equipment: true } } },
    })
    res.json(location)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:clientId/locations/:locationId', async (req, res) => {
  try {
    const existing = await prisma.clientLocation.findFirst({
      where: { id: req.params.locationId, clientId: req.params.clientId },
      select: { id: true },
    })
    if (!existing) return res.status(404).json({ error: 'Lugar no encontrado' })
    await prisma.clientLocation.delete({ where: { id: req.params.locationId } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
