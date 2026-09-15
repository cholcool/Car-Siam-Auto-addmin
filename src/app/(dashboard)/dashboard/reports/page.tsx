import PageSetting from '@/app/dashboard/setting/page'
import { DashboardStatisticsPage } from '@/components/DashboardStatisticsPage'

export default async function ReportsPage() {
  const activeTab = 'reports'

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className='hidden md:block'>
          <h1 className="text-4xl font-extrabold tracking-normal text-slate-950">รายงาน</h1>
          {/* <p className="mt-3 text-lg font-bold text-slate-500">ไปยังหน้ารายการเอกสารและการชำระเงิน</p> */}
        </div>
      </header>

      <PageSetting />

      <DashboardStatisticsPage activeTab={activeTab} />

    </div>
  )
}
