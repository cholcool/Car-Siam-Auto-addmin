import { Skeleton } from '@/components/ui'

export default function CarDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-6 w-96 max-w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <Skeleton className="h-155 rounded-xl" />
      </div>
    </div>
  )
}
