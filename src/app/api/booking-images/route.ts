export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import prisma from '@/lib/prisma'
import { getCachedSession } from '@/lib/auth'

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? process.env.UPLOAD_DIR
  : join(process.cwd(), 'public', 'uploads')

const PUBLIC_SITE_URL = process.env.NEXTAUTH_URL + '/uploads/'

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

function getExtension(file: File, originalName: string) {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }
  const fromMime = mimeMap[file.type]
  if (fromMime) return fromMime

  const sourceName = originalName.trim() && originalName.toLowerCase() !== 'blob' ? originalName : file.name
  const fromName = sourceName.includes('.') ? sourceName.split('.').pop() : ''
  return fromName?.toLowerCase() || ''
}

async function saveFile(file: File, originalName: string) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = getExtension(file, originalName)
  const filename = `${randomUUID()}${ext ? `.${ext.toLowerCase()}` : ''}`
  await ensureUploadDir()
  await writeFile(join(UPLOAD_DIR, filename), buffer)
  return { key: filename, url: `${PUBLIC_SITE_URL}${filename}`, name: originalName && originalName.toLowerCase() !== 'blob' ? originalName : file.name }
}

export async function POST(request: Request) {
  const session = await getCachedSession();
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const originalName = String(formData.get('originalName') ?? '').trim()
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const saved = await saveFile(file, originalName)
  const name = saved.name

  const image = await prisma.image.create({
    data: {
      key: saved.key,
      url: saved.url,
      name,
      size: BigInt(file.size),
      type: file.type || null,
      createdBy: userId,
      updatedBy: userId,
    },
    select: { id: true, key: true, url: true, name: true },
  })

  return NextResponse.json({ image })
}
