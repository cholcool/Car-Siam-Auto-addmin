import { Prisma, CarStatus as PrismaCarStatus } from '@prisma/client'
import { getStatusLabel } from '@/lib/ui-format'

export type CarStatus = PrismaCarStatus

export const CarStatusOptions = [
  { value: PrismaCarStatus.Available, label: getStatusLabel(PrismaCarStatus.Available) },
  { value: PrismaCarStatus.Booked, label: getStatusLabel(PrismaCarStatus.Booked) },
  { value: PrismaCarStatus.Rented, label: getStatusLabel(PrismaCarStatus.Rented) },
  { value: PrismaCarStatus.Unavailable, label: getStatusLabel(PrismaCarStatus.Unavailable) },
  { value: PrismaCarStatus.ReturningSoon, label: getStatusLabel(PrismaCarStatus.ReturningSoon) },
] as const

export const CarStatusFilterOptions = [
  { value: PrismaCarStatus.Available, label: getStatusLabel(PrismaCarStatus.Available) },
  { value: PrismaCarStatus.Booked, label: getStatusLabel(PrismaCarStatus.Booked) },
  { value: PrismaCarStatus.Rented, label: getStatusLabel(PrismaCarStatus.Rented) },
] as const

export type CarsRow = Prisma.CarGetPayload<{
  include: {
    brand: true,
    vehicleType: true,
    maintenances: true,
    images: {
      include: {
        image: true
      }
    }
  }
}>
