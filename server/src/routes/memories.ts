import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import prisma from '../lib/prisma'
import {
  deleteMemoryImageFile,
  getUploadedFiles,
  memoryImagePublicPath,
  memoryImageUpload,
} from '../lib/memoryUploads'
import { zodValidator } from '../middleware/zodValidator'
import { createMemorySchema, updateMemorySchema } from '../schemas/memories'
import { getCoupleForUser } from './couples'

const router = Router()

const visitSelect = {
  id: true,
  start_date: true,
  end_date: true,
  visitingPartner: { select: { id: true, displayName: true } },
} as const

const dateIdeaSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  status: true,
} as const

function serializeImage(image: {
  id: string
  filename: string
  originalName: string | null
  mimeType: string | null
  caption: string | null
  uploadedById: string
  createdAt: Date
}) {
  return {
    id: image.id,
    url: memoryImagePublicPath(image.filename),
    originalName: image.originalName,
    mimeType: image.mimeType,
    caption: image.caption,
    uploadedById: image.uploadedById,
    createdAt: image.createdAt,
  }
}

function serializeMemory(memory: {
  id: string
  coupleId: string
  visitId: string | null
  dateIdeaId: string | null
  title: string | null
  note: string | null
  createdAt: Date
  updatedAt: Date
  visit?: unknown
  dateIdea?: unknown
  images?: Array<{
    id: string
    filename: string
    originalName: string | null
    mimeType: string | null
    caption: string | null
    uploadedById: string
    createdAt: Date
  }>
}) {
  return {
    id: memory.id,
    coupleId: memory.coupleId,
    visitId: memory.visitId,
    dateIdeaId: memory.dateIdeaId,
    title: memory.title,
    note: memory.note,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    visit: memory.visit ?? null,
    dateIdea: memory.dateIdea ?? null,
    images: (memory.images ?? []).map(serializeImage),
  }
}

/** Past visits use end-of-UTC-day semantics to match the client. */
function isPastVisit(endDate: Date) {
  const endOfDay = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
    23,
    59,
    59,
    999,
  )
  return endOfDay < Date.now()
}

