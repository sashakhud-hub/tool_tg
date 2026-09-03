import * as React from "react"

import { cn } from "@/lib/utils"

/** Строка-вариант: иконка, текст, хвост. Используется в списках анкет, файлов, устройств. */
function ChoiceRow({
  icon,
  title,
  note,
  tail,
  highlight = false,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "title"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  note?: React.ReactNode
  tail?: React.ReactNode
  highlight?: boolean
}) {
  const interactive = typeof props.onClick === "function"
  return (
    <button
      type="button"
      data-slot="choice-row"
      disabled={!interactive || props.disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-300 ease-fluid",
        highlight
          ? "border border-mint/20 bg-gradient-to-b from-mint/10 to-mint/4"
          : "bg-card-2",
        interactive && !props.disabled && "hover:bg-card-3",
        !interactive && "cursor-default",
        className
      )}
      {...props}
    >
      {icon != null && (
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-card-3 text-sm">{icon}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold leading-snug text-ink">{title}</span>
        {note != null && <span className="mt-0.5 block text-[11.5px] text-dim">{note}</span>}
      </span>
      {tail != null && <span className="ml-auto shrink-0 text-xs text-dim-2">{tail}</span>}
    </button>
  )
}

/** Плитка множественного выбора с галочкой в углу. */
function ChoiceTile({
  icon,
  title,
  note,
  selected = false,
  locked = false,
  wide = false,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "title"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  note?: React.ReactNode
  selected?: boolean
  locked?: boolean
  wide?: boolean
}) {
  return (
    <button
      type="button"
      data-slot="choice-tile"
      aria-pressed={selected}
      disabled={locked || props.disabled}
      className={cn(
        "relative flex flex-col gap-1.5 rounded-2xl border-[1.5px] p-3 text-left transition-colors duration-300 ease-fluid",
        selected ? "border-mint bg-mint/10" : "border-transparent bg-card-2",
        !locked && "hover:bg-card-3",
        locked && "cursor-not-allowed opacity-60 hover:bg-card-2",
        wide ? "col-span-2 flex-row items-center gap-2.5" : "min-h-26",
        className
      )}
      {...props}
    >
      {!locked && (
        <span
          className={cn(
            "absolute right-3 top-3 grid size-4.5 place-items-center rounded-full border-[1.5px] text-[10px]",
            selected ? "border-mint bg-mint text-mint-ink" : "border-line text-transparent"
          )}
        >
          ✓
        </span>
      )}
      {icon != null && <span className="text-lg">{icon}</span>}
      <span className={cn(wide && "flex-1")}>
        <span className="block text-[13.5px] font-semibold leading-snug text-ink">{title}</span>
        {note != null && <span className={cn("block text-[11.5px] leading-snug text-dim", !wide && "mt-1")}>{note}</span>}
      </span>
    </button>
  )
}

export { ChoiceRow, ChoiceTile }
