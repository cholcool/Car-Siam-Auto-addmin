'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui'

const CarImageUploader = dynamic(() => import('@/components/CarImageUploader'), {
  ssr: false,
  loading: () => (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
      </CardContent>
    </Card>
  ),
})

type Props = {
  carId: string
  images: Array<{ id: string; url: string; name?: string | null }>
}

export default function CarImagesInteractive({ carId, images }: Props) {
  const router = useRouter()

  return <CarImageUploader carId={carId} initialImages={images} onUploaded={() => router.refresh()} />
}
