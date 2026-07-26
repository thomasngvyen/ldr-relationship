import fs from 'fs'
import path from 'path'
import multer from 'multer'
import type { Request } from 'express'

export const MEMORY_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'memories')

fs.mkdirSync(MEMORY_UPLOAD_DIR, { recursive: true })

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, MEMORY_UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg'
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`)
  },
})

export const memoryImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
      return
    }
    cb(null, true)
  },
})

export function memoryImagePublicPath(filename: string) {
  return `/uploads/memories/${filename}`
}

export function memoryImageAbsolutePath(filename: string) {
  return path.join(MEMORY_UPLOAD_DIR, filename)
}

export function deleteMemoryImageFile(filename: string) {
  const filePath = memoryImageAbsolutePath(filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

/** Multer may attach `files` as an array for `.array()`. */
export function getUploadedFiles(req: Request) {
  const files = req.files
  if (!files) return []
  if (Array.isArray(files)) return files
  return Object.values(files).flat()
}
