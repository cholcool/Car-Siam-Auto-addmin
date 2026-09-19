'use client'

import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pencil } from 'lucide-react'

const CarCreateDrawer = dynamic(() => import('@/components/CarCreateDrawer'), { ssr: false })

type VehicleType = { id: string; name: string }
type Brand = { id: string; name: string }
type ExistingImage = { id: string; url: string; name?: string | null }

type Props = {
  carId: string
  vehicleTypes: VehicleType[]
  brands: Brand[]
  initialValues: {
    vehicleTypeId: string
    brandId: string
    model: string
    year: string
    color: string
    license: string
    engine: string
    chassis: string
    mileage: string
    status: string
    remark: string
  }
  initialImages: ExistingImage[]
}

export default function CarEditLauncher({ carId, vehicleTypes, brands, initialValues, initialImages }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = searchParams.get('edit') === '1'

  const openEdit = () => {
    router.push(`/dashboard/cars/${carId}?edit=1`, { scroll: false })
  }

  const closeEdit = () => {
    router.push(`/dashboard/cars/${carId}`, { scroll: false })
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={openEdit}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1C1917]/85 px-3.5 text-[13px] font-semibold text-white backdrop-blur-sm hover:bg-[#1C1917]"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        แก้ไข
      </button>

      {isEditing ? (
        <CarCreateDrawer
          vehicleTypes={vehicleTypes}
          brands={brands}
          onClose={closeEdit}
          mode="edit"
          carId={carId}
          initialValues={initialValues}
          initialImages={initialImages}
        />
      ) : null}
    </>
  )
}
