import re
path = "src/components/CarForm.tsx"
with open(path) as f:
    src = f.read()

old_imports = """import { createCar } from '@/app/dashboard/cars/cars-actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CarStatusOptions, CarStatus } from '@/lib/types'
import CarImageUploader from '@/components/CarImageUploader'
"""
new_imports = """import { createCar, updateCar } from '@/app/dashboard/cars/cars-actions'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { CarStatusOptions, CarStatus } from '@/lib/types'
import CarImageUploader from '@/components/CarImageUploader'

type ExistingImage = { id: string; url: string; name?: string | null }
"""
if old_imports not in src:
    raise SystemExit("old_imports not found")
src = src.replace(old_imports, new_imports)

old_props = """interface CarFormProps {
  vehicleTypes: VehicleType[]
  brands: Brand[]
  onSuccess: () => void
}
"""
new_props = """interface CarFormProps {
  vehicleTypes: VehicleType[]
  brands: Brand[]
  onSuccess: () => void
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
"""
if old_props not in src:
    raise SystemExit("old_props not found")
src = src.replace(old_props, new_props)

old_sig = """export default function CarForm({ vehicleTypes, brands, onSuccess }: CarFormProps) {
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
  const router = useRouter()"""
new_sig = """export default function CarForm({ vehicleTypes, brands, onSuccess, mode = 'create', carId, initialValues, initialImages = [] }: CarFormProps) {
  const isEdit = mode === 'edit'
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [formData, setFormData] = useState(
    initialValues ?? {
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
    }
  )
  const router = useRouter()"""
if old_sig not in src:
    raise SystemExit("old_sig not found")
src = src.replace(old_sig, new_sig)

old_submit = """    setErrors({})
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
  }"""
new_submit = """    setErrors({})
    setIsLoading(true)

    try {
      const payload = {
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
      }

      const result = isEdit && carId
        ? await updateCar({ carId, ...payload })
        : await createCar(payload)

      if (result.success) {
        const newCarId = isEdit ? carId : result.data?.id
        if (!isEdit && newCarId && pendingFiles.length > 0) {
          const uploadData = new FormData()
          uploadData.append('carId', newCarId)
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
        setErrors({ form: result.error || (isEdit ? 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลรถ' : 'เกิดข้อผิดพลาดในการสร้างรถ') })
      }
    } catch {
      setErrors({ form: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setIsLoading(false)
    }
  }"""
if old_submit not in src:
    raise SystemExit("old_submit not found")
src = src.replace(old_submit, new_submit)

old_uploader = """          <div>
            <Label>รูปภาพรถ</Label>
            <CarImageUploader onPendingFilesChange={setPendingFiles} />
          </div>"""
new_uploader = """          <div>
            <Label>รูปภาพรถ</Label>
            {isEdit && carId ? (
              <CarImageUploader carId={carId} initialImages={initialImages} onUploaded={() => router.refresh()} />
            ) : (
              <CarImageUploader onPendingFilesChange={setPendingFiles} />
            )}
          </div>"""
if old_uploader not in src:
    raise SystemExit("old_uploader not found")
src = src.replace(old_uploader, new_uploader)

old_btn = """          {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรถ'}"""
new_btn = """          {isLoading ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลรถ'}"""
if old_btn not in src:
    raise SystemExit("old_btn not found")
src = src.replace(old_btn, new_btn)

with open(path, "w") as f:
    f.write(src)
print("OK")
