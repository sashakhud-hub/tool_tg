import * as React from "react"
import { ArrowLeft, ArrowRight, Mic, Plus } from "lucide-react"

import { Button, ButtonKnob } from "@/components/ui/button"
import { ChoiceRow } from "@/components/ui/choice"
import { cn } from "@/lib/utils"

/** Рама телефона 390×844 с двойным бортиком. */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[844px] w-[390px] shrink-0 rounded-[52px] bg-[linear-gradient(160deg,#2b3644,#0d1219_46%,#242e3b)] p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[42px] bg-panel shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.05)]">
        <div className="absolute left-1/2 top-2 z-10 h-6.5 w-28 -translate-x-1/2 rounded-2xl bg-[#05080c]" />
        {children}
      </div>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="z-5 flex items-center justify-between px-6 pb-1 pt-3.5 text-[13px] font-semibold">
      <span>9:41</span>
      <span className="text-dim">▮▮▮ ⌁ ▰▰▰</span>
    </div>
  )
}

function AppBar({ tab, onTab }: { tab: "chat" | "gallery"; onTab: (t: "chat" | "gallery") => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-4.5 pb-3 pt-2">
      <span className="grid size-9 place-items-center rounded-full bg-[linear-gradient(150deg,#67e0ae,#2f9e77)] font-display text-sm font-extrabold text-mint-ink">
        Ф
      </span>
      <span className="flex flex-col leading-tight">
        <b className="text-[15px] font-semibold">Ассистент здоровья</b>
        <span className="text-xs text-mint">на связи</span>
      </span>
      <div role="tablist" className="ml-auto flex gap-0.5 rounded-full bg-card p-0.5">
        {(["chat", "gallery"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => onTab(t)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-300 ease-fluid",
              tab === t ? "bg-card-3 text-ink" : "text-dim"
            )}
          >
            {t === "chat" ? "Чат" : "Виджеты"}
          </button>
        ))}
      </div>
    </div>
  )
}

function Composer({ onPlus }: { onPlus: () => void }) {
  return (
    <div className="flex items-center gap-2.5 border-t border-white/5 bg-panel px-3.5 pb-5 pt-2.5">
      <button
        onClick={onPlus}
        aria-label="Добавить файл"
        className="grid size-9.5 shrink-0 place-items-center rounded-full bg-card-2 transition-colors duration-300 ease-fluid hover:bg-card-3"
      >
        <Plus className="size-5" />
      </button>
      <div className="flex h-9.5 flex-1 items-center rounded-full bg-card px-4 text-sm text-dim-2">Сообщение</div>
      <Mic className="size-4.5 text-dim" />
    </div>
  )
}

/** Экран подключения устройства поверх чата с возвратом обратно. */
function ConnectSheet({
  kind,
  open,
  onClose,
  onConnect,
}: {
  kind: "ring" | "health"
  open: boolean
  onClose: () => void
  onConnect: () => void
}) {
  const [busy, setBusy] = React.useState(false)
  const ring = kind === "ring"

  React.useEffect(() => {
    if (open) setBusy(false)
  }, [open, kind])

  return (
    <div
      aria-hidden={!open}
      inert={!open ? true : undefined}
      className={cn(
        "absolute inset-0 z-20 flex flex-col bg-panel px-5 pb-6 pt-6.5 transition-transform duration-300 ease-fluid",
        open ? "translate-y-0" : "pointer-events-none invisible translate-y-full"
      )}
    >
      <button
        onClick={onClose}
        aria-label="Закрыть"
        className="grid size-9 place-items-center self-start rounded-full bg-card-2"
      >
        <ArrowLeft className="size-4" />
      </button>

      <div className="mx-auto mt-5 grid size-33 place-items-center rounded-full bg-[radial-gradient(circle_at_34%_28%,rgba(103,224,174,0.42),rgba(103,224,174,0.05)_62%)] text-5xl">
        {ring ? "◉" : "◍"}
      </div>

      <h3 className="mt-6 text-center font-display text-2xl font-extrabold tracking-tight">
        {ring ? "Кольцо Sber" : "Apple Health"}
      </h3>
      <p className="mt-2 text-center text-sm text-dim">
        {ring
          ? "Держите кольцо рядом с телефоном. Заберу сон, пульс и ресурс за последние 30 дней"
          : "Разрешите доступ к шагам, активности и весу. Данные останутся в вашем профиле"}
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <ChoiceRow icon="✓" title={ring ? "Сон и фазы" : "Шаги и активность"} note="История за 30 дней" />
        <ChoiceRow icon="✓" title={ring ? "Пульс и ресурс" : "Вес и рост"} note="Обновляется автоматически" />
      </div>

      <div className="flex-1" />

      <Button
        size="block"
        className="group"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          window.setTimeout(onConnect, 900)
        }}
      >
        {busy ? "Подключаю…" : "Подключить"}
        {!busy && (
          <ButtonKnob>
            <ArrowRight className="size-3.5" />
          </ButtonKnob>
        )}
      </Button>
      <Button variant="ghost" size="block" className="mt-2" onClick={onClose}>
        Не сейчас
      </Button>
    </div>
  )
}

export { PhoneFrame, StatusBar, AppBar, Composer, ConnectSheet }
