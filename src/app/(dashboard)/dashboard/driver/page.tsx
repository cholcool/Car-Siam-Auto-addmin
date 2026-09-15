import prisma from '@/lib/prisma'
import DriverPageClient from './driver-client'
import { DriverRow } from '@/lib/types' 
import { formatCompactNumber } from '@/lib/ui-format'
import DriverFilters from './filters'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DriverPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const inputSearch = typeof params.inputSearch === 'string' ? params.inputSearch.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'

  const where: any = { isDeleted: false }

  if (inputSearch) {
    where.OR = [
      { fullName: { contains: inputSearch } },
      { phone: { contains: inputSearch } },
    ]
  }

  const orderBy: any =
    sort === 'fullName'
      ? { fullName: 'asc' }
      : sort === 'phone'
        ? { phone: 'desc' }
        : { createdAt: 'desc' }

  const drivers = await prisma.driver.findMany({
    where,
    orderBy,
    include: {
      cardImage: true,
      licenseImage: true,
      guarantor: {
        include: {
          cardImage: true,
          licenseImage: true,
        },
      },
    },
  });
        

  const total = drivers.length;

  const rows: DriverRow[] = drivers.map((driver) => ({
    id: driver.id,
    fullName: driver.fullName,
    phone: driver.phone,
    remark: driver.remark ?? null, 
    cardImageId: driver.cardImageId ?? null,
    licenseImageId: driver.licenseImageId ?? null,
    cardImage: driver.cardImage
      ? {
          id: driver.cardImage.id,
          key: driver.cardImage.key,
          url: driver.cardImage.url,
          name: driver.cardImage.name,
          size: driver.cardImage.size ? Number(driver.cardImage.size) : undefined,
          type: driver.cardImage.type ?? undefined,
          remark: driver.cardImage.remark ?? undefined,
        }
      : null,
    licenseImage: driver.licenseImage
      ? {
          id: driver.licenseImage.id,
          key: driver.licenseImage.key,
          url: driver.licenseImage.url,
          name: driver.licenseImage.name,
          size: driver.licenseImage.size ? Number(driver.licenseImage.size) : undefined,
          type: driver.licenseImage.type ?? undefined,
          remark: driver.licenseImage.remark ?? undefined,
        }
      : null,
    guarantor: driver.guarantor 
      ? {
          id: driver.guarantor.id,
          fullName: driver.guarantor.fullName,
          phone: driver.guarantor.phone,
          remark: driver.guarantor.remark ?? null,
          cardImageId: driver.guarantor.cardImageId ?? null,
          licenseImageId: driver.guarantor.licenseImageId ?? null,
          cardImage: driver.guarantor.cardImage
            ? {
                id: driver.guarantor.cardImage.id,
                key: driver.guarantor.cardImage.key,
                url: driver.guarantor.cardImage.url,
                name: driver.guarantor.cardImage.name,
                size: driver.guarantor.cardImage.size ? Number(driver.guarantor.cardImage.size) : undefined,
                type: driver.guarantor.cardImage.type ?? undefined,
                remark: driver.guarantor.cardImage.remark ?? undefined,
              }
            : null,
          licenseImage: driver.guarantor.licenseImage
            ? {
                id: driver.guarantor.licenseImage.id,
                key: driver.guarantor.licenseImage.key,
                url: driver.guarantor.licenseImage.url,
                name: driver.guarantor.licenseImage.name,
                size: driver.guarantor.licenseImage.size ? Number(driver.guarantor.licenseImage.size) : undefined,
                type: driver.guarantor.licenseImage.type ?? undefined,
                remark: driver.guarantor.licenseImage.remark ?? undefined,
              }
            : null,
        }
      : null
  }));  

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className='hidden md:block'>
            <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">ข้อมูลลูกค้า</h1>
          </div>
  
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">
              {formatCompactNumber(total)}
            </div>
          </div>
        </header>
  
        <DriverFilters 
          initialSearch={inputSearch}
          initialSort={sort}
        />

        <DriverPageClient initialDrivers={rows} />
      </div>
    </>
  )
}
