'use client'

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search } from "lucide-react"
import { CarStatusFilterOptions } from "@/lib/types"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"

type CarFiltersProps = {
  initialSearch: string
  initialStatus?: string | undefined
  statusCounts?: Record<string, number>
  totalCount?: number
}

export default function CarsFilters({
  initialSearch,
  initialStatus,
  statusCounts = {},
  totalCount = 0,
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

  const statusChips = [
    { value: '', label: 'ทั้งหมด', count: totalCount },
    ...CarStatusFilterOptions.map((status) => ({
      value: status.value,
      label: status.label,
      count: statusCounts[status.value] ?? 0,
    })),
  ]

  return (
    <div className={cn('space-y-3', isPending && 'opacity-70')}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหารถ รุ่น ทะเบียน..."
          className="h-11 rounded-xl border-[#E7E5E4] bg-[#FAFAF9] pl-10 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {statusChips.map((chip) => {
          const active = (initialStatus || '') === chip.value
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => updateQueryParam('status', chip.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'bg-[#6D28D9] text-white'
                  : 'border border-[#E7E5E4] bg-white text-[#44403C] hover:border-[#6D28D9]/30 hover:text-[#6D28D9]'
              )}
            >
              {chip.label} {chip.count}
            </button>
          )
        })}
      </div>
    </div>
  )
}
