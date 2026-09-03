import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 ease-fluid disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-mint focus-visible:outline-offset-2 active:scale-[0.985] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-mint text-mint-ink hover:brightness-110",
        ghost: "bg-card-2 text-ink hover:bg-card-3",
        outline: "border border-line bg-card text-ink hover:bg-card-2 hover:border-card-3",
        quiet: "text-dim hover:text-ink",
      },
      size: {
        default: "h-12 rounded-full px-5 text-sm",
        sm: "h-9 rounded-full px-4 text-[13px]",
        block: "h-13 w-full rounded-full px-5 text-sm",
        icon: "size-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}

/** Вложенный кружок с иконкой внутри кнопки — «button-in-button». */
function ButtonKnob({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "grid size-6.5 place-items-center rounded-full bg-mint-ink/15 transition-transform duration-300 ease-fluid group-hover:translate-x-0.5",
        className
      )}
    >
      {children}
    </span>
  )
}

export { Button, ButtonKnob, buttonVariants }
