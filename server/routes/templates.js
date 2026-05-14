// server/routes/templates.js
import { Router } from 'express'
import { prisma } from '../index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { industry, reportType } = req.query
    const where = {
      ...(industry   ? { industry }   : {}),
      ...(reportType ? { reportType } : {}),
    }
    const templates = await prisma.template.findMany({
      where,
      include: { sections: { include: { items: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })
    res.json(templates)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.get('/:id', async (req, res) => {
  try {
    const template = await prisma.template.findUnique({
      where:   { id: req.params.id },
      include: { sections: { include: { items: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    })
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' })
    res.json(template)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { name, industry, equipmentType, reportType, sections } = req.body
    if (!name) return res.status(400).json({ error: 'Nombre requerido' })
    const template = await prisma.template.create({
      data: {
        name, industry: industry || 'GENERAL',
        equipmentType: equipmentType || null,
        reportType: reportType || 'MAINTENANCE',
        isSystem: false,
        sections: sections ? {
          create: sections.map((sec, si) => ({
            title: sec.title, order: si,
            items: { create: (sec.items || []).map((item, ii) => ({
              label: item.label, type: item.type || 'CHECK',
              required: item.required || false, order: ii,
            })) },
          })),
        } : undefined,
      },
      include: { sections: { include: { items: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    })
    res.status(201).json(template)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.template.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Plantilla no encontrada' })

    const { name, industry, equipmentType, reportType, sections } = req.body

    // Delete existing sections (cascade deletes items) then recreate
    if (sections) {
      await prisma.templateSection.deleteMany({ where: { templateId: req.params.id } })
    }

    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name          ? { name }          : {}),
        ...(industry      ? { industry }      : {}),
        ...(reportType    ? { reportType }    : {}),
        equipmentType: equipmentType !== undefined ? (equipmentType || null) : undefined,
        ...(sections ? {
          sections: {
            create: sections.map((sec, si) => ({
              title: sec.title, order: si,
              items: { create: (sec.items || []).map((item, ii) => ({
                label: item.label, type: item.type || 'CHECK',
                required: item.required || false, order: ii,
              })) },
            })),
          },
        } : {}),
      },
      include: { sections: { include: { items: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    })
    res.json(template)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.template.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Plantilla no encontrada' })
    if (existing.isSystem) return res.status(403).json({ error: 'Las plantillas del sistema no se pueden eliminar' })
    await prisma.template.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router
