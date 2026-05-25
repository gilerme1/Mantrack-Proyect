import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

const reportSelect = {
  id: true,
  type: true,
  status: true,
  notes: true,
  duration: true,
  checklistJson: true,
  photosJson: true,
  createdAt: true,
  updatedAt: true,
  tech: { select: { name: true } },
  equipment: { select: publicEquipmentSelect() },
  template: {
    select: {
      name: true,
      sections: {
        select: {
          id: true,
          title: true,
          order: true,
          items: {
            select: { id: true, label: true, type: true, required: true, order: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  },
}

function publicEquipmentSelect() {
  return {
    id: true,
    name: true,
    model: true,
    serial: true,
    plate: true,
    location: true,
    status: true,
    lastMaint: true,
    nextMaint: true,
    client: { select: { id: true, name: true } },
    place:  { select: { id: true, name: true, type: true, address: true } },
  }
}

async function latestReportForEquipment(equipmentId) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: publicEquipmentSelect(),
  })
  if (!equipment) return null

  const report = await prisma.report.findFirst({
    where: { equipmentId },
    select: reportSelect,
    orderBy: { createdAt: 'desc' },
  })

  return { equipment, report }
}

router.get('/qr/:id/latest-report', async (req, res) => {
  try {
    const qr = await prisma.openQR.findUnique({
      where: { id: req.params.id },
      select: { id: true, label: true, equipmentId: true, assignedAt: true },
    })
    if (!qr) return res.status(404).json({ error: 'QR no encontrado' })
    if (!qr.equipmentId) {
      return res.json({ qr, equipment: null, report: null })
    }

    const payload = await latestReportForEquipment(qr.equipmentId)
    if (!payload) return res.status(404).json({ error: 'Equipo no encontrado' })
    res.json({ qr, ...payload })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/equipment/:id/latest-report', async (req, res) => {
  try {
    const payload = await latestReportForEquipment(req.params.id)
    if (!payload) return res.status(404).json({ error: 'Equipo no encontrado' })
    res.json({ qr: null, ...payload })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
