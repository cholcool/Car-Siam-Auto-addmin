"use client"

import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'destructive' | 'outline'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#F5F5F4] text-[#78716C]',
  success: 'bg-[#F0FDF4] text-[#15803D]',
  destructive: 'bg-[#FEF2F2] text-[#B91C1C]',
  outline: 'border border-[#E7E5E4] bg-transparent text-[#44403C]',
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold leading-none whitespace-nowrap',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
