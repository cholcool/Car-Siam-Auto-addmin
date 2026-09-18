import { cn } from "@/lib/utils";

export const appSurfaceClass =
  "rounded-2xl border border-[#E7E5E4] bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_20px_rgba(28,25,23,0.06)]";

export const appInputClass =
  "h-11 rounded-xl border border-[#E7E5E4] bg-white px-3.5 text-sm font-medium text-[#1C1917] shadow-sm outline-none transition-colors placeholder:text-[#A8A29E] focus-visible:border-[#6D28D9] focus-visible:ring-2 focus-visible:ring-[#6D28D9]/20";

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function formatBaht(value: unknown) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatCompactNumber(value: unknown) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(toNumber(value));
}

export function formatThaiDate(value?: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return `${day}/${month}/${year}`;
}

export function getStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    Active: "ใช้งาน",
    Available: "ว่าง",
    Booked: "จองแล้ว",
    Cancelled: "ยกเลิก",
    Confirmed: "ยืนยันแล้ว",
    Completed: "เสร็จสิ้น",
    Failed: "ล้มเหลว",
    InActive: "ไม่ใช้งาน",
    InProgress: "กำลังเช่า",
    Insurance: "ประกันภัย",
    Maintenance: "บำรุงรักษา",
    Paid: "ชำระเงินแล้ว",
    Pending: "รอดำเนินการ",
    Reserved: "กำลังจอง",
    Rejected: "ถูกปฏิเสธ",
    Refunded: "คืนเงิน",
    Rented: "มีคนเช่าอยู่",
    ReturningSoon: "ใกล้คืนรถ",
    PartialPaid: "ชำระบางส่วน",
    Tax: "ภาษี",
    Unavailable: "ไม่พร้อมใช้",
  };

  return status ? labels[status] ?? status : "Unknown";
}

export function getNotificationLabel(status?: string | null) {
  const labels: Record<string, string> = {
    Active: "แจ้งเตือน",
    Complete: "เสร็จสิ้น",
    Pending: "รอแจ้งเตือน",
    Overdue: "เกินกำหนด",
  };

  return status ? labels[status] ?? status : "Unknown";
}

/**
 * Status → color-group mapping, aligned with the status pill palette in
 * the approved mobile mockup (see claude/design-system-alignment-report.md,
 * section 2.1). Every group renders as `text-<fg> bg-<bg>` pill.
 */
type StatusColorGroup =
  | "pending"
  | "inprogress"
  | "completed"
  | "available"
  | "booked"
  | "maintenance"
  | "returning"
  | "cancelled";

const STATUS_GROUP_MAP: Record<string, StatusColorGroup> = {
  pending: "pending",
  reserved: "pending",
  booked: "booked",
  confirmed: "inprogress",
  inprogress: "inprogress",
  rented: "inprogress",
  active: "available",
  available: "available",
  paid: "completed",
  completed: "completed",
  complete: "completed",
  refunded: "completed",
  maintenance: "maintenance",
  inactive: "maintenance",
  returningsoon: "returning",
  partialpaid: "returning",
  cancelled: "cancelled",
  rejected: "cancelled",
  failed: "cancelled",
  unavailable: "cancelled",
};

const STATUS_GROUP_CLASS: Record<StatusColorGroup, string> = {
  pending: "text-[#B45309] bg-[#FFFBEB]",
  inprogress: "text-[#1D4ED8] bg-[#EFF6FF]",
  completed: "text-[#15803D] bg-[#F0FDF4]",
  available: "text-[#15803D] bg-[#F0FDF4]",
  booked: "text-[#B45309] bg-[#FFFBEB]",
  maintenance: "text-[#78716C] bg-[#F5F5F4]",
  returning: "text-[#C2410C] bg-[#FFF7ED]",
  cancelled: "text-[#B91C1C] bg-[#FEF2F2]",
};

export function getStatusColorGroup(status?: string | null): StatusColorGroup {
  const normalized = (status ?? "").toLowerCase().replace(/\s+/g, "");
  return STATUS_GROUP_MAP[normalized] ?? "maintenance";
}

export function getStatusBadgeClass(status?: string | null, className?: string) {
  const group = getStatusColorGroup(status);

  return cn(
    "inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold leading-none whitespace-nowrap",
    STATUS_GROUP_CLASS[group],
    className
  );
}
