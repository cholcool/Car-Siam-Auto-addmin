'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { ChevronRight, ShieldCheck, Wrench, X } from 'lucide-react'
import { MaintenanceRow, MaintenanceType, MaintenanceStatus } from '@/lib/types'
import { sortMaintenancesForAlert } from '@/lib/maintenance-status'
import { formatThaiDate, formatCompactNumber, toNumber, getNotificationLabel } from '@/lib/ui-format'

const MaintenanceCreateDrawer = dynamic(() => import('@/components/MaintenanceCreateDrawer'), { ssr: false })

type Props = {
  carId: string
  carMileage: number
  maintenanceRows: MaintenanceRow[]
  taxRows: MaintenanceRow[]
}

export function toneFor(status: MaintenanceStatus) {
  if (status === 'Overdue' || status === 'Active') {
    return { bg: '#FFF7ED', fg: '#C2410C' }
  }
  return { bg: '#F0FDF4', fg: '#15803D' }
}

export function metaLine(row: MaintenanceRow) {
  const parts: string[] = []
  if (row.mileageTarget) parts.push(`กำหนดที่เลขไมล์ ${formatCompactNumber(toNumber(row.mileageTarget))} กม.`)
  if (row.dateEnd) parts.push(`ครบกำหนด ${formatThaiDate(row.dateEnd)}`)
  else if (row.dateStart) parts.push(`เริ่ม ${formatThaiDate(row.dateStart)}`)
  if (row.mileageAlert) parts.push(`แจ้งเตือนก่อน ${formatCompactNumber(toNumber(row.mileageAlert))} กม.`)
  return parts.length > 0 ? parts.join(' · ') : 'ยังไม่ระบุกำหนด'
}

function PreviewCard({
  row,
  icon,
  onClick,
}: {
  row: MaintenanceRow
  icon: React.ReactNode
  onClick: () => void
}) {
  const tone = toneFor(row.status)
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-sm border border-accent bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-[#FAFAF9]"
    >
      <div className='w-full'>
        <div className='flex items-center gap-3'>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: tone.bg, color: tone.fg }}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-[13.5px] font-bold text-[#1C1917]">{row.name || '-'}</div>
              <span
                className="shrink-0 rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold"
                style={{ background: tone.bg, color: tone.fg }}
              >
                {getNotificationLabel(row.status)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-1 text-[12px] text-[#78716C]">{metaLine(row)}</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#5f3dd1]" aria-hidden="true" />
    </button>
  )
}

function EmptyPreview({ label }: { label: string }) {
  return (
    <div className="rounded-sm border border-dashed border-[#E7E5E4] bg-white p-4 text-center text-[12.5px] text-[#A8A29E]">
      {label}
    </div>
  )
}

export default function MaintenanceHistorySection({ carId, carMileage, maintenanceRows, taxRows }: Props) {
  const [addType, setAddType] = useState<MaintenanceType | null>(null)
  const [popup, setPopup] = useState<'maintenance' | 'tax' | null>(null)

  const nearestMaintenance = [...maintenanceRows].sort(sortMaintenancesForAlert)[0]
  const latestTax = [...taxRows].sort((a, b) => {
    const at = a.dateStart ? new Date(a.dateStart).getTime() : 0
    const bt = b.dateStart ? new Date(b.dateStart).getTime() : 0
    return bt - at
  })[0]

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#1C1917]">ประวัติการบำรุงรักษา</h2>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setAddType('Maintenance')}
          className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#E7E5E4] bg-white text-[12px] font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
        >
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />เพิ่มบำรุงรักษา
        </button>
        <button
          type="button"
          onClick={() => setAddType('Tax')}
          className="flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#E7E5E4] bg-white text-[12px] font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />เพิ่มต่อภาษี/ประกันภัย
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {nearestMaintenance ? (
          <PreviewCard
            row={nearestMaintenance}
            icon={<Wrench className="h-[17px] w-[17px]" aria-hidden="true" />}
            onClick={() => setPopup('maintenance')}
          />
        ) : (
          <EmptyPreview label="ยังไม่มีประวัติการบำรุงรักษา" />
        )}
        {latestTax ? (
          <PreviewCard
            row={latestTax}
            icon={<ShieldCheck className="h-[17px] w-[17px]" aria-hidden="true" />}
            onClick={() => setPopup('tax')}
          />
        ) : (
          <EmptyPreview label="ยังไม่มีประวัติภาษี/ประกันภัย" />
        )}
      </div>

      {addType ? (
        <MaintenanceCreateDrawer
          carId={carId}
          carMileage={carMileage}
          maintenances={[]}
          showList={false}
          startOpen
          presetType={addType}
          onClose={() => setAddType(null)}
        />
      ) : null}

      {popup ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setPopup(null)}
        >
          <div
            className="bg-white w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#E7E5E4] bg-white p-4">
              <h3 className="text-[16px] font-bold text-[#1C1917]">
                {popup === 'maintenance' ? 'ประวัติการบำรุงรักษาทั้งหมด' : 'ประวัติภาษี/ประกันภัยทั้งหมด'}
              </h3>
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#1C1917] hover:bg-[#F5F5F4]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto p-4">
              <MaintenanceCreateDrawer
                carId={carId}
                carMileage={carMileage}
                maintenances={popup === 'maintenance' ? maintenanceRows : taxRows}
                showList
                presetType={popup === 'maintenance' ? 'Maintenance' : 'Tax'}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
