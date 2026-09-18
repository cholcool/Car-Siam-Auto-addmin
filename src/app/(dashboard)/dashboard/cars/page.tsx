import { Car as CarIcon, CheckCircle2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui'
import SpeedDialContainer from '@/components/SpeedDialContainer'
import { StatCard } from '@/components/DashboardOverviewPage'
import PageClient from "./page-client"
import { type CarsRow } from '@/lib/types'
import { syncMaintenanceStatuses } from '@/lib/maintenance-sync'
import { buildCarWhere, parseCarListQuery } from '@/lib/cars/query'
import CarsFilters from './filters'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function CarsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const { inputSearch, status } = parseCarListQuery(params)
  const where = buildCarWhere({ inputSearch, status })

  await syncMaintenanceStatuses()

  const [cars, totalCarsCount, availableCars, statusGroups] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    prisma.car.count({ where: { isDeleted: false } }),
    prisma.car.count({ where: { isDeleted: false, status: 'Available' } }),
    prisma.car.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { _all: true },
    })
  ]) as [CarsRow[], number, number, { status: string; _count: { _all: number } }[]]

  const statusCounts = Object.fromEntries(statusGroups.map((row) => [row.status, row._count._all]))

  return (
    <div className="space-y-6">
      <header className="hidden md:flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1917]">จัดการรถ</h1>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:min-w-80">
          <StatCard
            href="/dashboard/cars"
            title="รถทั้งหมด"
            value={String(totalCarsCount)}
            icon={CarIcon}
            iconBoxClassName="bg-[#F5F3FF]"
            iconClassName="text-[#6D28D9]"
          />
          <StatCard
            href="/dashboard/cars?status=Available"
            title="พร้อมให้เช่า"
            value={String(availableCars)}
            icon={CheckCircle2}
            iconBoxClassName="bg-[#F0FDF4]"
            iconClassName="text-[#16A34A]"
          />
        </div>
      </header>

      <CarsFilters
        initialSearch={inputSearch}
        initialStatus={status}
        statusCounts={statusCounts}
        totalCount={totalCarsCount}
      />

      {cars.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#6D28D9]">
              <CarIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-[#1C1917]">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</h2>
            <p className="mt-2 text-sm font-semibold text-[#78716C]">ลองเปลี่ยนคำค้นหาหรือตัวกรองอีกครั้ง</p>
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
