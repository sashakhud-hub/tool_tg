import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Toast({ text, open }: { text: string; open: boolean }) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute inset-x-3.5 bottom-22 z-30 flex items-center gap-2.5 rounded-2xl border border-line bg-card-3 px-4 py-3",
        "text-[13.5px] font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-all duration-300 ease-fluid",
        open ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
      )}
    >
      <Check className="size-4 text-mint" />
      {text}
    </div>
  )
}

export { Toast }
