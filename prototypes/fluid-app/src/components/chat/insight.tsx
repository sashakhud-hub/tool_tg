import { CompareBars, Gauge, NormMarker, Sparkline } from "@/components/chat/visuals"

type Visual =
  | { kind: "sparkline"; values: number[]; norm: [number, number]; labels: [string, string] }
  | { kind: "marker"; value: number; previous?: number; min: number; max: number; normFrom: number; unit: string }
  | { kind: "bars"; items: [{ label: string; value: number }, { label: string; value: number }]; unit: string }
  | { kind: "gauge"; value: number; max: number; caption: string; zone: "ok" | "warn" }

/**
 * Инсайт как герой ленты: именная фраза с подсвеченным значением,
 * под ней — картинка данных, ниже мелко — что это значит.
 * Порядок ровно такой: сначала ответ, потом доказательство, потом смысл.
 */
function InsightMessage({
  eyebrow,
  before,
  value,
  after,
  visual,
  meaning,
}: {
  eyebrow: string
  before: string
  value: string
  after?: string
  visual: Visual
  meaning: string
}) {
  return (
    <div className="animate-rise w-full self-stretch rounded-3xl border border-mint/15 bg-[linear-gradient(170deg,rgba(103,224,174,0.10),transparent_62%)] bg-card p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim-2">{eyebrow}</span>

      <p className="mt-2 font-display text-[23px] font-extrabold leading-[1.15] tracking-tight text-balance">
        {before} <span className="text-mint">{value}</span>
        {after ? ` ${after}` : ""}
      </p>

      {visual.kind === "sparkline" && <Sparkline values={visual.values} norm={visual.norm} labels={visual.labels} />}
      {visual.kind === "marker" && (
        <NormMarker
          value={visual.value}
          previous={visual.previous}
          min={visual.min}
          max={visual.max}
          normFrom={visual.normFrom}
          unit={visual.unit}
        />
      )}
      {visual.kind === "bars" && <CompareBars items={visual.items} unit={visual.unit} />}
      {visual.kind === "gauge" && (
        <Gauge value={visual.value} max={visual.max} caption={visual.caption} zone={visual.zone} />
      )}

      <p className="mt-3 text-[13px] leading-relaxed text-dim">{meaning}</p>
    </div>
  )
}

export { InsightMessage }
export type { Visual }
