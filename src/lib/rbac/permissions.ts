import { NextResponse } from 'next/server'

export function hasAnyRole(userRoles: string[] | undefined, allowed: string[]) {
  if (!userRoles || userRoles.length === 0) return false
  return allowed.some((r) => userRoles.includes(r))
}

export function requireRoles(userRoles: string[] | undefined, allowed: string[]) {
  if (!hasAnyRole(userRoles, allowed)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  return null
}
