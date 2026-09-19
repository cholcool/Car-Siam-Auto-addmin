'use client'

import Image from 'next/image'
import { Car } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, CarouselDots, CarouselPrevious, CarouselNext } from '@/components/ui'

type CarImage = { id: string; url: string; name?: string | null }

export default function CarImageCarousel({ images }: { images: CarImage[] }) {
  if (images.length === 0) {
    return (
      <div className="flex h-[230px] w-full items-center justify-center bg-linear-to-br from-[#292524] to-[#57534E] md:rounded-2xl">
        <Car className="h-16 w-16 text-white/30" aria-hidden="true" />
      </div>
    )
  }

  return (
    <Carousel className="group md:overflow-hidden -mx-4 md:mx-0">
      <CarouselContent>
        {images.map((image) => (
          <CarouselItem key={image.id}>
            <div className="relative h-[230px] w-full bg-[#F5F5F4] md:h-[340px]">
              <Image
                src={image.url}
                alt={image.name ?? 'รูปภาพรถ'}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {images.length > 1 ? (
        <>
          <CarouselPrevious className="opacity-0 transition group-hover:opacity-100" />
          <CarouselNext className="opacity-0 transition group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <CarouselDots variant="overlay" className="mt-0 rounded-full bg-black/25 px-3 py-1.5" />
          </div>
        </>
      ) : null}
    </Carousel>
  )
}
