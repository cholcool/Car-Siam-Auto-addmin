import prisma from '@/lib/prisma'
import CarSpeedDialClient from '@/components/CarSpeedDialClient'

export default async function SpeedDialContainer() {
  const [vehicleTypes, brands] = await Promise.all([
    prisma.vehicleType.findMany({ orderBy: { name: 'asc' } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' } }),
  ])
  const cars = await prisma.car.findMany({
    where: { isDeleted: false },
    include: { brand: true },
    orderBy: { license: 'asc' },
  })

  return (
    <CarSpeedDialClient
      vehicleTypes={vehicleTypes}
      brands={brands}
      cars={cars.map((car) => ({
        id: car.id,
        label: `${car.brand.name} ${car.model} - ${car.license}`,
      }))}
    />
  )
}
