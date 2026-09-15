'use client'

import { useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui'
import { BookingStatusOptions } from '@/lib/types'

type BookingsFiltersProps = {
  initialDrivers: string
  initialCars: string
  initialProducts: string
  initialStatus: string
  initialSort: string
  driversOption: { value: string; label: string }[]
  carsOption: { value: string; label: string }[]
  productsOption: { value: string; label: string }[]
}

export default function BookingsFilters({
  initialDrivers,
  initialCars,
  initialProducts,
  initialStatus,
  initialSort,
  driversOption,
  carsOption,
  productsOption,
}: BookingsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // เมื่อเปลี่ยนตัวกรอง ให้รีเซ็ตหน้าเพจกลับไปหน้าแรก
    params.delete('page')

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className={`grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 md:grid-cols-3 xl:grid-cols-[200px_200px_auto_200px_200px] overflow-auto ${isPending ? 'opacity-70' : ''}`}>
      <Select
        value={initialDrivers}
        onChange={(e) => updateQueryParam('drivers', e.target.value)}
      >
        <option value="">ลูกค้าทั้งหมด</option>
        {driversOption.map((rows) => (
          <option key={rows.value} value={rows.value}>
            {rows.label}
          </option>
        ))}
      </Select>

      <Select
        value={initialCars}
        onChange={(e) => updateQueryParam('cars', e.target.value)}
      >
        <option value="">รถทั้งหมด</option>
        {carsOption.map((rows) => (
          <option key={rows.value} value={rows.value}>
            {rows.label}
          </option>
        ))}
      </Select>

      <Select
        value={initialProducts}
        onChange={(e) => updateQueryParam('products', e.target.value)}
      >
        <option value="">บริการทั้งหมด</option>
        {productsOption.map((rows) => (
          <option key={rows.value} value={rows.value}>
            {rows.label}
          </option>
        ))}
      </Select>

      <Select
        value={initialStatus}
        onChange={(e) => updateQueryParam('status', e.target.value)}
      >
        <option value="">ทุกสถานะ</option>
        {BookingStatusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </Select>

      <Select
        value={initialSort}
        onChange={(e) => updateQueryParam('sort', e.target.value)}
      >
        <option value="newest">ล่าสุด</option>
        <option value="most">ยอดรวมสุทธิมากสุด</option>
        <option value="least">ยอดรวมสุทธิน้อยสุด</option>
        <option value="dateStart">เรียงตามวันรับรถ</option>
        <option value="dateEnd">เรียงตามวันคืนรถ</option>
      </Select>
    </div>
  )
}