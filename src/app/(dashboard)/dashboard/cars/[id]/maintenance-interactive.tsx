'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui'
import { MaintenanceRow } from '@/lib/types'

const MaintenanceCreateDrawer = dynamic(() => import('@/components/MaintenanceCreateDrawer'), {
  ssr: false,
  loading: () => (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
      </CardContent>
    </Card>
  ),
})

type Props = {
  carId: string
  carMileage: number
  maintenances: MaintenanceRow[]
}

export default function MaintenanceInteractive({ carId, carMileage, maintenances }: Props) {
  return <MaintenanceCreateDrawer carId={carId} carMileage={carMileage} maintenances={maintenances} />
}
