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

/** 3–5 starter messages per mood */
const STARTER_MESSAGES: Record<Mood, string[]> = {
  HAPPY: [
    'Your smile lights up my entire world. I love seeing you this happy!',
    "I'm so proud of you. Let's celebrate this feeling together.",
    'Your joy is contagious. Being around you like this is the best.',
    'You deserve every bit of this happiness. Sending you an extra squeeze.',
  ],
  SAD: [
    "I'm right here with you. It's okay not to be okay.",
    "Biggest hug. We'll get through this together.",
    "I wish I could take the hurt away. Until then, I'm holding your hand.",
    "Take the time you need. I'm just a call away.",
  ],
  ANGRY: [
    "It's valid to feel upset. I'm here whenever you want to vent.",
    "I'm on your team, always. Breathe — we'll tackle this when you're ready.",
    "If you need space, take it. I'll be right here waiting.",
    'That sounds unfair. Want to talk it out?',
  ],
  EXCITED: [
    'Your energy is contagious! I cannot wait to see what happens next.',
    "Yes! You deserve this. I'm cheering you on every step.",
    'Tell me every detail — I want to hear it all.',
    'Your passion is one of my favorite things about you. Go crush it!',
  ],
  CONFUSED: [
    'We can figure this out together. Two brains are better than one.',
    "It's okay if things don't make sense yet. Clarity will come.",
    "Whatever you decide, I'm backing you either way.",
    "Let's take a step back and look at the big picture together.",
  ],
  BORED: [
    'Want a spontaneous adventure, or should we be bored together?',
    "Sending a little reminder that I'm thinking of you right now.",
    "Let's brainstorm something fun — or order food and do nothing.",
    "If you're watching the clock, I'm counting down until I see you.",
  ],
  TIRED: [
    "You've been working so hard. Rest — you've earned it.",
    'Go get some sleep, my love. Everything else can wait.',
    'Unplug for the night. The world will still be there tomorrow.',
    "You can't pour from an empty cup. Take tonight to recharge.",
  ],
  SICK: [
    'Please rest up. Can I bring you soup or medicine?',
    'Hate seeing you under the weather. Sending all my love.',
    "Don't worry about a thing today except getting better.",
    'Drink water, stay warm, and tell me if you need anything.',
  ],
  STRESSED: [
    'Close your eyes and take a deep breath. You are doing great.',
    "Don't carry it all alone. Let me help lighten the load.",
    'One thing at a time. You can handle this — and not alone.',
    "No matter how chaotic it gets, I'm your safe place to land.",
  ],
  RELAXED: [
    'Seeing you peaceful brings me so much joy. Enjoy this quiet.',
    'This is the peace you deserve. Stay here a little longer.',
    'Nothing better than soaking in the quiet with you.',
    "No rush, no worries — just us. Let's make it last.",
  ],
  HORNY: [
    "I've been thinking about you all day. I miss being close to you.",
    "Can't wait until it's just us again. You're on my mind.",
    'Missing your touch more than I can say.',
  ],
  SLEEPY: [
    'Put the screens away and get comfortable. Sweet dreams — I love you.',
    'Rest well tonight. Dream of wonderful things.',
    "Close your eyes and let today go. I'll be here in the morning.",
    'Sleep tight. Sending you a gentle goodnight kiss.',
  ],
}

/**
 * @param {string} userId
 */
function buildRowsForUser(userId: string) {
  return (Object.entries(STARTER_MESSAGES) as [Mood, string[]][]).flatMap(
    ([mood, messages]) =>
      messages.map((message) => ({
        mood,
        message,
        userId,
      })),
  )
}

async function seedLibraryForUser(userId: string, label: string) {
  await prisma.moodMessage.deleteMany({ where: { userId } })
  const rows = buildRowsForUser(userId)
  await prisma.moodMessage.createMany({ data: rows })
  console.log(`  Seeded ${rows.length} messages for ${label} (${userId})`)
}

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

  await prisma.couple.upsert({
    where: { userAId: author.id },
    update: { userBId: partner.id },
    create: {
      userAId: author.id,
      userBId: partner.id,
      inviteCode: crypto.randomUUID(),
    },
  })

  // Seed every fully paired couple so real accounts get messages too
  const pairedCouples = await prisma.couple.findMany({
    where: { userBId: { not: null } },
    include: {
      userA: { select: { id: true, email: true } },
    },
  })

  const seededAuthors = new Set<string>()

  for (const couple of pairedCouples) {
    if (seededAuthors.has(couple.userAId)) continue
    seededAuthors.add(couple.userAId)
    await seedLibraryForUser(couple.userAId, couple.userA.email)
  }

  console.log('Seed completed successfully')
  console.log(`  Test author:  ${AUTHOR_EMAIL} / ${SEED_PASSWORD}`)
  console.log(`  Test partner: ${PARTNER_EMAIL} / ${SEED_PASSWORD}`)
  console.log(`  Couples seeded: ${seededAuthors.size}`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
