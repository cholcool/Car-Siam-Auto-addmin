"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Car, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CarGallery({ images }: { images: Array<{ url: string; alt?: string }> }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [images])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(images.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length])

  if (!images || images.length === 0) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 sm:h-[420px]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Car className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="mt-4 text-sm font-bold text-slate-500">No images available</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 sm:h-[420px]">
        <Image src={images[index].url} alt={images[index].alt || 'vehicle image'} fill className="object-cover" />

        {images.length > 1 && (
          <>
            <button
              aria-label="Previous image"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg shadow-slate-950/10 transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              aria-label="Next image"
              onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
              className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg shadow-slate-950/10 transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border bg-white transition ${
                i === index ? 'border-blue-700 ring-2 ring-blue-700/20' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <Image src={img.url} alt={img.alt || `thumb-${i}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
