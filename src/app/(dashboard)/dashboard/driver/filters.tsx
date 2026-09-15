'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input, Select } from '@/components/ui'

type DriverFiltersProps = {
  initialSearch: string
  initialSort: string
}

export default function DriverFilters({ initialSearch, initialSort }: DriverFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== initialSearch) {
        updateQueryParam('inputSearch', search)
      }
    }, 200)

    return () => clearTimeout(delayDebounceFn)
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
    <div className={`grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 md:grid-cols-3 xl:grid-cols-[minmax(220px,1fr)_180px_160px] overflow-auto ${isPending ? 'opacity-70' : ''}`}>
      <div className="relative md:col-span-2 xl:col-span-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ เบอร์โทร"
          className="pl-10"
        />
      </div>

      <Select
        value={initialSort}
        onChange={(e) => updateQueryParam('sort', e.target.value)}
      >
        <option value="newest">ล่าสุด</option>
        <option value="fullName">เรียงตามชื่อ</option>
        <option value="phone">เรียงตามเบอร์โทร</option>
      </Select>
    </div>
  )
}