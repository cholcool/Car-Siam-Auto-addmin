import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'

import { Client as FtpClient } from 'basic-ftp'
import SftpClient from 'ssh2-sftp-client'

type UploadProtocol = 'ftp' | 'ftps' | 'sftp'

export type UploadedFile = {
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

function getUploadProtocol(): UploadProtocol {
  const value = (process.env.UPLOAD_PROTOCOL ?? 'sftp').toLowerCase()
  if (value === 'ftp' || value === 'ftps' || value === 'sftp') return value
  throw new Error('UPLOAD_PROTOCOL must be ftp, ftps, or sftp')
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for image uploads`)
  return value
}

function getUploadDir() {
  const dir = getRequiredEnv('UPLOAD_DIR').replace(/\/+$/, '')

  // A relative path (the common case for a restricted FTP/SFTP account that is
  // already chrooted to uploads.carsiamauto.com/public_html) is always fine -
  // the checks below only make sense for an absolute path on a shared host
  // where the same account could reach other sites' directories.
  if (dir.startsWith('/')) {
    if (dir === '/home/u713234815' || /^\/home\/[^/]+\/?$/.test(dir)) {
      throw new Error('UPLOAD_DIR must point inside uploads.carsiamauto.com/public_html, not a bare home directory')
    }

    const portalDir = process.env.PRO_UPLOAD_DIR?.trim().replace(/\/+$/, '')
    if (portalDir && dir === portalDir) {
      throw new Error('UPLOAD_DIR must not point at the portal app directory (PRO_UPLOAD_DIR); use the uploads.carsiamauto.com host instead')
    }

    if (dir.includes('portal.carsiamauto.com')) {
      throw new Error('UPLOAD_DIR must be under the uploads.carsiamauto.com hosting account, not the portal.carsiamauto.com one')
    }
  }

  return dir
}

function getPublicBaseUrl() {
  return (process.env.UPLOAD_PUBLIC_URL ?? 'https://uploads.carsiamauto.com/uploads/').replace(/\/?$/, '/')
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

async function uploadViaSftp(buffer: Buffer, remotePath: string) {
  const client = new SftpClient()
  try {
    await client.connect({
      host: getRequiredEnv('UPLOAD_HOST'),
      port: Number(process.env.UPLOAD_PORT ?? 22),
      username: getRequiredEnv('UPLOAD_USER'),
      password: getRequiredEnv('UPLOAD_PASSWORD'),
    })
    await client.mkdir(getUploadDir(), true)
    await client.put(buffer, remotePath)
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function uploadViaFtp(buffer: Buffer, filename: string) {
  const protocol = getUploadProtocol()
  const client = new FtpClient()
  try {
    await client.access({
      host: getRequiredEnv('UPLOAD_HOST'),
      port: Number(process.env.UPLOAD_PORT ?? (protocol === 'ftps' ? 990 : 21)),
      user: getRequiredEnv('UPLOAD_USER'),
      password: getRequiredEnv('UPLOAD_PASSWORD'),
      secure: protocol === 'ftps',
    })
    // ensureDir() both creates the directory AND cd's the session into it, so
    // the upload below must use a bare filename - passing the full remote
    // path again here would resolve relative to that new cwd and double up
    // the directory (e.g. public_html/uploads/public_html/uploads/x.jpg),
    // which is exactly the "550 No such file or directory" error this fixes.
    await client.ensureDir(getUploadDir())
    await client.uploadFrom(Readable.from(buffer), filename)
  } finally {
    client.close()
  }
}

export async function saveUploadedImage(file: File, originalName: string): Promise<UploadedFile> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = getExtension(file, originalName)
  const filename = `${randomUUID()}${ext ? `.${ext.toLowerCase()}` : ''}`
  const remotePath = `${getUploadDir()}/${filename}`

  if (getUploadProtocol() === 'sftp') {
    await uploadViaSftp(buffer, remotePath)
  } else {
    await uploadViaFtp(buffer, filename)
  }

  return {
    key: filename,
    url: `${getPublicBaseUrl()}${filename}`,
    name: normalizeDisplayName(originalName, file.name),
  }
}
