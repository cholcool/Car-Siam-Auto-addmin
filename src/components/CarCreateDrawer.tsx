'use client'

import { ChevronLeft } from 'lucide-react'
import { useEffect } from 'react'
import CarForm from '@/components/CarForm'

interface VehicleType {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

type ExistingImage = { id: string; url: string; name?: string | null }

interface DrawerProps {
  vehicleTypes: VehicleType[]
  brands: Brand[]
  onClose: () => void
  mode?: 'create' | 'edit'
  carId?: string
  initialValues?: {
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
  initialImages?: ExistingImage[]
}

export default function CarCreateDrawer({
  vehicleTypes,
  brands,
  onClose,
  mode = 'create',
  carId,
  initialValues,
  initialImages,
}: DrawerProps) {
  const isEdit = mode === 'edit'

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[2px] my-0"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex shrink-0 items-center gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="ย้อนกลับ"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#1C1917] hover:bg-[#F5F5F4]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <h2 className="text-[19px] font-extrabold text-[#1C1917]">
            {isEdit ? 'แก้ไขข้อมูลรถ' : 'สร้างรถใหม่เข้าระบบ'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <CarForm
            vehicleTypes={vehicleTypes}
            brands={brands}
            onSuccess={onClose}
            mode={mode}
            carId={carId}
            initialValues={initialValues}
            initialImages={initialImages}
          />
        </div>
      </aside>
    </>
  )
}
