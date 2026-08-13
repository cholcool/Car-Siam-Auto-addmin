import { Suspense, cache } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Save, Sparkles, Gauge, RectangleEllipsis } from 'lucide-react'
import prisma from '@/lib/prisma'
import { Badge, Button, Card, CardContent, Input, Textarea, Select } from '@/components/ui'
import { getStatusBadgeClass, getStatusLabel, formatCompactNumber, toNumber } from '@/lib/ui-format'
import { updateCar } from '../cars-actions'
import { MaintenanceRow, CarStatusOptions, CarStatus } from '@/lib/types'
import { sortMaintenancesForAlert } from '@/lib/maintenance-status'
import CarImagesInteractive from './car-images-interactive'
import MaintenanceInteractive from './maintenance-interactive'

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
      brand: { select: { name: true } },
    },
  })
)

type CarDetail = NonNullable<Awaited<ReturnType<typeof getCar>>>

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const car = await getCar(id)
  if (!car) return { title: 'Vehicle not found' }
  return { title: `${car.brand.name} ${car.model} | RentCar Admin` }
}

function SectionSkeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
}

async function CarInfoForm({ car, saveCar }: { car: CarDetail; saveCar: (formData: FormData) => Promise<void> }) {
  const [vehicleTypes, brands] = await Promise.all([
    prisma.vehicleType.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ where: { isDeleted: false }, orderBy: { name: 'asc' } }),
  ])

  return (
    <aside>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-950">ข้อมูลรถ</h2>
          </div>

          <form id="car-form" action={saveCar} className="grid gap-2 md:grid-cols-2">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-semibold text-slate-700">สถานะ <span className="text-red-600">*</span></label>
              <Select name="status" defaultValue={car.status} required>
                {CarStatusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-semibold text-slate-700">ประเภทรถ <span className="text-red-600">*</span></label>
              <Select name="vehicleTypeId" defaultValue={car.vehicleTypeId} required>
                <option value="">-- เลือกประเภทรถ --</option>
                {vehicleTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-semibold text-slate-700">แบรนด์รถ <span className="text-red-600">*</span></label>
              <Select name="brandId" defaultValue={car.brandId} required>
                <option value="">-- เลือกแบรนด์ --</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </Select>
            </div>
            <CarTextFields car={car} />
          </form>
        </CardContent>
      </Card>
    </aside>
  )
}

function CarTextFields({ car }: { car: CarDetail }) {
  return <>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">รุ่น <span className="text-red-600">*</span></label><Input name="model" defaultValue={car.model} maxLength={100} required /></div>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">ปีที่ผลิต <span className="text-red-600">*</span></label><Input name="year" defaultValue={car.year} maxLength={4} inputMode="numeric" required /></div>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">สีรถ <span className="text-red-600">*</span></label><Input name="color" defaultValue={car.color} maxLength={50} required /></div>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">ทะเบียน <span className="text-red-600">*</span></label><Input name="license" defaultValue={car.license} maxLength={20} required /></div>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">เลขเครื่องยนต์</label><Input name="engine" defaultValue={car.engine ?? ''} maxLength={20} /></div>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">เลขตัวถัง</label><Input name="chassis" defaultValue={car.chassis ?? ''} maxLength={20} /></div>
    <div className="space-y-2 xl:col-span-2"><label className="text-sm font-semibold text-slate-700">เลขไมล์</label><Input name="mileage" type="number" step="1" min="0" defaultValue={car.mileage} /></div>
    <div className="space-y-2 md:col-span-2"><label className="text-sm font-semibold text-slate-700">หมายเหตุ</label><Textarea name="remark" defaultValue={car.remark ?? ''} maxLength={500} rows={4} /></div>
  </>
}

async function CarImagesThenMaintenance({ carId, carMileage }: { carId: string; carMileage: number }) {
  const imageRows = await prisma.mapCarImage.findMany({
    where: { carId, isDeleted: false, image: { isDeleted: false } },
    select: { image: { select: { id: true, url: true, name: true } } },
    orderBy: { number: 'asc' },
  })
  const images = imageRows.map(({ image }) => image)

  return <>
    <CarImagesInteractive carId={carId} images={images} />
    <Suspense fallback={<SectionSkeleton className="h-96" />}>
      <MaintenanceSection carId={carId} carMileage={carMileage} />
    </Suspense>
  </>
}

async function MaintenanceSection({ carId, carMileage }: { carId: string; carMileage: number }) {
  const maintenances = await prisma.maintenance.findMany({
    where: { carId, isDeleted: false },
    orderBy: { dateStart: 'desc' },
  })
  const rows: MaintenanceRow[] = maintenances.map((item) => ({
    id: item.id, type: item.type, name: item.name, description: item.description, remark: item.remark,
    status: item.status, mileage: item.mileage ?? 0, mileageTarget: item.mileageTarget ?? 0,
    mileageAlert: item.mileageAlert ?? 0, dateAlert: item.dateAlert?.toISOString().slice(0, 10) ?? null,
    dateStart: item.dateStart?.toISOString().slice(0, 10) ?? null,
    dateEnd: item.dateEnd?.toISOString().slice(0, 10) ?? null, dateCount: item.dateCount ?? 0,
  })).sort(sortMaintenancesForAlert)

  return <MaintenanceInteractive carId={carId} carMileage={carMileage} maintenances={rows} />
}

export default async function CarDetailPage({ params }: PageProps) {
  const { id } = await params
  const car = await getCar(id)
  if (!car) return notFound()

  async function saveCar(formData: FormData) {
    'use server'
    const result = await updateCar({
      carId: id, vehicleTypeId: String(formData.get('vehicleTypeId') ?? ''), brandId: String(formData.get('brandId') ?? ''),
      model: String(formData.get('model') ?? '').trim(), year: String(formData.get('year') ?? '').trim(),
      color: String(formData.get('color') ?? '').trim(), license: String(formData.get('license') ?? '').trim(),
      engine: String(formData.get('engine') ?? '').trim() || null, chassis: String(formData.get('chassis') ?? '').trim() || null,
      mileage: Number(formData.get('mileage') ?? 0), status: String(formData.get('status') ?? 'Available') as CarStatus,
      remark: String(formData.get('remark') ?? '').trim() || null,
    })
    if (!result.success) throw new Error(result.error || 'ไม่สามารถบันทึกข้อมูลรถได้')
    redirect(`/dashboard/cars/${id}`)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <Link href="/dashboard/cars" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />กลับไปหน้าจัดการรถ</Link>
          <div><div className="flex flex-wrap items-center gap-3"><h1 className="lg:text-3xl text-2xl font-extrabold tracking-tight text-slate-950">{car.brand.name} {car.model}</h1><Badge className={getStatusBadgeClass(car.status)}>{getStatusLabel(car.status)}</Badge></div><p className="mt-2 flex gap-3 text-base font-medium text-slate-500"><RectangleEllipsis /> ทะเบียน {car.license} <Gauge /> เลขไมล์ {formatCompactNumber(toNumber(car.mileage))}</p></div>
        </div>
        <Button type="submit" form="car-form" variant="save"><Save className="h-4 w-4" />บันทึกข้อมูลรถ</Button>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6 overflow-auto"><Suspense fallback={<SectionSkeleton className="h-80" />}><CarImagesThenMaintenance carId={car.id} carMileage={car.mileage} /></Suspense></div>
        <Suspense fallback={<SectionSkeleton className="h-155" />}><CarInfoForm car={car} saveCar={saveCar} /></Suspense>
      </div>
    </div>
  )
}
