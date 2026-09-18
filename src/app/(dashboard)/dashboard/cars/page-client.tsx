'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BellRing, Car as CarIcon, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  formatCompactNumber,
  getStatusBadgeClass,
  getStatusLabel,
  toNumber,
} from '@/lib/ui-format'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import { CarsRow } from '@/lib/types'
import { sortMaintenancesForAlert } from '@/lib/maintenance-status'

interface PageProps {
  carsIn?: CarsRow[]
}

// Decorative thumbnail tones cycled per row — mirrors the color variety of
// the approved mobile mockup's car list cards (see
// claude/design-system-alignment-report.md). Not tied to status; purely
// visual rhythm so a long list doesn't look monotone.
const CAR_THUMBNAIL_TONES = [
  { background: 'linear-gradient(135deg, #E7E5E4, #F5F5F4)', icon: '#78716C' },
  { background: 'linear-gradient(135deg, #1C1917, #44403C)', icon: '#FFFFFF' },
  { background: 'linear-gradient(135deg, #DC2626, #EF4444)', icon: '#FFFFFF' },
  { background: 'linear-gradient(135deg, #2563EB, #60A5FA)', icon: '#FFFFFF' },
  { background: 'linear-gradient(135deg, #78716C, #A8A29E)', icon: '#FFFFFF' },
  { background: 'linear-gradient(135deg, #059669, #34D399)', icon: '#FFFFFF' },
]

export default function PageClient({ carsIn }: PageProps) {
  const [error, setError] = useState('')
  const [cars, setCars] = useState<CarsRow[]>(carsIn || [])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshCars = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const res = await fetch(`/api/cars?${params.toString()}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'ไม่สามารถโหลดข้อมูลรถได้')
        return
      }
      setCars(data)
    } catch {
      setError('ไม่สามารถโหลดข้อมูลรถได้')
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  async function deleteItem(id: string) {
    const res = await fetch('/api/cars', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data?.error ?? 'ไม่สามารถลบข้อมูลได้')
      return
    }
    setCars((current) => current.filter((item) => item.id !== id))
    refreshCars()
  }

  useEffect(() => {
    if (carsIn) {
      setCars(carsIn)
    }
  }, [carsIn])

  useEffect(() => {
    void refreshCars()
    const timer = window.setInterval(() => {
      void refreshCars()
    }, 60_000)

    return () => window.clearInterval(timer)
  }, [refreshCars])

  return (
    <>
      {error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      {isRefreshing ? <div className="mb-4 text-sm font-semibold text-[#78716C]">กำลังอัปเดตรายการรถ...</div> : null}

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {cars.map((car, index) => {
          const tone = CAR_THUMBNAIL_TONES[index % CAR_THUMBNAIL_TONES.length]

          const alertMaintenances = [...(car.maintenances || [])]
            .filter((m) => m.status === 'Active' || m.status === 'Overdue')
            .sort(sortMaintenancesForAlert)
          const latestActive = alertMaintenances[0]
          // const coverImage = car.images?.[0]?.image
          const coverImage = car.images?.find((img) => img.isDeleted === false)?.image

          return (
            <div
              key={car.id}
              className="group relative flex gap-3 rounded-2xl border border-[#E7E5E4] bg-white p-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.08)]"
            >
              <Link
                href={`/dashboard/cars/${car.id}`}
                className="absolute inset-0 z-0 rounded-2xl"
                aria-label={`ดูรายละเอียด ${car.brand?.name ?? ''} ${car.model}`}
              />

              <div
                className="relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl pointer-events-none"
                style={coverImage ? undefined : { background: tone.background }}
              >
                {coverImage ? (
                  <Image src={coverImage.url} alt={coverImage.name || `${car.brand?.name ?? ''} ${car.model}`} fill sizes="72px" className="object-cover" />
                ) : (
                  <CarIcon className="h-8 w-8" style={{ color: tone.icon }} strokeWidth={1.6} aria-hidden="true" />
                )}
              </div>

              <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center gap-1 pointer-events-none">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-[14.5px] font-bold text-[#1C1917]">
                    {car.brand?.name} {car.model}
                  </div>
                </div>

                <div className="truncate text-xs text-[#78716C]">
                  {car.vehicleType?.name} · {car.color} · {car.license}
                </div>

                {latestActive ? (
                  <Badge className="pointer-events-auto relative z-20 mt-0.5 w-fit rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[10.5px] font-semibold text-[#C2410C]">
                    <BellRing className="mr-1 inline-block h-3 w-3 text-[#C2410C]" />
                    {getStatusLabel(latestActive.type) ?? ''}
                  </Badge>
                ) : (
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#A8A29E]">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    เลขไมล์ {formatCompactNumber(toNumber(car.mileage))} กม.
                  </div>
                )}
              </div>

              <div className='flex flex-col items-end justify-between gap-1.5'>
                <span className={getStatusBadgeClass(car.status, 'pointer-events-auto relative z-20')}>
                  {getStatusLabel(car.status)}
                </span>
                <div className="relative z-20 flex shrink-0 items-start">
                  <AlertDialogDestructive onClick={() => deleteItem(car.id)} variant={'destructive'} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
