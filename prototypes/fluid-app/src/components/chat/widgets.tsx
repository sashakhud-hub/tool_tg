import * as React from "react"
import { ArrowRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, ButtonKnob } from "@/components/ui/button"
import { Card, CardBezel, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Segmented, SegmentedItem } from "@/components/ui/segmented"
import { cn } from "@/lib/utils"

/** Обёртка любого виджета в ленте чата. */
function Widget({
  title,
  description,
  badge,
  children,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("animate-rise w-full self-stretch", className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description != null && <CardDescription>{description}</CardDescription>}
        </div>
        {badge != null && <div className="ml-auto shrink-0">{badge}</div>}
      </CardHeader>
      {children}
    </Card>
  )
}

type Reco = { title: string; note: string }

/** Виджет результатов. Два состояния: новичок и действующий пользователь. */
function ResultWidget({
  mode,
  completeness,
  goal,
  onOpen,
}: {
  mode: "novice" | "returning"
  completeness: number
  goal: string
  onOpen?: () => void
}) {
  const novice = mode === "novice"
  const recos: Reco[] = novice
    ? [
        { title: "Ложитесь до 00:30 пять дней подряд", note: "Самый быстрый способ поднять ресурс при вашей цели" },
        { title: "Сдайте ферритин и витамин D", note: "Оба показателя объясняют усталость чаще остального" },
      ]
    : [
        { title: "Держите отбой до 00:30", note: "Работает: ресурс вырос на 9% за две недели" },
        { title: "Пересдайте ферритин", note: "Прошлый замер 24 нг/мл, с тех пор 3 месяца" },
        { title: "Добавьте 2 тыс шагов в день", note: "До целевой активности не хватает немного" },
      ]

  return (
    <CardBezel className="animate-rise w-full self-stretch">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full rounded-3xl border border-mint/20 bg-[linear-gradient(165deg,rgba(103,224,174,0.16),rgba(134,182,255,0.08)_58%,transparent)] bg-card-2 p-4 text-left transition-colors duration-300 ease-fluid hover:border-mint/40"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim-2">
          {novice ? "Первые выводы" : "Изменения с прошлого раза"}
        </span>

        <div className="mt-2 flex items-baseline gap-2.5">
          <span className="font-display text-[38px] font-extrabold leading-none tracking-tight tabular-nums">
            {completeness}%
          </span>
          <span className="text-sm text-dim">
            данных собрано{novice ? "" : " · +14% за неделю"}
          </span>
        </div>

        <Progress value={completeness} className="mt-2.5" />

        <p className="mt-2.5 text-[13px] text-dim">
          {novice
            ? `Этого хватает для первых рекомендаций по цели «${goal}». Точность вырастет, когда добавите анализы`
            : `Риск-профиль пересобран. По цели «${goal}» две метрики улучшились, одна требует внимания`}
        </p>

        <div className="mt-3">
          {recos.map((r, i) => (
            <div key={r.title} className={cn("flex gap-2.5 py-3", i > 0 && "border-t border-white/7")}>
              <span className="grid size-5.5 shrink-0 place-items-center rounded-lg bg-card-3 text-[11px] font-bold text-mint">
                {i + 1}
              </span>
              <span>
                <b className="block text-[13.5px] font-semibold">{r.title}</b>
                <span className="mt-0.5 block text-xs text-dim">{r.note}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/7 pt-3 text-[13.5px] font-semibold text-mint">
          <span>Открыть риск-профиль</span>
          <ArrowRight className="size-4 transition-transform duration-300 ease-fluid group-hover:translate-x-0.5" />
        </div>
      </button>
    </CardBezel>
  )
}

type SeriesKey = "steps" | "sleep" | "energy"

const SERIES: Record<
  SeriesKey,
  { vals: number[]; unit: string; hero: string; delta: string; dir: "up" | "down"; max: number; note: string; scale: [string, string] }
> = {
  steps: {
    vals: [6.2, 7.4, 5.1, 8.9, 9.6, 4.2, 3.8, 7.1, 8.4, 9.9, 10.6, 6.4, 8.8, 11.2],
    unit: "тыс шагов в день",
    hero: "8,1",
    delta: "+12% к прошлой неделе",
    dir: "up",
    max: 12,
    note: "Цель — 10 тыс",
    scale: ["0", "12"],
  },
  sleep: {
    vals: [6.4, 6.1, 5.4, 7.2, 6.8, 5.9, 6.0, 6.6, 7.4, 7.1, 6.2, 5.8, 7.0, 7.3],
    unit: "ч сна за ночь",
    hero: "6,5",
    delta: "−4% к прошлой неделе",
    dir: "down",
    max: 9,
    note: "Норма — 7–9 ч",
    scale: ["0", "9"],
  },
  energy: {
    vals: [52, 48, 41, 63, 67, 44, 39, 58, 71, 74, 69, 55, 72, 78],
    unit: "из 100 · дневной ресурс",
    hero: "59",
    delta: "+9% к прошлой неделе",
    dir: "up",
    max: 100,
    note: "Считается по сну и пульсу",
    scale: ["0", "100"],
  },
}

/** Динамика показателя за 14 дней. */
function DynamicsWidget() {
  const [key, setKey] = React.useState<SeriesKey>("steps")
  const s = SERIES[key]

  const W = 300
  const H = 108
  const pad = 6
  const pts = s.vals.map((v, i) => {
    const x = pad + (i * (W - 2 * pad)) / (s.vals.length - 1)
    const y = H - pad - (v / s.max) * (H - 2 * pad)
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  const area = `${line} L ${W - pad} ${H - pad} L ${pad} ${H - pad} Z`
  const last = pts[pts.length - 1]

  return (
    <Widget title="Активность" description="14 дней">
      <Segmented
        type="single"
        value={key}
        onValueChange={(v) => v && setKey(v as SeriesKey)}
        aria-label="Показатель"
      >
        <SegmentedItem value="steps">Шаги</SegmentedItem>
        <SegmentedItem value="sleep">Сон</SegmentedItem>
        <SegmentedItem value="energy">Ресурс</SegmentedItem>
      </Segmented>

      <div className="mt-3 rounded-2xl bg-card-2 px-2.5 pb-2 pt-3">
        <div className="flex items-baseline gap-2 px-1 pb-2">
          <span className="font-display text-3xl font-extrabold tracking-tight tabular-nums">{s.hero}</span>
          <span className="text-[13px] text-dim">{s.unit}</span>
          <span className={cn("ml-auto text-xs font-semibold", s.dir === "up" ? "text-mint" : "text-amber")}>
            {s.delta}
          </span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`График: ${s.unit} за 14 дней`}>
          <defs>
            <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67E0AE" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#67E0AE" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="#26333F" strokeWidth="1" strokeDasharray="3 4" />
          <path d={area} fill={`url(#grad-${key})`} />
          <path d={line} fill="none" stroke="#67E0AE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="4" fill="#67E0AE" stroke="#151D27" strokeWidth="2" />
        </svg>

        <div className="flex justify-between px-1 pt-1.5 text-[10.5px] tabular-nums text-dim-2">
          <span>{s.scale[0]}</span>
          <span>{s.note}</span>
          <span>{s.scale[1]}</span>
        </div>
      </div>
    </Widget>
  )
}

/** Карточка показателя без динамики: значение, шкала нормы, расшифровка. */
function MarkerWidget() {
  return (
    <Widget
      title="Ферритин"
      description="Анализ от 18 августа 2026"
      badge={<Badge variant="warn">ниже нормы</Badge>}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[32px] font-extrabold tracking-tight tabular-nums">24</span>
          <span className="text-[13px] text-dim">нг/мл · норма 30–400</span>
        </div>

        <div className="relative h-2 rounded-full bg-[linear-gradient(90deg,#86B6FF_0%,#67E0AE_26%,#67E0AE_62%,#F0C173_82%,#F08A80_100%)] opacity-85">
          <i className="absolute -top-1 left-[6%] h-4 w-1 rounded-full bg-ink shadow-[0_0_0_3px_var(--color-card)]" />
        </div>
        <div className="flex justify-between text-[10.5px] text-dim-2">
          <span>0</span>
          <span>30</span>
          <span>200</span>
          <span>400</span>
        </div>

        <p className="text-[13px] leading-relaxed text-dim">
          <b className="font-semibold text-ink">Что это.</b> Ферритин показывает запас железа. При низком запасе
          гемоглобин ещё держится в норме, а сил уже нет: типичны усталость к середине дня, зябкость, выпадение волос.
        </p>
        <p className="text-[13px] leading-relaxed text-dim">
          <b className="font-semibold text-ink">Что дальше.</b> Один замер — не диагноз. Покажите результат терапевту:
          он решит, нужны ли препараты железа и дополнительные анализы.
        </p>
      </div>

      <Button variant="ghost" size="block" className="group mt-3.5">
        Записаться к терапевту
        <ButtonKnob className="bg-white/8">
          <ArrowRight className="size-3.5" />
        </ButtonKnob>
      </Button>
    </Widget>
  )
}

export { Widget, ResultWidget, DynamicsWidget, MarkerWidget }
