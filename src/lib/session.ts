import type { Session } from 'next-auth'

export function getRoles(session?: Session | null): string[] {
  const raw = (session as any)?.user?.roles
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map((r) => String(r))
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim())
  return []
}

export function getUserName(session?: Session | null): string {
  return (session as any)?.user?.user_name || (session as any)?.user?.user_email || 'Guest'
}

export function getUserEmail(session?: Session | null): string | undefined {
  return (session as any)?.user?.user_email
}

export function isAdmin(session?: Session | null): boolean {
  const roles = getRoles(session)
  return roles.some((r) => String(r).toLowerCase() === 'admin')
}
