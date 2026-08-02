import 'dotenv/config'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Mood } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

const AUTHOR_EMAIL = 'you@test.com'
const PARTNER_EMAIL = 'partner@test.com'
const SEED_PASSWORD = 'password123'


/**
 * @param {string} userId
 * @param {string} coupleId
 */

async function main() {
  console.log('Starting seed...')

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)

  const author = await prisma.user.upsert({
    where: { email: AUTHOR_EMAIL },
    update: { displayName: 'Thomas', passwordHash },
    create: {
      email: AUTHOR_EMAIL,
      displayName: 'Thomas',
      passwordHash,
    },
  })

  const partner = await prisma.user.upsert({
    where: { email: PARTNER_EMAIL },
    update: { displayName: 'Partner', passwordHash },
    create: {
      email: PARTNER_EMAIL,
      displayName: 'Partner',
      passwordHash,
    },
  })

  const couple = await prisma.couple.upsert({
    where: { userAId: author.id },
    update: { userBId: partner.id },
    create: {
      userAId: author.id,
      userBId: partner.id,
      inviteCode: crypto.randomUUID(),
    },
  })


  console.log('Seed completed successfully')
  console.log(`  Test author:  ${AUTHOR_EMAIL} / ${SEED_PASSWORD}`)
  console.log(`  Test partner: ${PARTNER_EMAIL} / ${SEED_PASSWORD}`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
