import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getStatusLabel, getStatusColorGroup, formatCompactNumber, formatThaiDate, toNumber } from '@/lib/ui-format'
import { MaintenanceRow } from '@/lib/types'
import CarImageCarousel from './car-image-carousel'
import CarEditLauncher from './car-edit-launcher'
import MaintenanceHistorySection from './maintenance-history-section'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const getCar = cache(async (id: string) =>
  prisma.car.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      model: true,
      year: true,
      color: true,
      license: true,
      engine: true,
      chassis: true,
      mileage: true,
      status: true,
      remark: true,
      brandId: true,
      vehicleTypeId: true,
      createdAt: true,
      brand: { select: { name: true } },
      vehicleType: { select: { name: true } },
    },
  })
)

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const car = await getCar(id)
  if (!car) return { title: 'Vehicle not found' }
  return { title: `${car.brand.name} ${car.model} | Car Siam Auto Admin` }
}

function InfoRow({ label, value, trailing }: { label: string; value: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#F0EFED] py-[13px] last:border-b-0">
      <div className="text-[13px] text-[#78716C]">{label}</div>
      <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#1C1917]">
        {value}
        {trailing}
      </div>
    </div>
  )
}

function formatDateTimeThai(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  const datePart = formatThaiDate(date)
  const timePart = new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Bangkok',
  }).format(date)
  return `${datePart} ${timePart} น.`
}

export default async function CarDetailPage({ params }: PageProps) {
  const { id } = await params
  const [car, imageRows, maintenanceItems, vehicleTypes, brands] = await Promise.all([
    getCar(id),
    prisma.mapCarImage.findMany({
      where: { carId: id, isDeleted: false, image: { isDeleted: false } },
      select: { image: { select: { id: true, url: true, name: true } } },
      orderBy: { number: 'asc' },
    }),
    prisma.maintenance.findMany({ where: { carId: id, isDeleted: false }, orderBy: { dateStart: 'desc' } }),
    prisma.vehicleType.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } }),
  ])

  if (!car) return notFound()

  const images = imageRows.map(({ image }) => image)

  const maintenanceRows: MaintenanceRow[] = maintenanceItems.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    description: item.description,
    remark: item.remark,
    status: item.status,
    mileage: item.mileage ?? 0,
    mileageTarget: item.mileageTarget ?? 0,
    mileageAlert: item.mileageAlert ?? 0,
    dateAlert: item.dateAlert?.toISOString().slice(0, 10) ?? null,
    dateStart: item.dateStart?.toISOString().slice(0, 10) ?? null,
    dateEnd: item.dateEnd?.toISOString().slice(0, 10) ?? null,
    dateCount: item.dateCount ?? 0,
  }))

  const onlyMaintenance = maintenanceRows.filter((row) => row.type === 'Maintenance')
  const onlyTaxInsurance = maintenanceRows.filter((row) => row.type === 'Tax' || row.type === 'Insurance')

  const statusGroup = getStatusColorGroup(car.status)
  const statusFgVar = `var(--status-${statusGroup}-fg)`
  const statusBgVar = `var(--status-${statusGroup}-bg)`

  const initialValues = {
    vehicleTypeId: car.vehicleTypeId,
    brandId: car.brandId,
    model: car.model,
    year: car.year,
    color: car.color,
    license: car.license,
    engine: car.engine ?? '',
    chassis: car.chassis ?? '',
    mileage: String(car.mileage ?? 0),
    status: car.status,
    remark: car.remark ?? '',
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex items-center justify-between bg-white/95 px-4 py-3 md:-mx-0 md:rounded md:border-x">
        <Link
          href="/dashboard/cars"
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-[#44403C] hover:bg-[#F5F5F4]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          กลับไปหน้าจัดการรถ
        </Link>
        <CarEditLauncher
          carId={car.id}
          vehicleTypes={vehicleTypes}
          brands={brands}
          initialValues={initialValues}
          initialImages={images}
        />
      </div>

      <div className="space-y-3 md:rounded md:border-x md:border-b md:border-[#E7E5E4] md:bg-white md:p-0 md:pb-6">
        <CarImageCarousel images={images} />

        <div className="bg-white pb-1 pt-1 px-4 -mx-4 md:mx-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[19px] font-extrabold text-[#1C1917]">
                {car.brand.name} {car.model}
              </div>
              <div className="mt-[3px] text-[13px] text-[#78716C]">
                ทะเบียน {car.license} · {car.vehicleType.name}
              </div>
            </div>
            <span
              className="mt-0.5 whitespace-nowrap rounded-full px-3 py-[5px] text-[11px] font-semibold"
              style={{ color: statusFgVar, background: statusBgVar }}
            >
              {getStatusLabel(car.status)}
            </span>
          </div>

          <div className="mt-4 flex gap-2.5">
            <div className="flex-1 rounded-xl bg-[#FAFAF9] px-3 py-2.5">
              <div className="text-[10.5px] text-[#78716C]">เลขไมล์ปัจจุบัน</div>
              <div className="mt-0.5 text-[14.5px] font-bold text-[#1C1917]">{formatCompactNumber(toNumber(car.mileage))} กม.</div>
            </div>
            <div className="flex-1 rounded-xl bg-[#FAFAF9] px-3 py-2.5">
              <div className="text-[10.5px] text-[#78716C]">ปีที่ผลิต</div>
              <div className="mt-0.5 text-[14.5px] font-bold text-[#1C1917]">{car.year}</div>
            </div>
            <div className="flex-1 rounded-xl bg-[#FAFAF9] px-3 py-2.5">
              <div className="text-[10.5px] text-[#78716C]">สี</div>
              <div className="mt-0.5 text-[14.5px] font-bold text-[#1C1917]">{car.color}</div>
            </div>
          </div>
        </div>

        <div className="md:px-6">
          <div className="mb-3 text-[15px] font-bold text-[#1C1917]">ข้อมูลรถ</div>
          <div className="rounded bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <InfoRow label="ประเภทรถ" value={car.vehicleType.name} />
            <InfoRow label="ยี่ห้อ / รุ่น" value={`${car.brand.name} · ${car.model}`} />
            <InfoRow label="ทะเบียนรถ" value={car.license} />
            <InfoRow label="เลขเครื่องยนต์" value={car.engine || '—'} />
            <InfoRow label="เลขตัวถัง" value={car.chassis || '—'} />
            <InfoRow
              label="สถานะ"
              value={getStatusLabel(car.status)}
              trailing={<ChevronDown className="h-3.5 w-3.5 text-[#A8A29E]" aria-hidden="true" />}
            />
            <InfoRow label="วันที่สร้างรายการ" value={formatDateTimeThai(car.createdAt)} />
          </div>

          <div className="mt-3 rounded-sm bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-1.5 text-[13px] text-[#78716C]">หมายเหตุ</div>
            <div className="text-[13px] leading-relaxed text-[#1C1917]">{car.remark || 'ไม่มีหมายเหตุเพิ่มเติม'}</div>
          </div>
        </div>

        <div className="pb-2 md:px-6">
          <MaintenanceHistorySection
            carId={car.id}
            carMileage={car.mileage}
            maintenanceRows={onlyMaintenance}
            taxRows={onlyTaxInsurance}
          />
        </div>
      </div>
    </div>
  )
}
