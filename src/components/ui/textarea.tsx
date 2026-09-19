'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({ className, required, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        'block h-24 w-full rounded-sm border border-[#E7E5E4] px-3.5 py-3 text-sm font-medium text-[#1C1917] outline-none transition-colors placeholder:text-[#A8A29E] focus-visible:border-[#6D28D9] focus-visible:ring-2 focus-visible:ring-[#6D28D9]/20',
        required ? "bg-input/30" : "bg-white",
        className
      )}
    />
  )
}

export { Textarea }