router.get('/', async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const memories = await prisma.memory.findMany({
      where: { coupleId: couple.id },
      include: {
        visit: { select: visitSelect },
        dateIdea: { select: dateIdeaSelect },
        images: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return res.status(200).json({
      memories: memories.map(serializeMemory),
      message: 'Memories found successfully',
    })
  } catch {
    return res.status(500).json({ error: 'Failed to get memories' })
  }
})

router.get('/sources', async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const [visits, dateIdeas, memories] = await Promise.all([
      prisma.visit.findMany({
        where: { coupleId: couple.id },
        select: {
          ...visitSelect,
          memory: { select: { id: true } },
        },
        orderBy: { end_date: 'desc' },
      }),
      prisma.dateIdea.findMany({
        where: { coupleId: couple.id, status: 'COMPLETED' },
        select: {
          ...dateIdeaSelect,
          memory: { select: { id: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.memory.findMany({
        where: { coupleId: couple.id },
        select: { id: true, visitId: true, dateIdeaId: true },
      }),
    ])

    const pastVisits = visits
      .filter((visit) => isPastVisit(visit.end_date))
      .map((visit) => ({
        type: 'visit' as const,
        id: visit.id,
        start_date: visit.start_date,
        end_date: visit.end_date,
        visitingPartner: visit.visitingPartner,
        memoryId: visit.memory?.id ?? null,
      }))

    const completedIdeas = dateIdeas.map((idea) => ({
      type: 'dateIdea' as const,
      id: idea.id,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      memoryId: idea.memory?.id ?? null,
    }))

    return res.status(200).json({
      sources: [...pastVisits, ...completedIdeas],
      memoryCount: memories.length,
      message: 'Memory sources found successfully',
    })
  } catch {
    return res.status(500).json({ error: 'Failed to get memory sources' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const memory = await prisma.memory.findFirst({
      where: { id: req.params.id as string, coupleId: couple.id },
      include: {
        visit: { select: visitSelect },
        dateIdea: { select: dateIdeaSelect },
        images: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' })
    }

    return res.status(200).json({
      memory: serializeMemory(memory),
      message: 'Memory found successfully',
    })
  } catch {
    return res.status(500).json({ error: 'Failed to get memory' })
  }
})

router.post('/', zodValidator(createMemorySchema), async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const { visitId, dateIdeaId, title, note } = req.body

    if (visitId) {
      const visit = await prisma.visit.findFirst({
        where: { id: visitId, coupleId: couple.id },
      })
      if (!visit) {
        return res.status(404).json({ error: 'Visit not found' })
      }
      if (!isPastVisit(visit.end_date)) {
        return res.status(400).json({
          error: 'Memories can only be created for past visits',
        })
      }
    }

    if (dateIdeaId) {
      const idea = await prisma.dateIdea.findFirst({
        where: { id: dateIdeaId, coupleId: couple.id },
      })
      if (!idea) {
        return res.status(404).json({ error: 'Date idea not found' })
      }
      if (idea.status !== 'COMPLETED') {
        return res.status(400).json({
          error: 'Memories can only be created for completed date ideas',
        })
      }
    }

    const memory = await prisma.memory.create({
      data: {
        coupleId: couple.id,
        visitId: visitId ?? null,
        dateIdeaId: dateIdeaId ?? null,
        title: title || null,
        note: note || null,
      },
      include: {
        visit: { select: visitSelect },
        dateIdea: { select: dateIdeaSelect },
        images: true,
      },
    })

    return res.status(201).json({
      memory: serializeMemory(memory),
      message: 'Memory created successfully',
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return res.status(409).json({
        error: 'A memory already exists for this visit or date idea',
      })
    }
    return res.status(500).json({ error: 'Failed to create memory' })
  }
})

router.patch('/:id', zodValidator(updateMemorySchema), async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const existing = await prisma.memory.findFirst({
      where: { id: req.params.id as string, coupleId: couple.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Memory not found' })
    }

    const memory = await prisma.memory.update({
      where: { id: existing.id },
      data: {
        ...(req.body.title !== undefined ? { title: req.body.title || null } : {}),
        ...(req.body.note !== undefined ? { note: req.body.note || null } : {}),
      },
      include: {
        visit: { select: visitSelect },
        dateIdea: { select: dateIdeaSelect },
        images: { orderBy: { createdAt: 'asc' } },
      },
    })

    return res.status(200).json({
      memory: serializeMemory(memory),
      message: 'Memory updated successfully',
    })
  } catch {
    return res.status(500).json({ error: 'Failed to update memory' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const existing = await prisma.memory.findFirst({
      where: { id: req.params.id as string, coupleId: couple.id },
      include: { images: true },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Memory not found' })
    }

    await prisma.memory.delete({ where: { id: existing.id } })
    for (const image of existing.images) {
      deleteMemoryImageFile(image.filename)
    }

    return res.status(200).json({ message: 'Memory deleted successfully' })
  } catch {
    return res.status(500).json({ error: 'Failed to delete memory' })
  }
})

function handleUploadError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!err) {
    next()
    return
  }
  if (err instanceof Error) {
    if (err.message.includes('Only JPEG')) {
      return res.status(400).json({ error: err.message })
    }
    if ('code' in err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Each image must be 5MB or smaller' })
    }
    if ('code' in err && err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'You can upload up to 8 images at a time' })
    }
  }
  return res.status(400).json({ error: 'Could not upload images' })
}

router.post(
  '/:id/images',
  (req, res, next) => {
    memoryImageUpload.array('images', 8)(req, res, (err) => handleUploadError(err, req, res, next))
  },
  async (req, res) => {
    try {
      const couple = await getCoupleForUser(req.user!.userID)
      if (!couple) {
        return res.status(404).json({ error: 'Couple not found' })
      }

      const existing = await prisma.memory.findFirst({
        where: { id: req.params.id as string, coupleId: couple.id },
      })
      if (!existing) {
        return res.status(404).json({ error: 'Memory not found' })
      }

      const files = getUploadedFiles(req)
      if (files.length === 0) {
        return res.status(400).json({ error: 'Please choose at least one image' })
      }

      const created = await prisma.$transaction(
        files.map((file) =>
          prisma.memoryImage.create({
            data: {
              memoryId: existing.id,
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              uploadedById: req.user!.userID,
            },
          }),
        ),
      )

      const memory = await prisma.memory.findFirst({
        where: { id: existing.id },
        include: {
          visit: { select: visitSelect },
          dateIdea: { select: dateIdeaSelect },
          images: { orderBy: { createdAt: 'asc' } },
        },
      })

      return res.status(201).json({
        images: created.map(serializeImage),
        memory: memory ? serializeMemory(memory) : null,
        message: 'Images uploaded successfully',
      })
    } catch {
      return res.status(500).json({ error: 'Failed to upload images' })
    }
  },
)

router.delete('/:id/images/:imageId', async (req, res) => {
  try {
    const couple = await getCoupleForUser(req.user!.userID)
    if (!couple) {
      return res.status(404).json({ error: 'Couple not found' })
    }

    const memory = await prisma.memory.findFirst({
      where: { id: req.params.id as string, coupleId: couple.id },
    })
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' })
    }

    const image = await prisma.memoryImage.findFirst({
      where: {
        id: req.params.imageId as string,
        memoryId: memory.id,
      },
    })
    if (!image) {
      return res.status(404).json({ error: 'Image not found' })
    }

    await prisma.memoryImage.delete({ where: { id: image.id } })
    deleteMemoryImageFile(image.filename)

    return res.status(200).json({ message: 'Image deleted successfully' })
  } catch {
    return res.status(500).json({ error: 'Failed to delete image' })
  }
})

export default router
