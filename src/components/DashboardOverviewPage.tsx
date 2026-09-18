import Link from 'next/link'
import {
  Car,
  Users,
  CheckCircle2,
  CalendarDays,
  Plus,
  UserPlus,
  BarChart3,
  Wrench,
  LucideIcon
} from 'lucide-react'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  formatCompactNumber,
  formatBaht,
  formatThaiDate,
  getStatusBadgeClass,
  getStatusLabel,
} from '@/lib/ui-format'
import { cn } from '@/lib/utils'
import { TabKey } from '@/app/dashboard/page'

// ---------------------------------------------------------------------------
// Stat card — icon-in-tinted-box + number + label, laid out in one row to
// mirror the approved mobile mockup's stat card exactly (see
// claude/design-system-alignment-report.md, section 2/3).
// ---------------------------------------------------------------------------
type StatCardProps = {
  href?: string
  title: string
  value: string
  icon: LucideIcon
  iconBoxClassName: string
  iconClassName: string
}

export function StatCard({ href = '/dashboard', title, value, icon: Icon, iconBoxClassName, iconClassName }: StatCardProps) {
  return (
    <Link href={href} className="block">
      <div className="flex justify-between items-center md:gap-3 gap-1 rounded-2xl border border-[#E7E5E4] bg-white py-4 px-2 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_20px_rgba(28,25,23,0.06)] transition-shadow hover:shadow-[0_1px_2px_rgba(28,25,23,0.06),0_12px_24px_rgba(28,25,23,0.1)]">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBoxClassName)}>
          <Icon className={cn('h-[18px] w-[18px]', iconClassName)} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex items-center gap-0.5">
          <div className="text-[22px] font-extrabold leading-none tracking-tight text-[#1C1917]">{value}</div>
          <div className="ml-1 truncate text-xs font-medium text-[#78716C]">{title}</div>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Quick action — solid violet circle for the primary action, outlined
// circles for the rest. Desktop stand-in for the mobile FAB row.
// ---------------------------------------------------------------------------
type QuickActionProps = {
  href: string
  label: string
  icon: LucideIcon
  primary?: boolean
}

function QuickAction({ href, label, icon: Icon, primary = false }: QuickActionProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'flex h-[52px] w-[52px] items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5',
          primary
            ? 'bg-[#6D28D9] text-white shadow-[0_6px_14px_rgba(109,40,217,0.28)]'
            : 'border border-[#E7E5E4] bg-white text-[#44403C] shadow-sm'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={primary ? 2.2 : 1.8} />
      </div>
      <div className="text-center text-[11px] font-medium text-[#44403C]">{label}</div>
    </Link>
  )
}

const CAR_ICON_TONES = [
  { box: 'bg-[#F5F3FF]', icon: 'text-[#7C3AED]' },
  { box: 'bg-[#EFF6FF]', icon: 'text-[#2563EB]' },
  { box: 'bg-[#F0FDF4]', icon: 'text-[#16A34A]' },
]

