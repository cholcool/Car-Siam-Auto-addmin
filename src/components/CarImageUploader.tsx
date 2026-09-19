'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, ImageUp, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import { cn } from '@/lib/utils'

type ExistingImage = { id: string; url: string; name?: string | null }

interface Props {
  carId?: string
  initialImages?: ExistingImage[]
  onPendingFilesChange?: (files: File[]) => void
  onUploaded?: () => void
  className?: string
}

export default function CarImageUploader({ carId, initialImages = [], onPendingFilesChange, onUploaded, className }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setExistingImages(prev =>
      JSON.stringify(prev) === JSON.stringify(initialImages) ? prev : initialImages
    )
  }, [initialImages])

  useEffect(() => {
    onPendingFilesChange?.(selectedFiles)
  }, [onPendingFilesChange, selectedFiles])

  const [previews, setPreviews] = useState<Array<{ file: File; preview: string }>>([])

  useEffect(() => {
    const next = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPreviews(next)
    return () => {
      next.forEach(({ preview }) => URL.revokeObjectURL(preview))
    }
  }, [selectedFiles])

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return

    const fileArr = Array.from(files)
    // The compression library is large, so only fetch it after the user selects images.
    const { default: imageCompression } = await import('browser-image-compression')

    const compressedArr = fileArr.map(async (item: any) => {
      const options = {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      }

      return await imageCompression(item, options)
    })

    const compressedFiles = await Promise.all(
      compressedArr.map(async (promise, index) => {
        const compressed = await promise
        const original = fileArr[index]
        return new File([compressed], original.name, { type: compressed.type || original.type })
      })
    )

    setError(null)
    setSelectedFiles((prev) => [...prev, ...compressedFiles])
  }

  const removeSelected = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExisting = async (imageId: string) => {
    const response = await fetch('/api/car-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId }),
    })
    if (!response.ok) {
      setError('ไม่สามารถลบรูปภาพได้')
      return
    }
    setExistingImages((prev) => prev.filter((item) => item.id !== imageId))
    onUploaded?.()
  }

  const uploadSelected = async () => {
    if (!carId) return
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('carId', carId)
      selectedFiles.forEach((file) => {
        formData.append('files', file)
        formData.append('originalNames', file.name)
      })

      const response = await fetch('/api/car-images', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Upload failed')
      }
      setSelectedFiles([])
      onUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const thumbClass = 'relative h-20 w-20 shrink-0 overflow-hidden rounded border border-[#E7E5E4]'

  return (
    <div className={cn('mt-2', className)}>
      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-3">
        <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 border-dashed border-[#E7E5E4] bg-white text-[#6D28D9] hover:border-[#6D28D9]/40">
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span className="text-[11px] font-semibold">เพิ่มรูป</span>
          <input hidden type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e.target.files)} />
        </label>

        {existingImages.map((image) => (
          <div key={image.id} className={cn(thumbClass, 'group')}>
            <Image
              src={image.url}
              alt={image.name ?? 'car image'}
              fill
              sizes="80px"
              loading="lazy"
              className="object-contain"
            />
            <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
              <AlertDialogDestructive
                onClick={() => removeExisting(image.id)}
                variant={'imageDelete'}
                size="icon-sm"
                title="ต้องการลบรูปภาพนี้ใช่ไหม?"
                description=""
              />
            </div>
          </div>
        ))}

        {previews.map(({ file, preview }, index) => (
          <div key={`${file.name}-${index}`} className={cn(thumbClass, 'bg-[#F5F5F4]')}>
            <Image src={preview} alt={file.name} fill sizes="80px" className="object-contain" />
            <button
              type="button"
              onClick={() => removeSelected(index)}
              aria-label="ลบรูปนี้"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {carId && selectedFiles.length > 0 && (
        <Button type="button" onClick={uploadSelected} disabled={isUploading} className="mt-3">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
          อัปโหลดรูปภาพ
        </Button>
      )}
    </div>
  )
}
