import * as React from "react"

import { cn } from "@/lib/utils"

/** Реплика ассистента. */
function BotMessage({ lead, children, sub, className }: {
  lead?: React.ReactNode
  children?: React.ReactNode
  sub?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "animate-rise max-w-[86%] self-start rounded-[20px] rounded-bl-md border border-white/5 bg-card px-4 py-3.5 text-[14.5px] leading-normal",
        className
      )}
    >
      {lead != null && (
        <span className="mb-1.5 block font-display text-[17px] font-bold tracking-tight">{lead}</span>
      )}
      {children}
      {sub != null && <span className="mt-2 block text-[13.5px] text-dim">{sub}</span>}
    </div>
  )
}

/** Реплика пользователя. */
function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-rise max-w-[86%] self-end rounded-[20px] rounded-br-md bg-mint px-4 py-2.5 text-[14.5px] font-semibold text-mint-ink">
      {children}
    </div>
  )
}

/** Инсайт после шага: вывод и уточнение. */
function Insight({ headline, detail }: { headline: string; detail: string }) {
  return (
    <div className="mt-2.5 flex flex-col gap-0.5 border-l-2 border-mint pl-3">
      <b className="text-sm font-semibold">{headline}</b>
      <span className="text-[13px] text-dim">{detail}</span>
    </div>
  )
}

/** Поясняющая строка «почему так» — синим, отдельно от основного текста. */
function WhyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-sky/8 px-3 py-2.5 text-[12.5px] leading-snug text-sky">
      <span aria-hidden>◆</span>
      <span>{children}</span>
    </div>
  )
}

export { BotMessage, UserMessage, Insight, WhyNote }
