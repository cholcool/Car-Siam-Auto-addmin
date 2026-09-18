import { Prisma } from '@prisma/client'
import { CarStatusOptions } from '@/lib/types'

export type CarListQuery = {
  inputSearch: string
  status: string
}

export function parseCarListQuery(params: Record<string, string | string[] | undefined>): CarListQuery {
  const inputSearch = typeof params.inputSearch === 'string' ? params.inputSearch.trim() : ''
  const statusParam = typeof params.status === 'string' ? params.status : ''
  const status = CarStatusOptions.find((item) => item.value === statusParam)?.value ?? ''

  return { inputSearch, status }
}

export function buildCarWhere(query: CarListQuery) {
  const where: any = { isDeleted: false }

  if (query.inputSearch) {
    where.OR = [
      { model: { contains: query.inputSearch, mode: 'insensitive' } },
      { license: { contains: query.inputSearch, mode: 'insensitive' } },
      { color: { contains: query.inputSearch, mode: 'insensitive' } },
      { engine: { contains: query.inputSearch, mode: 'insensitive' } },
      { chassis: { contains: query.inputSearch, mode: 'insensitive' } },
    ]
  }

  if (query.status) where.status = query.status

  return where
}

export function buildCarOrderBy(sort: string) {
  return (
    sort === 'model'
      ? { model: 'asc' }
      : sort === 'year'
        ? { year: 'desc' }
        : sort === 'mileage'
          ? { mileage: 'asc' }
          : { createdAt: 'desc' }
  ) satisfies Prisma.CarOrderByWithRelationInput
}
