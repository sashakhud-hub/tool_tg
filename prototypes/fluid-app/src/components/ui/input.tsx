import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-card-2 px-3.5 text-sm text-ink outline-none",
        "placeholder:text-dim-2 focus-visible:border-mint disabled:opacity-60",
        className
      )}
      {...props}
    />
  )
}

export { Input }
