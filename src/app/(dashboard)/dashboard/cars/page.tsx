import { Car } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui'
import { formatCompactNumber } from '@/lib/ui-format'
import SpeedDialContainer from '@/components/SpeedDialContainer'
import PageClient from "./page-client"
import { type CarsRow } from '@/lib/types'
import { syncMaintenanceStatuses } from '@/lib/maintenance-sync'
import { buildCarOrderBy, buildCarWhere, parseCarListQuery } from '@/lib/cars/query'
import CarsFilters from './filters'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CarsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const { inputSearch, status, brand, vehicleType, sort } = parseCarListQuery(params)
  const where = buildCarWhere({ inputSearch, status, brand, vehicleType, sort })
  const orderBy = buildCarOrderBy(sort)

  await syncMaintenanceStatuses()

  const [cars, availableCars, vehicleTypes, brands] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy,
      take: 48,
      include: {
        brand: true,
        vehicleType: true,
        maintenances: true,
        images: {
          include: { image: true },
          orderBy: { number: 'asc' },
        },
      },
    }),
    prisma.car.count({ where: { isDeleted: false, status: 'Available' } }),
    prisma.vehicleType.findMany({ where: { isDeleted: false } }),
    prisma.brand.findMany({ where: { isDeleted: false } }),
  ]) as [CarsRow[], number, { id: string; name: string }[], { id: string; name: string }[]]

  const totalCars = cars.length

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className='hidden md:block'>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">จัดการรถ</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-72">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">{formatCompactNumber(totalCars)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">พร้อมให้เช่า</div>
            <div className="mt-2 text-3xl font-extrabold text-emerald-600">
              {formatCompactNumber(availableCars)}
            </div>
          </div>
        </div>
      </header>

      <CarsFilters 
        initialSearch={inputSearch}
        initialVehicleType={vehicleType}
        initialBrand={brand}
        initialStatus={status}
        initialSort={sort}
        vehicleTypes={vehicleTypes}
        brands={brands}
      />

      {cars.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Car className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-slate-950">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง</p>
          </CardContent>
        </Card>
      )}

      {cars.length > 0 && (
        <PageClient carsIn={cars} />
      )}

      <SpeedDialContainer />
    </div>
  )
}
