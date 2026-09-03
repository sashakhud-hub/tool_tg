import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"

import { cn } from "@/lib/utils"

function Segmented({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="segmented"
      className={cn("flex gap-1 rounded-full bg-card-3 p-1", className)}
      {...props}
    />
  )
}

function SegmentedItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="segmented-item"
      className={cn(
        "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold text-dim transition-colors duration-300 ease-fluid",
        "data-[state=on]:bg-card data-[state=on]:text-ink",
        className
      )}
      {...props}
    />
  )
}

export { Segmented, SegmentedItem }
