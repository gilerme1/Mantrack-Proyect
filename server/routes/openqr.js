// server/routes/openqr.js
// Open (unassigned) QR codes — generated in batch, assigned in the field.
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

// List all open QR codes
router.get('/', async (req, res) => {
  try {
    const qrs = await prisma.openQR.findMany({
      include: {
        equipment: {
          select: {
            id: true, name: true, serial: true, plate: true, status: true,
            client: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(qrs)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Get single QR (used when scanned — checked before showing assign or detail)
router.get('/:id', async (req, res) => {
  try {
    const qr = await prisma.openQR.findUnique({
      where: { id: req.params.id },
      include: {
        equipment: {
          include: {
            client: true,
            _count: { select: { reports: true } },
          },
        },
      },
    })
    if (!qr) return res.status(404).json({ error: 'QR no encontrado' })
    res.json(qr)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Generate N blank QR codes
router.post('/generate', async (req, res) => {
  try {
    const { count = 1, label } = req.body
    const qty = Math.min(Math.max(parseInt(count) || 1, 1), 100)
    const created = await prisma.$transaction(
      Array.from({ length: qty }, () =>
        prisma.openQR.create({ data: { label: label || null } })
      )
    )
    res.status(201).json(created)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Generate or return the QR assigned to a specific equipment
router.post('/for-equipment', async (req, res) => {
  try {
    const { equipmentId } = req.body
    if (!equipmentId) return res.status(400).json({ error: 'equipmentId requerido' })
    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId }, select: { id: true, name: true } })
    if (!equipment) return res.status(404).json({ error: 'Equipo no encontrado' })

    const existing = await prisma.openQR.findUnique({
      where: { equipmentId },
      include: {
        equipment: {
          include: {
            client: { select: { id: true, name: true } },
            place:  { select: { id: true, name: true, type: true, address: true } },
          },
        },
      },
    })
    if (existing) return res.json(existing)

    const qr = await prisma.openQR.create({
      data: { equipmentId, assignedAt: new Date(), label: equipment.name },
      include: {
        equipment: {
          include: {
            client: { select: { id: true, name: true } },
            place:  { select: { id: true, name: true, type: true, address: true } },
          },
        },
      },
    })
    res.status(201).json(qr)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Assign a QR to an existing equipment
router.put('/:id/assign-existing', async (req, res) => {
  try {
    const { equipmentId } = req.body
    if (!equipmentId) return res.status(400).json({ error: 'equipmentId requerido' })

    // Check equipment exists and isn't already linked to another QR
    const existing = await prisma.openQR.findFirst({ where: { equipmentId } })
    if (existing && existing.id !== req.params.id) {
      return res.status(409).json({ error: 'Ese equipo ya tiene un QR asignado' })
    }

    const qr = await prisma.openQR.update({
      where: { id: req.params.id },
      data:  { equipmentId, assignedAt: new Date() },
      include: {
        equipment: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    })
    res.json(qr)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Assign a QR and create a new equipment at the same time
router.post('/:id/assign-new', async (req, res) => {
  try {
    const { name, clientId, model, serial, plate, location, locationId, status } = req.body
    if (!name?.trim() || !clientId) {
      return res.status(400).json({ error: 'Nombre y cliente requeridos' })
    }
    if (locationId) {
      const place = await prisma.clientLocation.findFirst({ where: { id: locationId, clientId }, select: { id: true } })
      if (!place) return res.status(400).json({ error: 'El lugar no pertenece al cliente seleccionado' })
    }

    const [equip, qr] = await prisma.$transaction([
      prisma.equipment.create({
        data: { name: name.trim(), model, serial, plate, location, locationId: locationId || null, status: status || 'ACTIVE', clientId },
        include: {
          client: { select: { id: true, name: true } },
          place:  { select: { id: true, name: true, type: true, address: true } },
        },
      }),
      prisma.openQR.update({
        where: { id: req.params.id },
        data:  { assignedAt: new Date() }, // equipmentId set below via connect
      }),
    ])

    // Link QR → equipment
    const updated = await prisma.openQR.update({
      where: { id: req.params.id },
      data:  { equipmentId: equip.id },
      include: {
        equipment: {
          include: {
            client: { select: { id: true, name: true } },
            place:  { select: { id: true, name: true, type: true, address: true } },
          },
        },
      },
    })
    res.status(201).json(updated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Unassign a QR (detach from equipment without deleting the QR)
router.put('/:id/unassign', async (req, res) => {
  try {
    const qr = await prisma.openQR.update({
      where: { id: req.params.id },
      data:  { equipmentId: null, assignedAt: null },
    })
    res.json(qr)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Delete QR codes (only unassigned ones)
router.delete('/:id', async (req, res) => {
  try {
    const qr = await prisma.openQR.findUnique({ where: { id: req.params.id } })
    if (!qr) return res.status(404).json({ error: 'QR no encontrado' })
    if (qr.equipmentId) return res.status(409).json({ error: 'No se puede eliminar un QR ya asignado' })
    await prisma.openQR.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
