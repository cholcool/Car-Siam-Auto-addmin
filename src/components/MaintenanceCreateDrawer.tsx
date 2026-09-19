'use client'

import { useMemo, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, X } from 'lucide-react'
import { Button, Card, CardContent, Input, Textarea, Select } from '@/components/ui'
import { formatCompactNumber, toNumber, getNotificationLabel } from '@/lib/ui-format'
import { completeMaintenance, createMaintenance, deleteMaintenance, updateMaintenance } from '@/app/dashboard/cars/maintenance-actions'
import { AlertDialogDestructive } from '@/components/AlertDialogDestructive'
import { MaintenanceStatus, MaintenanceProps, MaintenanceRow, MaintenanceType } from '@/lib/types'
import { resolveMaintenanceStatus } from '@/lib/maintenance-status'
import { metaLine, toneFor } from '@/app/(dashboard)/dashboard/cars/[id]/maintenance-history-section'

export function statusClass(status: MaintenanceStatus) {
  if (status === 'Overdue') return 'bg-rose-100 text-rose-700'
  if (status === 'Active') return 'bg-blue-100 text-blue-700'
  if (status === 'Complete') return 'bg-emerald-100 text-emerald-700'
  return 'bg-amber-100 text-amber-700'
}

export default function MaintenanceCreateDrawer({
  carId,
  carMileage,
  carOptions = [],
  maintenances,
  variant = 'page',
  showList = true,
  onClose,
  presetType,
  startOpen = false,
}: MaintenanceProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(variant === 'modal' || startOpen)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectCarMileage, setSelectCarMileage] = useState(carMileage ?? 0)
  const [selectedCarId, setSelectedCarId] = useState(carId ?? '')
  const emptyForm = {
    maintenanceId: '',
    type: (presetType ?? 'Maintenance') as MaintenanceType,
    name: '',
    description: '',
    remark: '',
    status: 'Pending' as MaintenanceStatus,
    mileage: String(selectCarMileage ?? 0),
    mileageTarget: '0',
    mileageAlert: '0',
    dateAlert: '',
    dateStart: '',
    dateEnd: '',
    dateCount: 0,
  }
  const [formData, setFormData] = useState(emptyForm)

  const isEdit = Boolean(formData.maintenanceId)

  const title = useMemo(() => (isEdit ? 'แก้ไขการบำรุงรักษา' : 'เพิ่มการบำรุงรักษา'), [isEdit])
  
  function calculateDateCount(startStr: string, endStr: string): number {
    if (!startStr || !endStr) return 0;
  
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
  
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const timeDiff = endDate.getTime() - startDate.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return dayDiff >= 0 ? dayDiff : 0;
    }
    
    return 0;
  };
  
  const formatDateString = (dateInput: any) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };
  
  const openEdit = (row: MaintenanceRow) => {
    const formattedStart = formatDateString(row.dateStart);
    const formattedEnd = formatDateString(row.dateEnd);

    setFormData({
      maintenanceId: row.id,
      type: row.type ?? 'Maintenance',
      name: row.name ?? '',
      description: row.description ?? '',
      remark: row.remark ?? '',
      status: row.status ?? 'Pending',
      mileage: String(row.mileage ?? 0),
      mileageTarget: String(row.mileageTarget ?? 0),
      mileageAlert: String(row.mileageAlert ?? 0),
      dateAlert: row.dateAlert ?? '',
      dateStart: formattedStart,
      dateEnd: formattedEnd,
      dateCount: Number(calculateDateCount(formattedStart, formattedEnd) ?? 0),
    })
    setSelectedCarId(carId ?? '')
    setSelectCarMileage(carMileage ?? 0)
    setIsOpen(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    
    setFormData((prev) => {
      const updatedForm = { ...prev, [name]: value };

      if (name === 'dateStart' || name === 'dateEnd') {
        updatedForm.dateCount = calculateDateCount(updatedForm.dateStart, updatedForm.dateEnd);
      }

      if (name === 'dateStart' || name === 'dateEnd' || name === 'mileageAlert' || name === 'mileageTarget') {
        updatedForm.status = resolveMaintenanceStatus({
          status: updatedForm.status,
          dateStart: updatedForm.dateStart,
          dateEnd: updatedForm.dateEnd,
          mileageAlert: Number(updatedForm.mileageAlert || 0),
          mileageTarget: Number(updatedForm.mileageTarget || 0),
          currentMileage: Number(updatedForm.mileage || 0),
        })
      }
  
      return updatedForm;
    });

    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!formData.type) next.type = 'ประเภทงานเป็นข้อมูลบังคับ'
    if (!formData.name.trim()) next.name = 'ชื่อรายการเป็นข้อมูลบังคับ'
    if (!formData.status) next.status = 'สถานะเป็นข้อมูลบังคับ'
    // if (!formData.dateStart) next.dateStart = 'วันที่เริ่มต้นเป็นข้อมูลบังคับ'
    // if (!formData.dateEnd) next.dateEnd = 'วันที่สิ้นสุดเป็นข้อมูลบังคับ'
    return next
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const nextErrors = validate()

    if (variant === 'modal' && !selectedCarId) nextErrors.carId = 'กรุณาเลือกรถ'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    startTransition(async () => {
      const formattedStart = formatDateString(formData.dateStart);
      const formattedEnd = formatDateString(formData.dateEnd);
      const payload = {
        carId: selectedCarId || carId || '',
        maintenanceId: formData.maintenanceId || undefined,
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        remark: formData.remark.trim() || null,
        status: resolveMaintenanceStatus({
          status: formData.status,
          dateStart: formattedStart,
          dateEnd: formattedEnd,
          mileageAlert: Number(formData.mileageAlert || 0),
          mileageTarget: Number(formData.mileageTarget || 0),
          currentMileage: Number(formData.mileage || 0),
        }),
        mileage: Number(formData.mileage || 0),
        mileageTarget: Number(formData.mileageTarget || 0),
        mileageAlert: Number(formData.mileageAlert || 0),
        dateAlert: formData.dateAlert || null,
        dateStart: formattedStart,
        dateEnd: formattedEnd,
        dateCount: Number(calculateDateCount(formattedStart, formattedEnd) || 0),
      }

      const result = formData.maintenanceId
        ? await updateMaintenance(payload)
        : await createMaintenance(payload)

      if (!result.success) {
        setErrors({ form: result.error || 'บันทึกข้อมูลไม่สำเร็จ' })
        return
      }

      handleClose(false)
      router.refresh()
    })
  }

  const handleDelete = (maintenanceId: string) => {
    startTransition(async () => {
      const result = await deleteMaintenance(maintenanceId)
      if (!result.success) {
        setErrors({ form: result.error || 'ลบข้อมูลไม่สำเร็จ' })
        return
      }
      router.refresh()
    })
  }

  const handleComplete = (maintenanceId: string) => {
    startTransition(async () => {
      const result = await completeMaintenance(maintenanceId)
      if (!result.success) {
        setErrors({ form: result.error || 'ปิดการแจ้งเตือนไม่สำเร็จ' })
        return
      }
      router.refresh()
    })
  }

  const handleClose = (force: boolean) => {
    setIsOpen(force)
    setFormData(emptyForm)
    setErrors({})
    onClose?.()
  }
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <>
      {showList ? (
        <>
        {maintenances.length > 0 ? (
          maintenances.map((row) => {
            const tone = toneFor(row.status)
            return (
              <button 
                onClick={() => openEdit(row)} 
                key={row.id}
                type="button"
                className='flex w-full items-end justify-between rounded-sm border border-accent bg-white py-3 px-2 mb-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-[#FAFAF9]'
              >
                <div className='w-full'>
                  <div className='flex items-center gap-3'>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: tone.bg, color: tone.fg }}
                    >
                      <Wrench className="h-4.25 w-4.25" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-[13.5px] font-bold text-[#1C1917]">{row.name || '-'}</div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.75 text-[10.5px] font-semibold"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {getNotificationLabel(row.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 text-[12px] text-[#78716C]">{metaLine(row)}</div>
                </div>
                <AlertDialogDestructive onClick={() => handleDelete(row.id)} variant={'destructive'} />
              </button>
            )
          })) : (
            <>
            <Card>
              <CardContent className="py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3FF] text-[#6D28D9]">
                  <Wrench className="h-7 w-7" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-xl font-extrabold text-[#1C1917]">ไม่มีประวัติการบำรุงรักษา</h2>
              </CardContent>
            </Card>
            </>
          )}
        </>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <button
            type="button"
            className="fixed inset-0 bg-slate-950/30"
            onClick={() => handleClose(false)}
          />
          <aside className="fixed right-0 top-0 h-dvh w-full max-w-full overflow-y-auto overflow-x-hidden bg-white shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-6">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-950">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">การแจ้งเตือนจะเลียงลำดับจากวันที่แจ้งเตือนขึ้นก่อนเลขไมล์</p>
              </div>
              <button type="button" onClick={() => handleClose(false)} className="rounded-full border border-slate-200 p-2">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {errors.form && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{errors.form}</div>
              )}

              {(formData.status === 'Active') || (formData.status === 'Overdue') ? (
                <div className="mb-4 rounded-lg bg-amber-50 p-4 text-sm font-medium text-amber-700">
                  <div className="font-bold">แจ้งเตือน: งานนี้ยังไม่เสร็จสิ้น</div>
                  <div>คุณสามารถปิดงานนี้ได้โดยคลิกที่ปุ่ม &quot;ปิดงาน&quot; ในด้านล่าง</div>
                  <br />
                  <AlertDialogDestructive 
                    onClick={() => handleComplete(formData.maintenanceId)} 
                    title='ต้องการปิดงานนี้ใช่หรือไม่?' 
                    description='คุณแน่ใจหรือไม่ว่าต้องการปิดงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้.'
                    variant={'notification'} 
                    size={'lg'}
                    iconText={'ปิดงาน'}
                  />
                </div>
              ) : null}
              
              {variant === 'modal' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">เลือกรถ <span className="text-red-600">*</span></label>
                  <Select value={selectedCarId} onChange={(event: any) => setSelectedCarId(event.target.value)}>
                    <option value="">-- เลือกรถ --</option>
                    {carOptions.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.label}
                      </option>
                    ))}
                  </Select>
                  {errors.carId ? <p className="text-xs text-red-600">{errors.carId}</p> : null}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ประเภทงาน <span className="text-red-600">*</span></label>
                  <Select name="type" value={formData.type} onChange={handleChange}>
                    {MaintenanceType.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.type ? <p className="text-xs text-red-600">{errors.type}</p> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">สถานะ <span className="text-red-600">*</span></label>
                  <Input name="status" value={getNotificationLabel(formData.status)} readOnly />
                  {errors.status ? <p className="text-xs text-red-600">{errors.status}</p> : null}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">ชื่อรายการ <span className="text-red-600">*</span></label>
                <Input name="name" value={formData.name} onChange={handleChange} maxLength={255} />
                {errors.name ? <p className="text-xs text-red-600">{errors.name}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">รายละเอียด</label>
                <Input name="description" value={formData.description} onChange={handleChange} maxLength={255} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">หมายเหตุ</label>
                <Textarea name="remark" value={formData.remark} onChange={handleChange} maxLength={500} rows={3} />
              </div>

              <br />
              <b>การแจ้งเตือนด้วยวันที่</b>
              <hr />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 hidden">
                  <label className="text-sm font-semibold text-slate-700">วันที่แจ้งเตือน</label>
                  <Input name="dateAlert" type="date" value={formData.dateAlert} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">วันที่เริ่มต้นแจ้งเตือน</label>
                  <Input name="dateStart" type="date" value={formData.dateStart} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">วันที่สิ้นสุดแจ้งเตือน</label>
                  <Input name="dateEnd" type="date" value={formData.dateEnd} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2 hidden">
                <label className="text-sm font-semibold text-slate-700">จำนวนวันที่แจ้งเตือน</label>
                <Input name="dateCount" type="number" min="0" value={formData.dateCount} onChange={handleChange} readOnly />
              </div>

              <br />
              <b>การแจ้งเตือนด้วยเลขไมล์</b>
              <hr />

              <div className='rounded-2xl border border-slate-200 p-4'>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-500">
                    <div className="font-bold text-slate-950">เลขไมล์ล่าสุดของรถ</div>
                    <div>{formatCompactNumber(toNumber(formData.mileage))}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">กำหนดเช็กระยะที่เลขไมล์</label>
                  <Input name="mileageTarget" type="number" step="0" value={formData.mileageTarget} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">แจ้งเตือนเลขไมล์ล่วงหน้า</label>
                  <Input name="mileageAlert" type="number" step="0" value={formData.mileageAlert} onChange={handleChange} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="save" className="flex-1" disabled={isPending}>
                  บันทึก
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  )
}
