import * as React from "react"
// @ts-expect-error — ассет скилла serega-emotional поставляется как JS
import { seregaEmotional } from "@/lib/serega-emotional.js"
import { cn } from "@/lib/utils"

/** Акцентная фраза: посимвольное раскрытие с подбросом и размытием. */
function Reveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    let instance: { play?: () => void; destroy?: () => void } | null = null
    const id = window.setTimeout(() => {
      instance = seregaEmotional(el, { text })
    }, delay)
    return () => {
      window.clearTimeout(id)
      instance?.destroy?.()
    }
  }, [text, delay])

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
}

/**
 * Реплика-рассказ: акцентная фраза раскрывается посимвольно прямо в ленте.
 * Это то же сообщение бота, только с крупной строкой — сториз не заводим,
 * весь первый опыт остаётся разговором.
 */
function StoryMessage({
  accent,
  tail,
  note,
  first = false,
}: {
  accent: string
  tail?: string
  note?: string
  first?: boolean
}) {
  return (
    <div
      className={cn(
        "animate-rise max-w-[92%] self-start rounded-[24px] rounded-bl-md border border-white/5 bg-card px-4 py-4",
        first && "bg-[linear-gradient(165deg,rgba(103,224,174,0.12),transparent_60%)]"
      )}
    >
      <h2 className="font-display text-[26px] font-extrabold leading-[1.15] tracking-tight">
        <Reveal text={accent} />
        {tail && (
          <>
            <br />
            <Reveal text={tail} className="text-mint" delay={240} />
          </>
        )}
      </h2>
      {note && (
        <p
          className="animate-rise mt-2.5 text-[14px] leading-relaxed text-dim"
          style={{ animationDelay: "480ms" }}
        >
          {note}
        </p>
      )}
    </div>
  )
}

/** Индикатор набора: пауза перед репликой превращает ленту в разговор. */
function TypingBubble() {
  return (
    <div className="animate-rise flex max-w-[86%] items-center gap-1.5 self-start rounded-[20px] rounded-bl-md border border-white/5 bg-card px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-dim"
          style={{ animation: `typing-dot 1.2s ${i * 0.16}s infinite ease-in-out` }}
        />
      ))}
    </div>
  )
}

/**
 * Кульминация сессии: единственный момент, где интерфейс празднует.
 * Показывается один раз — когда данных стало достаточно для риск-профиля.
 */
function Milestone({ value }: { value: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const [drawn, setDrawn] = React.useState(false)

  React.useEffect(() => {
    const id = window.setTimeout(() => setDrawn(true), 120)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div className="animate-rise w-full self-stretch rounded-3xl border border-mint/25 bg-[linear-gradient(160deg,rgba(103,224,174,0.18),transparent_65%)] bg-card p-5 text-center">
      <div className="relative mx-auto w-fit">
        <span
          className="absolute inset-0 rounded-full"
          style={{ animation: "flare 1.4s 300ms cubic-bezier(.32,.72,0,1) both" }}
        />
        <svg width="72" height="72" viewBox="0 0 72 72" role="img" aria-label={`Собрано ${value}%`}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="#26333F" strokeWidth="4" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="#67E0AE"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={drawn ? c * (1 - value / 100) : c}
            transform="rotate(-90 36 36)"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(.32,.72,0,1)" }}
          />
          <text x="36" y="41" textAnchor="middle" fontSize="17" fontWeight="800" fill="#E9F1F8" fontFamily="Onest, sans-serif">
            {value}%
          </text>
        </svg>
      </div>

      <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight">
        <Reveal text="Риск-профиль собран" delay={400} />
      </h3>
      <p className="mx-auto mt-2 max-w-[32ch] text-[13.5px] leading-relaxed text-dim">
        Данных достаточно, чтобы считать риски и давать рекомендации. Дальше каждое дополнение уточняет картину, но ждать
        уже нечего
      </p>
    </div>
  )
}

export { StoryMessage, TypingBubble, Milestone, Reveal }
