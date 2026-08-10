export const runtime = 'nodejs'

import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
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
  return { filename, url: `${PUBLIC_SITE_URL}${filename}`, name: originalName && originalName.toLowerCase() !== 'blob' ? originalName : file.name }
}

export async function POST(request: Request) {
  const session = await getCachedSession();
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const carId = String(formData.get('carId') ?? '').trim()
  const files = formData.getAll('files').filter((value): value is File => value instanceof File && value.size > 0)
  const originalNames = formData.getAll('originalNames').map((value) => String(value ?? '').trim())
  if (!carId) return NextResponse.json({ error: 'carId is required' }, { status: 400 })
  if (files.length === 0) return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })

  const car = await prisma.car.findFirst({ where: { id: carId, isDeleted: false }, select: { id: true } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })

  const uploaded: Array<{ id: string; url: string; name: string }> = []
  for (const [index, file] of files.entries()) {
    const originalName = originalNames[index] || file.name
    const { filename, url, name } = await saveFile(file, originalName)
    const image = await prisma.image.create({
      data: {
        key: filename,
        url,
        name,
        size: BigInt(file.size),
        type: file.type || null,
        createdBy: userId,
        updatedBy: userId,
      },
      select: { id: true, url: true, name: true },
    })

    await prisma.mapCarImage.create({
      data: {
        carId,
        imageId: image.id,
        createdBy: userId,
        updatedBy: userId,
      },
    })

    uploaded.push(image)
  }

  return NextResponse.json({ images: uploaded })
}

export async function DELETE(request: Request) {
  const session = await getCachedSession();
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const imageId = String(body.imageId ?? '').trim()
  if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 })

  const image = await prisma.image.findFirst({
    where: { id: imageId, isDeleted: false },
    select: { id: true, key: true, url: true, name: true },
  })
  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  await prisma.mapCarImage.updateMany({
    where: { imageId },
    data: { isDeleted: true, updatedBy: userId },
  })
  await prisma.image.update({
    where: { id: imageId },
    data: { isDeleted: true, updatedBy: userId },
  })

  // Note: function นี้จะลบไฟล์รูปภาพออกจากระบบไฟล์
  // await unlink(join(UPLOAD_DIR, image.key)).catch(() => undefined)

  return NextResponse.json({ ok: true })
}
