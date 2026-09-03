import * as React from "react"
import { ArrowRight } from "lucide-react"

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

type Slide = { accent: string; tail?: string; note: string }

const SLIDES: Slide[] = [
  { accent: "Здравствуйте, Илья", note: "Это ваш ассистент здоровья" },
  {
    accent: "Начнём с того,",
    tail: "чтобы понять вас",
    note: "Не с анализов и не с анкет на тридцать минут. Сначала — с вашего запроса",
  },
  {
    accent: "Первые выводы —",
    tail: "через 3 минуты",
    note: "Дальше картина уточняется с каждым источником, который вы подключите",
  },
]

/**
 * Интро-сторителлинг перед чатом: три фразы, каждая раскрывается посимвольно.
 * Пропускается одним тапом — это рассказ, а не обязательный туториал.
 */
function IntroStory({ onDone }: { onDone: () => void }) {
  const [step, setStep] = React.useState(0)
  const [leaving, setLeaving] = React.useState(false)
  const slide = SLIDES[step]

  function next() {
    if (step < SLIDES.length - 1) {
      setStep((v) => v + 1)
      return
    }
    setLeaving(true)
    window.setTimeout(onDone, 420)
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex flex-col bg-panel px-6 pb-8 pt-16 transition-all duration-500 ease-fluid",
        leaving && "pointer-events-none -translate-y-4 opacity-0"
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-70"
        style={{ background: "radial-gradient(120% 70% at 50% 0%, rgba(103,224,174,0.18), transparent 70%)" }}
      />

      <div className="relative flex gap-1.5">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-colors duration-500 ease-fluid",
              i <= step ? "bg-mint" : "bg-card-3"
            )}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col justify-center pb-16">
        <h2 className="font-display text-[30px] font-extrabold leading-[1.12] tracking-tight">
          <Reveal key={`a-${step}`} text={slide.accent} />
          {slide.tail && (
            <>
              <br />
              <Reveal key={`b-${step}`} text={slide.tail} className="text-mint" delay={260} />
            </>
          )}
        </h2>
        <p
          key={`n-${step}`}
          className="animate-rise mt-4 max-w-[30ch] text-[15px] leading-relaxed text-dim"
          style={{ animationDelay: "520ms" }}
        >
          {slide.note}
        </p>
      </div>

      <button
        onClick={next}
        className="group relative flex h-14 items-center justify-between rounded-full bg-mint pl-6 pr-2 text-mint-ink transition-transform duration-300 ease-fluid active:scale-[0.985]"
      >
        <span className="font-display text-[15px] font-bold">
          {step < SLIDES.length - 1 ? "Дальше" : "Начать"}
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-mint-ink/15 transition-transform duration-300 ease-fluid group-hover:translate-x-0.5">
          <ArrowRight className="size-4.5" />
        </span>
      </button>

      <button onClick={() => { setLeaving(true); window.setTimeout(onDone, 420) }} className="mt-3 py-2 text-[13px] font-semibold text-dim-2">
        Пропустить
      </button>
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

export { IntroStory, TypingBubble, Milestone, Reveal }
