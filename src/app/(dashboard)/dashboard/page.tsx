// import { DashboardHeaderPage } from '@/components/DashboardHeaderPage'
import { DashboardOverviewPage } from '@/components/DashboardOverviewPage'
// import { DashboardStatisticsPage } from '@/components/DashboardStatisticsPage'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export type TabKey = 'overview' | 'reports'

function getTabValue(params: Record<string, string | string[] | undefined>): TabKey {
  const tab = typeof params.tab === 'string' ? params.tab : 'overview'
  return tab === 'reports' ? 'reports' : 'overview'
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const activeTab = getTabValue(params)

  return (
    <div className="space-y-8">
      {/* <DashboardHeaderPage activeTab={activeTab} /> */}

      <DashboardOverviewPage activeTab={activeTab} />

      {/* <DashboardStatisticsPage activeTab={activeTab} /> */}

    </div>
  )
}
