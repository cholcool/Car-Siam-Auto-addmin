'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input, Select } from '@/components/ui'
import { ProductsStatusOptions } from '@/lib/types'

type ProductsFiltersProps = {
  initialSearch: string
  initialStatus: string
  initialSort: string
}

export default function ProductsFilters({
  initialSearch,
  initialStatus,
  initialSort,
}: ProductsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)

  // หน่วงเวลาการค้นหา 400ms หลังจากหยุดพิมพ์
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== initialSearch) {
        updateQueryParam('inputSearch', search)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [search])

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // เมื่อมีการเปลี่ยนตัวกรอง ให้รีเซ็ตหน้าเพจกลับไปที่หน้า 1
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
    <div className={`grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 md:grid-cols-[minmax(180px,1fr)_180px_160px] overflow-auto ${isPending ? 'opacity-70' : ''}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาข้อมูลบริการ"
          className="pl-10"
        />
      </div>

      <Select
        value={initialStatus}
        onChange={(e) => updateQueryParam('status', e.target.value)}
      >
        <option value="">ทุกสถานะ</option>
        {ProductsStatusOptions.map((status) => (
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
        <option value="dateStart">วันที่เริ่ม</option>
        <option value="dateEnd">วันที่สิ้นสุด</option>
        <option value="name">ชื่อบริการ</option>
        <option value="price">ราคาน้อย</option>
        <option value="priceHigh">ราคามาก</option>
      </Select>
    </div>
  )
}