export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCachedSession } from '@/lib/auth'
import { saveUploadedImage } from '../_utils/remote-upload'

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

  const saved = await saveUploadedImage(file, originalName)

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

  return NextResponse.json({ image })
}
