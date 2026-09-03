import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Мини-визуалы для инсайтов. Каждый рисуется линией за 600 мс:
 * данные не проявляются, а прочерчиваются — видно, что их только что собрали.
 */

const MINT = "#67E0AE"
const AMBER = "#F0C173"
const LINE = "#26333F"
const DIM = "#647587"

function useDraw() {
  const [drawn, setDrawn] = React.useState(false)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDrawn(true), 60)
    return () => window.clearTimeout(id)
  }, [])
  return drawn
}

/** Линия за 7 ночей с полосой нормы. */
function Sparkline({
  values,
  norm,
  labels,
}: {
  values: number[]
  norm: [number, number]
  labels: [string, string]
}) {
  const drawn = useDraw()
  const W = 268
  const H = 76
  const pad = 4
  const max = Math.max(...values, norm[1]) * 1.05
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (values.length - 1)
  const y = (v: number) => H - pad - (v / max) * (H - 2 * pad)

  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const last = [x(values.length - 1), y(values[values.length - 1])] as const

  return (
    <div className="mt-3 rounded-2xl bg-black/20 p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Сон за 7 ночей">
        <rect x={pad} y={y(norm[1])} width={W - 2 * pad} height={y(norm[0]) - y(norm[1])} fill={MINT} opacity="0.10" rx="4" />
        <line x1={pad} y1={y(norm[0])} x2={W - pad} y2={y(norm[0])} stroke={MINT} strokeWidth="1" strokeDasharray="3 4" opacity=".5" />
        <path
          d={line}
          fill="none"
          stroke={AMBER}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={drawn ? 0 : 1}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.32,.72,0,1)" }}
        />
        <circle
          cx={last[0]}
          cy={last[1]}
          r="3.5"
          fill={AMBER}
          stroke="#151D27"
          strokeWidth="2"
          opacity={drawn ? 1 : 0}
          style={{ transition: "opacity 300ms 600ms" }}
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] tabular-nums" style={{ color: DIM }}>
        <span>{labels[0]}</span>
        <span style={{ color: MINT }}>норма {norm[0]}–{norm[1]} ч</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  )
}

/** Значение на шкале нормы, опционально с прошлым замером. */
function NormMarker({
  value,
  previous,
  min,
  max,
  normFrom,
  unit,
}: {
  value: number
  previous?: number
  min: number
  max: number
  normFrom: number
  unit: string
}) {
  const drawn = useDraw()
  const pos = (v: number) => `${Math.min(97, Math.max(3, ((v - min) / (max - min)) * 100))}%`

  return (
    <div className="mt-3 rounded-2xl bg-black/20 p-3">
      <div className="relative h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${AMBER} 0%, ${AMBER} ${((normFrom - min) / (max - min)) * 100}%, ${MINT} ${((normFrom - min) / (max - min)) * 100}%, ${MINT} 100%)`, opacity: 0.85 }}>
        {previous != null && (
          <i
            className="absolute -top-0.5 size-3 rounded-full border-2 border-card bg-dim-2"
            style={{ left: pos(previous), transform: "translateX(-50%)", opacity: drawn ? 1 : 0, transition: "opacity 300ms 200ms" }}
          />
        )}
        <i
          className="absolute -top-1.5 h-5 w-1 rounded-full bg-ink shadow-[0_0_0_3px_var(--color-card)]"
          style={{
            left: drawn ? pos(value) : "3%",
            transform: "translateX(-50%)",
            transition: "left 700ms cubic-bezier(.32,.72,0,1)",
          }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] tabular-nums" style={{ color: DIM }}>
        <span>{min}</span>
        <span style={{ color: AMBER }}>ниже нормы</span>
        <span style={{ color: MINT }}>норма от {normFrom} {unit}</span>
      </div>
    </div>
  )
}

/** Два столбика для сравнения «в такие дни / в остальные». */
function CompareBars({
  items,
  unit,
}: {
  items: [{ label: string; value: number }, { label: string; value: number }]
  unit: string
}) {
  const drawn = useDraw()
  const max = Math.max(...items.map((i) => i.value))

  return (
    <div className="mt-3 flex flex-col gap-2.5 rounded-2xl bg-black/20 p-3">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-[11.5px] leading-tight text-dim">{item.label}</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/6">
            <span
              className="block h-full rounded-full"
              style={{
                width: drawn ? `${(item.value / max) * 100}%` : "0%",
                background: i === 0 ? MINT : AMBER,
                transition: `width 700ms cubic-bezier(.32,.72,0,1) ${i * 120}ms`,
              }}
            />
          </span>
          <span className="w-14 shrink-0 whitespace-nowrap text-right text-[12px] font-semibold tabular-nums">
            {item.value}
            <span className="text-dim-2"> {unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

/** Дуга с одним значением: вариабельность ритма, ресурс. */
function Gauge({ value, max, caption, zone }: { value: number; max: number; caption: string; zone: "ok" | "warn" }) {
  const drawn = useDraw()
  const R = 34
  const C = Math.PI * R // полуокружность
  const share = Math.min(1, value / max)
  const color = zone === "ok" ? MINT : AMBER

  return (
    <div className="mt-3 flex items-center gap-4 rounded-2xl bg-black/20 p-3">
      <svg viewBox="0 0 88 48" className="h-12 w-22 shrink-0" role="img" aria-label={caption}>
        <path d="M10 42 A34 34 0 0 1 78 42" fill="none" stroke={LINE} strokeWidth="6" strokeLinecap="round" />
        <path
          d="M10 42 A34 34 0 0 1 78 42"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={drawn ? C * (1 - share) : C}
          style={{ transition: "stroke-dashoffset 800ms cubic-bezier(.32,.72,0,1)" }}
        />
        <text x="44" y="40" textAnchor="middle" fontSize="18" fontWeight="800" fill="#E9F1F8" fontFamily="Onest, sans-serif">
          {value}
        </text>
      </svg>
      <span className="text-[12px] leading-snug text-dim">{caption}</span>
    </div>
  )
}

/** Кольцо полноты профиля: используется в шапке и в итоговом виджете. */
function CompletenessRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`Собрано ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={LINE} strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={MINT}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 800ms cubic-bezier(.32,.72,0,1)" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={size > 40 ? 13 : 11}
        fontWeight="700"
        fill="#E9F1F8"
        fontFamily="Onest, sans-serif"
      >
        {value}
      </text>
    </svg>
  )
}

/** Счётчик, который догоняет новое значение, а не подменяет его. */
function useCountUp(target: number, duration = 700) {
  const [shown, setShown] = React.useState(target)
  const from = React.useRef(target)

  React.useEffect(() => {
    const start = performance.now()
    const initial = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(initial + (target - initial) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = target
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return shown
}

/** Полоса полноты под шапкой: всегда видно, сколько собрано и что это растёт. */
function CompletenessStrip({ value, hint }: { value: number; hint: string }) {
  const shown = useCountUp(value)
  return (
    <div className="flex items-center gap-2.5 border-b border-white/5 px-4.5 py-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-3">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-mint to-[#8ff0c8]"
          style={{ width: `${value}%`, transition: "width 800ms cubic-bezier(.32,.72,0,1)" }}
        />
      </span>
      <span className={cn("text-[11.5px] font-semibold tabular-nums text-mint")}>{shown}%</span>
      <span className="text-[11px] text-dim-2">{hint}</span>
    </div>
  )
}

export { Sparkline, NormMarker, CompareBars, Gauge, CompletenessRing, CompletenessStrip, useCountUp }