export async function DashboardOverviewPage({ activeTab }: { activeTab: TabKey }) {
  if (activeTab !== 'overview') return null

  const session = await auth()
  const displayName = session?.user?.name ?? session?.user?.email ?? 'Admin'

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(startOfToday)
  endOfToday.setDate(endOfToday.getDate() + 1)

  const maintenanceDueBefore = new Date(now)
  maintenanceDueBefore.setDate(maintenanceDueBefore.getDate() + 7)

  const [
    totalCars,
    availableCars,
    totalDriver,
    todayBookingsCount,
    recentBookings,
    dueMaintenances,
  ] = await Promise.all([
    prisma.car.count({ where: { isDeleted: false } }),
    prisma.car.count({ where: { isDeleted: false, status: 'Available' } }),
    prisma.driver.count({ where: { isDeleted: false } }),
    prisma.booking.count({
      where: {
        isDeleted: false,
        dateStart: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.booking.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { car: true, driver: true },
    }),
    prisma.maintenance.findMany({
      where: {
        isDeleted: false,
        status: { in: ['Pending', 'Active', 'Overdue'] },
        dateAlert: { lte: maintenanceDueBefore },
      },
      orderBy: { dateAlert: 'asc' },
      take: 1,
      include: { car: true },
    }),
  ])

  const dueMaintenanceCount = dueMaintenances.length > 0
    ? await prisma.maintenance.count({
        where: {
          isDeleted: false,
          status: { in: ['Pending', 'Active', 'Overdue'] },
          dateAlert: { lte: maintenanceDueBefore },
        },
      })
    : 0

  const topDueMaintenance = dueMaintenances[0]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[#78716C]">สวัสดี 👋</p>
        <h1 className="text-lg font-bold text-[#1C1917]">{displayName}</h1>
      </div>

      <section className="grid md:gap-3 gap-1.5 grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/dashboard/cars"
          title="รถทั้งหมด"
          value={formatCompactNumber(totalCars)}
          icon={Car}
          iconBoxClassName="bg-[#F5F3FF]"
          iconClassName="text-[#6D28D9]"
        />
        <StatCard
          href="/dashboard/cars?status=Available"
          title="พร้อมให้เช่า"
          value={formatCompactNumber(availableCars)}
          icon={CheckCircle2}
          iconBoxClassName="bg-[#F0FDF4]"
          iconClassName="text-[#16A34A]"
        />
        <StatCard
          href="/dashboard/driver"
          title="ลูกค้าทั้งหมด"
          value={formatCompactNumber(totalDriver)}
          icon={Users}
          iconBoxClassName="bg-[#EFF6FF]"
          iconClassName="text-[#2563EB]"
        />
        <StatCard
          href="/dashboard/bookings?today=1"
          title="รายการเช่าวันนี้"
          value={formatCompactNumber(todayBookingsCount)}
          icon={CalendarDays}
          iconBoxClassName="bg-[#FFFBEB]"
          iconClassName="text-[#D97706]"
        />
      </section>

      <section className="grid grid-cols-4 gap-2 sm:flex sm:gap-8">
        <QuickAction href="/dashboard/cars?create=1" label="เช่ารถใหม่" icon={Plus} primary />
        <QuickAction href="/dashboard/cars?create=1" label="เพิ่มรถ" icon={Car} />
        <QuickAction href="/dashboard/driver?create=1" label="เพิ่มลูกค้า" icon={UserPlus} />
        <QuickAction href="/dashboard/reports" label="รายงาน" icon={BarChart3} />
      </section>

      {topDueMaintenance && (
        <section className="flex items-start gap-3 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFEDD5]">
            <Wrench className="h-4 w-4 text-[#C2410C]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#9A3412]">
              ถึงกำหนดบำรุงรักษา {formatCompactNumber(dueMaintenanceCount)} คัน
            </div>
            <div className="mt-0.5 text-xs leading-relaxed text-[#C2410C]">
              {topDueMaintenance.car?.model ?? ''}
              {topDueMaintenance.car?.license ? ` (${topDueMaintenance.car.license})` : ''}
              {topDueMaintenance.name ? ` — ${topDueMaintenance.name}` : ''}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#1C1917]">รายการเช่าล่าสุด</h2>
          <Link href="/dashboard/bookings" className="text-xs font-semibold text-[#6D28D9]">
            ดูทั้งหมด
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {recentBookings.length === 0 && (
            <div className="rounded-2xl border border-[#E7E5E4] bg-white p-6 text-center text-sm text-[#78716C]">
              ยังไม่มีรายการเช่า
            </div>
          )}

          {recentBookings.map((booking, index) => {
            const tone = CAR_ICON_TONES[index % CAR_ICON_TONES.length]
            const customerName = booking.driver?.fullName ?? '-'

            return (
              <Link
                key={booking.id}
                href="/dashboard/bookings"
                className="flex items-center gap-3 rounded-2xl border border-[#E7E5E4] bg-white p-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(28,25,23,0.08)]"
              >
                <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', tone.box)}>
                  <Car className={cn('h-5 w-5', tone.icon)} aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-[#1C1917]">{booking.car?.model ?? '-'}</div>
                  <div className="mt-0.5 truncate text-xs text-[#78716C]">
                    {customerName} · {formatThaiDate(booking.dateStart)}–{formatThaiDate(booking.dateEnd)}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="text-sm font-bold text-[#1C1917]">{formatBaht(booking.netAmount)}</div>
                  <span className={getStatusBadgeClass(booking.status)}>{getStatusLabel(booking.status)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
