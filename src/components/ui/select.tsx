"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "block h-8 w-full rounded-xl border border-[#E7E5E4] bg-white px-3.5 text-sm font-medium text-[#1C1917] shadow-sm outline-none transition-colors focus-visible:border-[#6D28D9] focus-visible:ring-2 focus-visible:ring-[#6D28D9]/20",
      className
    )}
    {...props}
  />
));

Select.displayName = "Select";

export default Select;
