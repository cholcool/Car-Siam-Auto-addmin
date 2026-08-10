import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ROLE_GROUPS } from '@/lib/rbac/access'
import { getAuthorizedUserIdByRoles } from '@/lib/auth-server'

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? process.env.UPLOAD_DIR
  : join(process.cwd(), 'public', 'uploads')

const PUBLIC_SITE_URL = process.env.NEXTAUTH_URL + '/uploads/'

type OwnerType = 'driver' | 'guarantor' | 'user'
type UploadField = 'card' | 'license'
type UploadedFile = {
  key: string
  url: string
  name: string
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

async function getUserId() {
  return getAuthorizedUserIdByRoles(ROLE_GROUPS.EDITORS)
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

function normalizeDisplayName(value: string, fallback: string) {
  const trimmed = value.trim()
  return trimmed && trimmed.toLowerCase() !== 'blob' ? trimmed : fallback
}

function getExtension(file: File, originalName: string) {
  const fromMime = MIME_EXTENSION_MAP[file.type]
  if (fromMime) return fromMime

  const sourceName = originalName.trim() && originalName.toLowerCase() !== 'blob' ? originalName : file.name
  const fromName = sourceName.includes('.') ? sourceName.split('.').pop() : ''
  return fromName?.toLowerCase() || ''
}

async function saveFile(file: File, originalName: string): Promise<UploadedFile> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = getExtension(file, originalName)
  const filename = `${randomUUID()}${ext ? `.${ext.toLowerCase()}` : ''}`
  await ensureUploadDir()
  await writeFile(join(UPLOAD_DIR, filename), buffer)
  return {
    key: filename,
    url: `${PUBLIC_SITE_URL}${filename}`,
    name: normalizeDisplayName(originalName, file.name),
  }
}

function validateField(field: string): field is UploadField {
  return ['card', 'license'].includes(field)
}

async function resolveOwnerOrThrow(ownerType: OwnerType, ownerId: string) {
  if (ownerType === 'user') {
    const user = await prisma.user.findFirst({
      where: { id: ownerId, isDeleted: false },
      select: { id: true },
    })
    if (!user) return null
    return { userId: ownerId }
  }

  const driver = await prisma.driver.findFirst({
    where: { id: ownerId, isDeleted: false },
    select: { id: true },
  })
  if (!driver) return null

  if (ownerType === 'driver') return { driverId: ownerId }

  const guarantor = await prisma.guarantor.findFirst({
    where: { driverId: ownerId },
    select: { id: true },
  })
  if (!guarantor) return null

  return { driverId: ownerId }
}

export async function uploadImage(ownerType: OwnerType, request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const ownerId = String(formData.get('ownerId') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const originalName = String(formData.get('originalName') ?? '').trim()
  const file = formData.get('file')

  if (!ownerId) return NextResponse.json({ error: 'ownerId is required' }, { status: 400 })
  if (!validateField(field)) return NextResponse.json({ error: 'field is invalid' }, { status: 400 })
  if (!(file instanceof File) || file.size <= 0) return NextResponse.json({ error: 'file is required' }, { status: 400 })

  const owner = await resolveOwnerOrThrow(ownerType, ownerId)
  if (!owner) {
    return NextResponse.json(
      { error: ownerType === 'driver' ? 'Driver not found' : 'Guarantor not found' },
      { status: 404 }
    )
  }

  const saved = await saveFile(file, originalName)
  const image = await prisma.image.create({
    data: {
      key: saved.key,
      url: saved.url,
      name: saved.name,
      size: BigInt(file.size),
      type: file.type || null,
      createdBy: userId,
      updatedBy: userId,
    },
    select: { id: true, key: true, url: true, name: true },
  })

  if (ownerType === 'driver') {
    await prisma.driver.update({
      where: { id: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: image.id } : { licenseImageId: image.id }),
        updatedBy: userId,
      },
    })
  } else if (ownerType === 'user') {
    await prisma.user.update({
      where: { id: owner.userId },
      data: {
        cardImageId: image.id,
        updatedBy: userId,
      },
    })
  } else {
    await prisma.guarantor.update({
      where: { driverId: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: image.id } : { licenseImageId: image.id }),
        updatedBy: userId,
      },
    })
  }

  return NextResponse.json({ image, field })
}

export async function deleteImage(ownerType: OwnerType, request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ownerId = String(body.ownerId ?? '').trim()
  const field = String(body.field ?? '').trim()
  const imageId = String(body.imageId ?? '').trim()

  if (!ownerId) return NextResponse.json({ error: 'ownerId is required' }, { status: 400 })
  if (!validateField(field)) return NextResponse.json({ error: 'field is invalid' }, { status: 400 })
  if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 })

  const image = await prisma.image.findFirst({
    where: { id: imageId, isDeleted: false },
    select: { id: true, key: true, url: true, name: true },
  })
  if (!image) return NextResponse.json({ error: 'ไม่พบรูปภาพ' }, { status: 404 })

  const owner = await resolveOwnerOrThrow(ownerType, ownerId)
  if (!owner) {
    return NextResponse.json(
      { error: ownerType === 'driver' ? 'ไม่พบคนขับ' : 'ไม่พบผู้ค้ำประกัน' },
      { status: 404 }
    )
  }

  if (ownerType === 'driver') {
    await prisma.driver.update({
      where: { id: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: null } : { licenseImageId: null }),
        updatedBy: userId,
      },
    })
  } else if (ownerType === 'user') {
    await prisma.user.update({
      where: { id: owner.userId },
      data: {
        cardImageId: null,
        updatedBy: userId,
      },
    })
  } else {
    await prisma.guarantor.update({
      where: { driverId: owner.driverId },
      data: {
        ...(field === 'card' ? { cardImageId: null } : { licenseImageId: null }),
        updatedBy: userId,
      },
    })
  }

  await prisma.image.update({
    where: { id: imageId },
    data: { isDeleted: true, updatedBy: userId },
  })

  return NextResponse.json({ ok: true })
}

export const createDriverImagePostRoute = () => (request: Request) => uploadImage('driver', request)
export const createDriverImageDeleteRoute = () => (request: Request) => deleteImage('driver', request)
export const createGuarantorImagePostRoute = () => (request: Request) => uploadImage('guarantor', request)
export const createGuarantorImageDeleteRoute = () => (request: Request) => deleteImage('guarantor', request)
export const createUserImagePostRoute = () => (request: Request) => uploadImage('user', request)
export const createUserImageDeleteRoute = () => (request: Request) => deleteImage('user', request)
