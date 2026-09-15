'use client'

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { CarStatusOptions } from "@/lib/types"
import { Input, Select,  } from "@/components/ui"

type CarFiltersProps = {
  initialSearch: string
  initialVehicleType?: string | undefined
  initialBrand?: string | undefined
  initialStatus?: string | undefined
  initialSort?: string | undefined
  vehicleTypes?: { id: string; name: string }[] | undefined
  brands?: { id: string; name: string }[] | undefined
}

export default function CarsFilters({
  initialSearch,
  initialVehicleType,
  initialBrand,
  initialStatus,
  initialSort,
  vehicleTypes,
  brands,
}: CarFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch || "")

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (search !== initialSearch) {
        updateQueryParam('inputSearch', search)
      }
    }, 200)

    return () => clearTimeout(delayDebounce)
  }, [search])

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
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
    <div className={`grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 md:grid-cols-3 xl:grid-cols-[minmax(220px,1fr)_180px_160px_160px_150px] overflow-auto ${isPending ? 'opacity-70' : ''}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหารถ รุ่น ทะเบียน"
          className="pl-10"
        />
      </div>

      <Select
        value={initialVehicleType || ''}
        onChange={(e) => updateQueryParam('vehicleType', e.target.value)}
      >
        <option value="">ทุกประเภท</option>
        {vehicleTypes?.map((type) => (
          <option key={type.id} value={type.name}>
            {type.name}
          </option>
        ))}
      </Select>

      <Select
        value={initialBrand || ''}
        onChange={(e) => updateQueryParam('brand', e.target.value)}
      >
        <option value="">ทุกแบรนด์</option>
        {brands?.map((brand) => (
          <option key={brand.id} value={brand.name}>
            {brand.name}
          </option>
        ))}
      </Select>

      <Select
        value={initialStatus || ''}
        onChange={(e) => updateQueryParam('status', e.target.value)}
      >
        <option value="">ทุกสถานะ</option>
        {CarStatusOptions.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </Select>

      <Select
        value={initialSort || 'newest'}
        onChange={(e) => updateQueryParam('sort', e.target.value)}
      >
        <option value="newest">ล่าสุด</option>
        <option value="model">เรียงตามรุ่น</option>
        <option value="year">ปีใหม่ก่อน</option>
        <option value="mileage">ไมล์น้อยก่อน</option>
      </Select>
    </div>
  )
}