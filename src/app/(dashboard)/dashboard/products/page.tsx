import prisma from '@/lib/prisma'
import { toNumber } from '@/lib/ui-format'
import ProductsClient from './products-client'
import { ProductRow, ProductsStatusOptions } from '@/lib/types'
import { formatCompactNumber } from '@/lib/ui-format'
import Link from 'next/link'
import ProductsFilters from './filters'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const inputSearch = typeof params.inputSearch === 'string' ? params.inputSearch.trim() : ''
  const sort = typeof params.sort === 'string' ? params.sort : 'newest'
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const pageParam = typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const pageSize = 20
  const status = ProductsStatusOptions.find(status => status.value === statusParam)?.value ?? ''

  const where: any = { isDeleted: false }

  if (inputSearch) {
    where.OR = [
      { name: { contains: inputSearch } },
      { description: { contains: inputSearch } },
      { remark: { contains: inputSearch } },
    ]
  }

  if (status) where.isActive = status === 'active' ? true : false;

  const orderBy: any =
    sort === 'dateEnd'
      ? { dateEnd: 'asc' }
      : sort === 'dateStart'
        ? { dateStart: 'asc' }
        : sort === 'name'
          ? { name: 'asc' }
          : sort === 'price'
          ? { price: 'asc' }
          : sort === 'priceHigh'
            ? { price: 'desc' }
          : { createdAt: 'desc' }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: pageSize,
    skip: (page - 1) * pageSize,
    select: {
      id: true,
      name: true,
      description: true,
      remark: true,
      price: true,
      dateStart: true,
      dateEnd: true,
      dateCount: true,
      isActive: true,
    },
  })
  const totalCount = await prisma.product.count({ where })
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    products_name: product.name,
    products_desc: product.description ?? '',
    products_remark: product.remark ?? '',
    products_price: toNumber(product.price),
    date_start: product.dateStart.toISOString(),
    date_end: product.dateEnd.toISOString(),
    date_count: product.dateCount,
    is_active: product.isActive,
  }))

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className='hidden md:block'>
            <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">ข้อมูลบริการ</h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-bold text-slate-500">ทั้งหมด</div>
            <div className="mt-2 text-3xl font-extrabold text-slate-950">
              {formatCompactNumber(totalCount)}
            </div>
          </div>
        </header>

        <ProductsFilters 
          initialSearch={inputSearch}
          initialStatus={status}
          initialSort={sort}
        />

        <ProductsClient initialProducts={rows} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/60">
            <div className="text-sm font-semibold text-slate-600">
              หน้า {page} จาก {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Link
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : 0}
                href={`/products?inputSearch=${encodeURIComponent(inputSearch)}&status=${status}&sort=${sort}&page=${Math.max(page - 1, 1)}`}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                ก่อนหน้า
              </Link>
              <Link
                aria-disabled={page >= totalPages}
                tabIndex={page >= totalPages ? -1 : 0}
                href={`/products?inputSearch=${encodeURIComponent(inputSearch)}&status=${status}&sort=${sort}&page=${Math.min(page + 1, totalPages)}`}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              >
                ถัดไป
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
