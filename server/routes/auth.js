// server/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../index.js'
import { signToken, authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' })

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Credenciales incorrectas' })

    const token = signToken({ userId: user.id, role: user.role })

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        assignments: { select: { equipmentId: true } },
      },
    })
    res.json({ ...user, assignedEquipmentIds: user.assignments.map(a => a.equipmentId) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/users
router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        assignments: { include: { equipment: { select: { id: true, name: true, client: { select: { name: true } } } } } },
      },
      orderBy: { name: 'asc' },
    })
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      assignedEquipment: u.assignments.map(a => a.equipment),
      assignedEquipmentIds: u.assignments.map(a => a.equipmentId),
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/users', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, email, password, role = 'TECH', equipmentIds = [] } = req.body
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' })
    }
    if (!['ADMIN', 'MANAGER', 'TECH'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        password: await bcrypt.hash(password, 10),
        assignments: {
          create: [...new Set(equipmentIds)].map(equipmentId => ({ equipmentId })),
        },
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err) {
    res.status(500).json({ error: err.code === 'P2002' ? 'Ese email ya existe' : err.message })
  }
})

router.put('/users/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, email, password, role, equipmentIds } = req.body
    if (role && !['ADMIN', 'MANAGER', 'TECH'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }

    const user = await prisma.$transaction(async tx => {
      if (Array.isArray(equipmentIds)) {
        await tx.equipmentAssignment.deleteMany({ where: { userId: req.params.id } })
        if (equipmentIds.length > 0) {
          await tx.equipmentAssignment.createMany({
            data: [...new Set(equipmentIds)].map(equipmentId => ({ userId: req.params.id, equipmentId })),
            skipDuplicates: true,
          })
        }
      }

      return tx.user.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(email !== undefined ? { email: email.toLowerCase().trim() } : {}),
          ...(role ? { role } : {}),
          ...(password?.trim() ? { password: await bcrypt.hash(password, 10) } : {}),
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      })
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.code === 'P2002' ? 'Ese email ya existe' : err.message })
  }
})

router.delete('/users/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
