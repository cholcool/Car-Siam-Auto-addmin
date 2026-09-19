'use client'

import { useState } from 'react'
import { ChevronDown, Loader2, Save } from 'lucide-react'
import { Button, Label, Input, Textarea } from '@/components/ui'
import { appInputClass } from '@/lib/ui-format'
import { createCar } from '@/app/dashboard/cars/cars-actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CarStatusOptions, CarStatus } from '@/lib/types'
import CarImageUploader from '@/components/CarImageUploader'

interface VehicleType {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
}

interface CarFormProps {
  vehicleTypes: VehicleType[]
  brands: Brand[]
  onSuccess: () => void
}

// Native <select> restyled to look exactly like appInputClass text inputs,
// with a chevron affordance — matches the approved mobile mockup's select
// fields ("เลือกประเภท" / "เลือกยี่ห้อ").
function FormSelect({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(appInputClass, 'appearance-none pr-9', className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A29E]" aria-hidden="true" />
    </div>
  )
}

export default function CarForm({ vehicleTypes, brands, onSuccess }: CarFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    vehicleTypeId: '',
    brandId: '',
    model: '',
    year: '',
    color: '',
    license: '',
    engine: '',
    chassis: '',
    mileage: '0',
    status: 'Available',
    remark: '',
  })
  const router = useRouter()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!formData.vehicleTypeId) newErrors.vehicleTypeId = 'ประเภทรถเป็นข้อมูลบังคับ'
    if (!formData.brandId) newErrors.brandId = 'ยี่ห้อรถเป็นข้อมูลบังคับ'
    if (!formData.model.trim()) newErrors.model = 'รุ่นรถเป็นข้อมูลบังคับ'
    if (!formData.year || !/^\d{4}$/.test(formData.year)) newErrors.year = 'ปีต้องเป็นตัวเลข 4 หลัก'
    if (!formData.color.trim()) newErrors.color = 'สีรถเป็นข้อมูลบังคับ'
    if (!formData.license.trim()) newErrors.license = 'ทะเบียนรถเป็นข้อมูลบังคับ'
    const mileageNum = parseFloat(formData.mileage)
    if (isNaN(mileageNum) || mileageNum < 0) newErrors.mileage = 'เลขไมล์ต้องเป็นตัวเลขและไม่เป็นลบ'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const result = await createCar({
        vehicleTypeId: formData.vehicleTypeId,
        brandId: formData.brandId,
        model: formData.model.trim(),
        year: formData.year,
        color: formData.color,
        license: formData.license.trim(),
        engine: formData.engine || null,
        chassis: formData.chassis || null,
        mileage: parseFloat(formData.mileage),
        status: formData.status as CarStatus,
        remark: formData.remark || null,
      })

      if (result.success) {
        const carId = result.data?.id
        if (carId && pendingFiles.length > 0) {
          const uploadData = new FormData()
          uploadData.append('carId', carId)
          pendingFiles.forEach((file) => {
            uploadData.append('files', file)
            uploadData.append('originalNames', file.name)
          })
          await fetch('/api/car-images', { method: 'POST', body: uploadData })
        }
        router.refresh()

        setTimeout(() => {
          onSuccess()
        }, 60)
      } else {
        setErrors({ form: result.error || 'เกิดข้อผิดพลาดในการสร้างรถ' })
      }
    } catch {
      setErrors({ form: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='relative flex h-full flex-col overflow-hidden'>
      <div className='overflow-y-auto px-5 py-5 bg-[#FAFAF9]'>
        <div className="space-y-3">
          {errors.form && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {errors.form}
            </div>
          )}

          <div>
            <Label>รูปภาพรถ</Label>
            <CarImageUploader onPendingFilesChange={setPendingFiles} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleTypeId">
                ประเภทรถ <span className="text-[#DC2626]">*</span>
              </Label>
              <FormSelect
                id="vehicleTypeId"
                name="vehicleTypeId"
                value={formData.vehicleTypeId}
                onChange={handleChange}
              >
                <option value="">เลือกประเภท</option>
                {vehicleTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </FormSelect>
              {errors.vehicleTypeId && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.vehicleTypeId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="brandId">
                ยี่ห้อ <span className="text-[#DC2626]">*</span>
              </Label>
              <FormSelect
                id="brandId"
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
              >
                <option value="">เลือกยี่ห้อ</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </FormSelect>
              {errors.brandId && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.brandId}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="model">
              รุ่น <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="model"
              name="model"
              type="text"
              placeholder="เช่น Commutor, Camry"
              value={formData.model}
              onChange={handleChange}
              className={appInputClass}
            />
            {errors.model && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.model}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">
                ปีที่ผลิต <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="year"
                name="year"
                type="text"
                placeholder="2569"
                inputMode="numeric"
                maxLength={4}
                value={formData.year}
                onChange={handleChange}
                className={appInputClass}
              />
              {errors.year && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.year}</p>
              )}
            </div>

            <div>
              <Label htmlFor="color">
                สี <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                id="color"
                name="color"
                type="text"
                placeholder="เช่น ขาว"
                value={formData.color}
                onChange={handleChange}
                className={appInputClass}
              />
              {errors.color && (
                <p className="mt-1 text-xs font-medium text-red-600">{errors.color}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="license">
              ทะเบียนรถ <span className="text-[#DC2626]">*</span>
            </Label>
            <Input
              id="license"
              name="license"
              type="text"
              placeholder="เช่น กข 1234"
              value={formData.license}
              onChange={handleChange}
              className={appInputClass}
            />
            {errors.license && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.license}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="engine">เลขเครื่องยนต์</Label>
              <Input
                id="engine"
                name="engine"
                type="text"
                placeholder="ไม่บังคับ"
                value={formData.engine}
                onChange={handleChange}
                className={appInputClass}
              />
            </div>

            <div>
              <Label htmlFor="chassis">เลขตัวถัง</Label>
              <Input
                id="chassis"
                name="chassis"
                type="text"
                placeholder="ไม่บังคับ"
                value={formData.chassis}
                onChange={handleChange}
                className={appInputClass}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="mileage">เลขไมล์เริ่มต้น</Label>
            <div className="relative">
              <Input
                id="mileage"
                name="mileage"
                type="number"
                placeholder="0"
                min="0"
                value={formData.mileage}
                onChange={handleChange}
                className={cn(appInputClass, 'pr-12 font-bold text-[#1C1917]')}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#78716C]">
                กม.
              </span>
            </div>
            {errors.mileage && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.mileage}</p>
            )}
          </div>

          <div>
            <Label htmlFor="remark">หมายเหตุ</Label>
            <Textarea
              id="remark"
              name="remark"
              placeholder="เพิ่มหมายเหตุเกี่ยวกับรถคันนี้..."
              value={formData.remark}
              onChange={handleChange}
              className="resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">สถานะรถ</Label>
            <FormSelect
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {CarStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 border-t border-[#E7E5E4] bg-white px-5 py-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="h-[52px] w-full rounded-xl bg-[#6D28D9] text-[15px] font-bold text-white shadow-[0_8px_16px_rgba(109,40,217,0.28)] hover:bg-[#5B21B6]"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรถ'}
        </Button>
      </div>
    </form>
  )
}
