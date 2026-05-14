// Reset a local user's password without needing to log in.
// Usage: npm run password:reset -- usuario@empresa.com nuevaClave
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'

const prisma = new PrismaClient()

function printUsage() {
  console.log('')
  console.log('Uso:')
  console.log('  npm run password:reset -- email@empresa.com nuevaClave')
  console.log('')
  console.log('Si omites la nueva clave, se genera una temporal segura:')
  console.log('  npm run password:reset -- email@empresa.com')
  console.log('')
}

async function main() {
  const [emailInput, passwordInput] = process.argv.slice(2)
  const email = emailInput?.trim().toLowerCase()

  if (!email) {
    printUsage()
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true },
      orderBy: { email: 'asc' },
    })

    if (users.length) {
      console.log('Usuarios disponibles:')
      for (const user of users) {
        console.log(`  - ${user.email} (${user.name}, ${user.role})`)
      }
      console.log('')
    }
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    console.error(`No existe un usuario con email: ${email}`)
    process.exit(1)
  }

  const password = passwordInput || randomBytes(9).toString('base64url')
  if (password.length < 8) {
    console.error('La nueva clave debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 10) },
  })

  console.log('')
  console.log(`Clave actualizada para ${user.name} <${user.email}>`)
  console.log(`Nueva clave: ${password}`)
  console.log('')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
