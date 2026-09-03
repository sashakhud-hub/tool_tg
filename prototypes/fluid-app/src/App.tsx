import * as React from "react"
import { ArrowRight } from "lucide-react"

import { Badge, BadgeDot } from "@/components/ui/badge"
import { Button, ButtonKnob } from "@/components/ui/button"
import { ChoiceRow, ChoiceTile } from "@/components/ui/choice"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Toast } from "@/components/ui/toast"
import { BotMessage, UserMessage, WhyNote } from "@/components/chat/primitives"
import { AppBar, Composer, ConnectSheet, PhoneFrame, StatusBar } from "@/components/chat/phone"
import { InsightMessage, type Visual } from "@/components/chat/insight"
import { CompletenessStrip } from "@/components/chat/visuals"
import { Milestone, StoryMessage, TypingBubble } from "@/components/chat/story"
import { DynamicsWidget, MarkerWidget, ResultWidget, Widget } from "@/components/chat/widgets"

type SourceId = "forms" | "files" | "devices" | "mail" | "video"

const GOALS = [
  { ico: "⚡", text: "Больше энергии, меньше усталости", short: "энергия", prio: ["Сон и восстановление", "Питание и дефициты", "Стресс и настроение"] },
  { ico: "❤", text: "Снизить риск инфаркта и инсульта", short: "сердце и сосуды", prio: ["Сердце и сосуды", "Питание и дефициты", "Наследственность"] },
  { ico: "⚖", text: "Разобраться с весом", short: "вес", prio: ["Питание и дефициты", "Обмен веществ", "Активность"] },
  { ico: "☾", text: "Наладить сон", short: "сон", prio: ["Сон и восстановление", "Стресс и настроение", "Активность"] },
  { ico: "✚", text: "Проверить, всё ли в порядке", short: "общий чек-ап", prio: ["Базовый опросник", "Сердце и сосуды", "Наследственность"] },
]

const SOURCES: { id: SourceId; ico: string; title: string; note: string }[] = [
  { id: "forms", ico: "▤", title: "Анкеты", note: "9 анкет, от 2 мин каждая" },
  { id: "files", ico: "▣", title: "Анализы и заключения", note: "PDF, фото, выписки" },
  { id: "devices", ico: "◉", title: "Устройства", note: "Кольцо Sber, Apple Health" },
  { id: "mail", ico: "✉", title: "Почта", note: "Письма из клиник и лабораторий" },
  { id: "video", ico: "▶", title: "Экспресс-диагностика", note: "2 мин по видео, камера телефона" },
]

const STEP_TITLE: Record<SourceId, string> = {
  forms: "Анкеты",
  files: "Анализы и заключения",
  devices: "Устройства",
  mail: "Почта",
  video: "Экспресс-диагностика",
}
const STEP_VERB: Record<SourceId, string> = {
  forms: "Заполнить анкеты",
  files: "Загрузить файлы",
  devices: "Подключить устройства",
  mail: "Подключить почту",
  video: "Пройти диагностику",
}
const STEP_ORDER: SourceId[] = ["devices", "video", "mail", "files", "forms"]

const REST_FORMS = [
  "Наследственность",
  "Вредные привычки",
  "Активность",
  "Женское или мужское здоровье",
  "Лекарства и добавки",
  "Хронические болезни",
]

type Block = { id: number; node: React.ReactNode }

export default function App() {
  const [tab, setTab] = React.useState<"chat" | "gallery">("chat")
  const [blocks, setBlocks] = React.useState<Block[]>([])
  const [toast, setToast] = React.useState<{ text: string; open: boolean }>({ text: "", open: false })
  const [sheet, setSheet] = React.useState<{ kind: "ring" | "health"; open: boolean }>({ kind: "ring", open: false })
  // полнота нужна и в разметке (полоса под шапкой), и в коллбэках виджетов
  const [completeness, setCompleteness] = React.useState(12)
  const [planned, setPlanned] = React.useState(false)
  const chatRef = React.useRef<HTMLDivElement>(null)

  // состояние сценария живёт в ref: коллбэки виджетов читают актуальные значения
  const s = React.useRef({
    goal: "",
    goalShort: "",
    prio: [] as string[],
    sources: [] as SourceId[],
    queue: [] as SourceId[],
    done: [] as SourceId[],
    filled: 0,
    completeness: 12,
    seenResults: false,
    milestoneShown: false,
    pinnedTop: true,
    nextId: 0,
  })

  const push = React.useCallback((node: React.ReactNode, delay = 0) => {
    const id = s.current.nextId++
    const append = () => setBlocks((b) => [...b, { id, node }])
    if (delay) window.setTimeout(append, delay)
    else append()
  }, [])

  /** Реплика бота с паузой на набор: сначала точки, потом сообщение. */
  const say = React.useCallback((node: React.ReactNode, typing = 850, delay = 0) => {
    const id = s.current.nextId++
    const show = () => {
      setBlocks((b) => [...b, { id, node: <TypingBubble /> }])
      window.setTimeout(() => setBlocks((b) => b.map((x) => (x.id === id ? { id, node } : x))), typing)
    }
    if (delay) window.setTimeout(show, delay)
    else show()
  }, [])

  /** Поднимает полноту профиля и держит ref и состояние в одном значении. */
  const bump = React.useCallback((delta: number) => {
    const before = s.current.completeness
    s.current.completeness = Math.min(96, before + delta)
    setCompleteness(s.current.completeness)
    // единственная кульминация за сессию — в момент, когда профиль стало можно считать
    if (before < 55 && s.current.completeness >= 55 && !s.current.milestoneShown) {
      s.current.milestoneShown = true
      const value = s.current.completeness
      window.setTimeout(() => {
        const id = s.current.nextId++
        setBlocks((b) => [...b, { id, node: <Milestone value={value} /> }])
      }, 1500)
    }
  }, [])

  const showToast = React.useCallback((text: string) => {
    setToast({ text, open: true })
    window.setTimeout(() => setToast((t) => ({ ...t, open: false })), 2600)
  }, [])

  React.useLayoutEffect(() => {
    const el = chatRef.current
    if (!el) return
    el.scrollTop = s.current.pinnedTop ? 0 : el.scrollHeight
  }, [blocks])

  // ---------- шаг 1: велком и цель ----------
  const start = React.useCallback(() => {
    s.current = { ...s.current, goal: "", goalShort: "", prio: [], sources: [], queue: [], done: [], filled: 0, completeness: 12, seenResults: false, milestoneShown: false, pinnedTop: true }
    setBlocks([])
    setCompleteness(12)
    setPlanned(false)

    // рассказ идёт репликами: три фразы с паузами на набор, потом первый вопрос
    say(<StoryMessage first accent="Здравствуйте, Илья" note="Это ваш ассистент здоровья" />, 600, 200)
    say(
      <StoryMessage
        accent="Начнём с того,"
        tail="чтобы понять вас"
        note="Не с анализов и не с анкет на тридцать минут. Сначала — с вашего запроса"
      />,
      900,
      2000
    )
    say(
      <StoryMessage
        accent="Первые выводы —"
        tail="через 3 минуты"
        note="Дальше картина уточняется с каждым источником, который вы подключите"
      />,
      900,
      4400
    )
    // после рассказа лента начинает следовать за новыми сообщениями
    window.setTimeout(() => {
      s.current.pinnedTop = false
      push(<GoalWidget onPick={pickGoal} />)
    }, 7000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pickGoal(text: string, short: string, prio: string[]) {
    s.current.pinnedTop = false
    s.current.goal = text
    s.current.goalShort = short
    s.current.prio = prio
    push(<UserMessage>{text}</UserMessage>)
    say(
      <BotMessage lead="Цель зафиксирована" sub="Изменить цель можно в любой момент — картина пересоберётся">
        Веду вас к ней: анкеты, показатели и рекомендации будут собираться под запрос «{text.toLowerCase()}».
      </BotMessage>,
      850,
      300
    )
    push(<SourcesWidget onSubmit={pickSources} />, 1900)
  }

  // ---------- шаг 2: источники и план ----------
  function pickSources(ids: SourceId[]) {
    s.current.sources = ids
    s.current.queue = STEP_ORDER.filter((id) => ids.includes(id))
    setPlanned(true)
    push(<UserMessage>{ids.map((id) => STEP_TITLE[id]).join(", ")}</UserMessage>)
    say(
      <BotMessage lead="Собрал план">
        Начнём с быстрого — первые выводы появятся уже после первого шага. Выйти можно в любой момент, прогресс
        сохранится.
      </BotMessage>,
      850,
      200
    )
    push(
      <Widget
        title="План на сегодня"
        description={`${s.current.queue.length} шага до первого риск-профиля`}
        badge={
          <Badge variant="ok">
            <BadgeDot />
            цель: {s.current.goalShort}
          </Badge>
        }
      >
        <div className="flex flex-col gap-1.5">
          {s.current.queue.map((id, i) => (
            <ChoiceRow
              key={id}
              icon={i + 1}
              title={STEP_TITLE[id]}
              note={id === "forms" ? "Приоритет анкет — под вашу цель" : "Займёт меньше минуты"}
              tail={i === 0 ? "сейчас" : "дальше"}
            />
          ))}
        </div>
        <Button size="block" className="group mt-3.5" onClick={() => runStep(s.current.queue[0])}>
          {STEP_VERB[s.current.queue[0]]}
          <ButtonKnob>
            <ArrowRight className="size-3.5" />
          </ButtonKnob>
        </Button>
      </Widget>,
      1500
    )
  }

  // ---------- маршрутизация ----------
  function runStep(id: SourceId) {
    if (id === "forms") push(<FormsWidget prio={s.current.prio} goalShort={s.current.goalShort} onFilled={onFormsFilled} />)
    else if (id === "files") {
      say(
        <BotMessage>Загрузите анализы и заключения через плюс внизу. Проверю каждый файл и скажу, что пригодилось</BotMessage>
      )
      push(<FilesWidget onRetry={() => showToast("Файл принят: гормоны щитовидной железы")} onDone={onFilesDone} />, 1600)
    } else if (id === "devices")
      push(<DevicesWidget onConnect={(kind) => setSheet({ kind, open: true })} onSkip={() => skip("devices")} />)
    else if (id === "mail") push(<MailWidget onDone={onMailDone} onSkip={() => skip("mail")} />)
    else push(<VideoWidget onDone={onVideoDone} onSkip={() => skip("video")} />)
  }

  function skip(id: SourceId) {
    s.current.done.push(id)
    say(<BotMessage>Хорошо, вернёмся к этому позже</BotMessage>, 700, 200)
    window.setTimeout(nextStep, 620)
  }

  function nextStep() {
    const rest = s.current.queue.filter((id) => !s.current.done.includes(id))
    if (rest.length) return runStep(rest[0])
    if (s.current.completeness < 60) return criticalStep()
    resultsStep()
  }

  // ---------- результаты шагов ----------
  function onFormsFilled() {
    s.current.filled += 2
    bump(32)
    finishStep("forms", {
      eyebrow: "Первое, что видно по анкетам",
      before: "Илья, вы спите",
      value: "6 ч 10 мин",
      after: "при норме 7–9",
      visual: {
        kind: "sparkline",
        values: [6.4, 6.1, 5.4, 7.2, 6.8, 5.9, 6.0],
        norm: [7, 9],
        labels: ["7 дней назад", "сегодня"],
      },
      meaning: "Пять ночей из семи короче нормы. При вашей цели это первое, что бьёт по энергии — раньше анализов и добавок",
    })
  }

  function onFilesDone() {
    bump(18)
    finishStep("files", {
      eyebrow: "Из анализов за август",
      before: "Ферритин",
      value: "24 нг/мл",
      after: "— ниже нормы",
      visual: { kind: "marker", value: 24, min: 0, max: 200, normFrom: 30, unit: "нг/мл" },
      meaning: "Запас железа низкий, а гемоглобин в норме — поэтому обычные анализы выглядят «хорошими», а сил нет. Частая причина усталости",
    })
  }

  function onMailDone() {
    bump(12)
    showToast("Почта подключена: 4 письма с анализами")
    window.setTimeout(
      () =>
        finishStep("mail", {
          eyebrow: "Нашёл в письмах за 2 года",
          before: "Витамин D сдавали дважды:",
          value: "18 и 22 нг/мл",
          visual: { kind: "marker", value: 22, previous: 18, min: 0, max: 100, normFrom: 30, unit: "нг/мл" },
          meaning: "Оба замера ниже нормы, между ними год. Значит, дефицит не разовый, а держится — это меняет рекомендации",
        }),
      900
    )
  }

  function onVideoDone() {
    bump(14)
    finishStep("video", {
      eyebrow: "По видео за 2 минуты",
      before: "Вариабельность ритма",
      value: "38 мс",
      after: "— низковата",
      visual: { kind: "gauge", value: 38, max: 100, caption: "Норма для вашего возраста — от 50 мс", zone: "warn" },
      meaning: "Так выглядит хроническое недовосстановление: организм не выходит из режима нагрузки даже в покое",
    })
  }

  function onDeviceConnected() {
    setSheet((v) => ({ ...v, open: false }))
    showToast(sheet.kind === "ring" ? "Кольцо подключено" : "Apple Health подключён")
    bump(20)
    window.setTimeout(
      () =>
        finishStep("devices", {
          eyebrow: "По данным за 30 дней",
          before: "В дни позднего отбоя ресурс ниже на",
          value: "22%",
          visual: {
            kind: "bars",
            items: [
              { label: "Отбой до 00:30", value: 71 },
              { label: "Отбой после 01:00", value: 55 },
            ],
            unit: "балл",
          },
          meaning: "Разница устойчивая, а не случайная: она держится весь месяц. Это самый быстрый рычаг при вашей цели",
        }),
      900
    )
  }

  /**
   * После шага: инсайт-герой, затем действия. В первый раз оба равнозначны,
   * дальше основное — продолжить, а результаты уходят тихой строкой.
   */
  function finishStep(
    id: SourceId,
    insight: { eyebrow: string; before: string; value: string; after?: string; visual: Visual; meaning: string }
  ) {
    if (!s.current.done.includes(id)) s.current.done.push(id)
    say(<InsightMessage {...insight} />, 950, 320)

    const left = s.current.queue.filter((x) => !s.current.done.includes(x)).length
    const first = s.current.done.length === 1

    const openResults = () => {
      push(<UserMessage>Посмотреть результаты</UserMessage>)
      resultsStep()
    }
    const goNext = () => {
      push(<UserMessage>Продолжить</UserMessage>)
      window.setTimeout(nextStep, 320)
    }

    push(
      <div className="animate-rise flex w-full flex-col gap-2 self-start">
        {first ? (
          <>
            <Button size="block" className="justify-start" onClick={openResults}>
              Посмотреть промежуточные результаты
            </Button>
            <Button variant="outline" size="block" className="justify-start" onClick={goNext}>
              {left ? `Продолжить риск-профиль · осталось ${left}` : "Дополнить риск-профиль"}
            </Button>
          </>
        ) : (
          <>
            <Button size="block" className="justify-start" onClick={goNext}>
              {left ? `Продолжить · осталось ${left}` : "Дополнить риск-профиль"}
            </Button>
            <Button variant="quiet" size="block" className="justify-start" onClick={openResults}>
              Посмотреть, что уже собрано
            </Button>
          </>
        )}
      </div>,
      2100
    )
  }

  // ---------- базовые данные и итог ----------
  function criticalStep() {
    say(<BotMessage>Для риск-профиля не хватает базового: пол, возраст, вес и рост. Возраст и пол взял из Сбер ID</BotMessage>, 850, 200)
    push(
      <CriticalWidget
        onSave={(w, h) => {
          bump(14)
          say(<BotMessage>Записал: {w} кг и {h} см. ИМТ 25,6 — чуть выше нормы, это учту в рекомендациях</BotMessage>, 850, 300)
          window.setTimeout(resultsStep, 800)
        }}
      />,
      520
    )
  }

  function resultsStep() {
    const mode = s.current.seenResults ? "returning" : "novice"
    s.current.seenResults = true
    push(
      <ResultWidget
        mode={mode}
        completeness={completeness}
        goal={s.current.goalShort || "энергия"}
        onOpen={() => showToast("Открываю риск-профиль")}
      />
    )
    push(
      <div className="animate-rise flex w-full flex-col gap-2 self-start">
        <Button variant="outline" size="block" className="justify-start" onClick={() => window.setTimeout(nextStep, 200)}>
          Дополнить данные
        </Button>
        <Button variant="quiet" size="block" className="justify-start" onClick={start}>
          Начать заново
        </Button>
      </div>,
      500
    )
  }

  return (
    <div className="mx-auto max-w-[1220px] px-5 pb-18 pt-9">
      <header className="flex flex-wrap items-end gap-x-7 gap-y-4 border-b border-line pb-6">
        <div className="flex-1 basis-95">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim-2">
            Прототип · компоненты shadcn
          </div>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Первый опыт на компонентах
          </h1>
        </div>
        <p className="max-w-[52ch] text-sm text-dim">
          Тот же сценарий первого опыта, пересобранный на React и Tailwind: каждый экранный элемент — переиспользуемый
          компонент с вариантами, а не разметка внутри одного файла.
        </p>
      </header>

      <div className="mt-8 grid items-start gap-11 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3.5 lg:sticky lg:top-6">
          <PhoneFrame>
            <StatusBar />
            <AppBar tab={tab} onTab={setTab} />
            {planned && tab === "chat" && <CompletenessStrip value={completeness} hint="риск-профиль собран" />}

            {tab === "chat" ? (
              <div ref={chatRef} className="scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-2 pt-4" role="log">
                {blocks.map((b) => (
                  <React.Fragment key={b.id}>{b.node}</React.Fragment>
                ))}
              </div>
            ) : (
              <div
                ref={(el) => {
                  if (el) el.scrollTop = 0
                }}
                className="scroll-thin flex flex-1 flex-col gap-3.5 overflow-y-auto px-3.5 pb-6 pt-4"
              >
                <GalleryLabel>Полнота данных</GalleryLabel>
                <CompletenessWidget />
                <GalleryLabel>Рекомендации</GalleryLabel>
                <RecommendationsWidget />
                <GalleryLabel>Динамика показателя</GalleryLabel>
                <DynamicsWidget />
                <GalleryLabel>Показатель без динамики</GalleryLabel>
                <MarkerWidget />
                <GalleryLabel>Результаты · новичок</GalleryLabel>
                <ResultWidget mode="novice" completeness={38} goal="энергия" />
                <GalleryLabel>Результаты · действующий пользователь</GalleryLabel>
                <ResultWidget mode="returning" completeness={74} goal="энергия" />
              </div>
            )}

            {tab === "chat" && <Composer onPlus={() => showToast("Файл добавлен в очередь проверки")} />}

            <ConnectSheet
              kind={sheet.kind}
              open={sheet.open}
              onClose={() => setSheet((v) => ({ ...v, open: false }))}
              onConnect={onDeviceConnected}
            />
            <Toast text={toast.text} open={toast.open} />
          </PhoneFrame>
          <p className="max-w-[340px] text-center text-[12.5px] text-dim-2">
            Прототип работает: выберите цель, отметьте источники и пройдите шаги
          </p>
        </div>

        <ComponentSpec />
      </div>
    </div>
  )
}

// ================= виджеты сценария =================

function GoalWidget({ onPick }: { onPick: (text: string, short: string, prio: string[]) => void }) {
  const [own, setOwn] = React.useState("")
  const [locked, setLocked] = React.useState(false)

  return (
    <Widget title="С чем пришли?" description="От ответа зависит, какие анкеты и показатели покажу первыми" className={locked ? "opacity-55" : ""}>
      <div className="flex flex-col gap-2">
        {GOALS.map((g) => (
          <button
            key={g.text}
            type="button"
            disabled={locked}
            onClick={() => {
              setLocked(true)
              onPick(g.text, g.short, g.prio)
            }}
            className="flex items-center gap-2.5 rounded-2xl bg-card-2 px-3.5 py-3 text-left text-sm font-medium transition-colors duration-300 ease-fluid hover:bg-card-3 disabled:pointer-events-none"
          >
            <span className="w-5.5 shrink-0 text-center text-base">{g.ico}</span>
            {g.text}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex gap-2">
        <Input
          value={own}
          disabled={locked}
          onChange={(e) => setOwn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && own.trim()) {
              setLocked(true)
              onPick(own.trim(), own.trim().toLowerCase(), ["Базовый опросник", "Сон и восстановление", "Стресс и настроение"])
            }
          }}
          placeholder="Свой запрос"
          aria-label="Свой запрос"
        />
        <Button
          variant="ghost"
          disabled={locked || !own.trim()}
          onClick={() => {
            setLocked(true)
            onPick(own.trim(), own.trim().toLowerCase(), ["Базовый опросник", "Сон и восстановление", "Стресс и настроение"])
          }}
        >
          Готово
        </Button>
      </div>
    </Widget>
  )
}

function SourcesWidget({ onSubmit }: { onSubmit: (ids: SourceId[]) => void }) {
  const [picked, setPicked] = React.useState<SourceId[]>([])
  const [locked, setLocked] = React.useState(false)

  return (
    <Widget title="Чем готовы поделиться?" description="Выберите всё, что подходит. Порядок соберу сам" className={locked ? "opacity-55" : ""}>
      <div className="grid grid-cols-2 gap-2.5">
        {SOURCES.map((src) => (
          <ChoiceTile
            key={src.id}
            icon={src.ico}
            title={src.title}
            note={src.note}
            selected={picked.includes(src.id)}
            disabled={locked}
            onClick={() =>
              setPicked((p) => (p.includes(src.id) ? p.filter((x) => x !== src.id) : [...p, src.id]))
            }
          />
        ))}
        <ChoiceTile
          wide
          locked
          icon="🔒"
          title="Агенты сбора данных"
          note="Заберут историю из ЛК клиник и лабораторий. Открываем в октябре"
        />
      </div>
      <Button
        size="block"
        className="group mt-3.5"
        disabled={locked || picked.length === 0}
        onClick={() => {
          setLocked(true)
          onSubmit(picked)
        }}
      >
        {picked.length === 0 ? (
          "Выберите источники"
        ) : (
          <>
            Продолжить <span className="font-medium opacity-70">выбрано {picked.length} из 5</span>
            <ButtonKnob>
              <ArrowRight className="size-3.5" />
            </ButtonKnob>
          </>
        )}
      </Button>
    </Widget>
  )
}

function FormsWidget({ prio, goalShort, onFilled }: { prio: string[]; goalShort: string; onFilled: () => void }) {
  const [done, setDone] = React.useState<string[]>([])
  const [expanded, setExpanded] = React.useState(false)
  const [locked, setLocked] = React.useState(false)

  function fill(title: string) {
    const next = [...done, title]
    setDone(next)
    if (next.length >= 2) {
      setLocked(true)
      onFilled()
    }
  }

  return (
    <Widget
      title="Анкеты"
      description={`Порядок собран под цель «${goalShort}»`}
      badge={<Badge>{done.length} из 9</Badge>}
      className={locked ? "opacity-55" : ""}
    >
      <div className="mb-2 flex items-baseline justify-between text-[12.5px] text-dim">
        <span>Заполнено</span>
        <b className="text-[13px] font-semibold text-ink">{done.length} из 9</b>
      </div>
      <Progress value={(done.length / 9) * 100} />

      <div className="mt-3 flex flex-col gap-1.5">
        {prio.map((t, i) => (
          <ChoiceRow
            key={t}
            highlight
            icon={done.includes(t) ? "✓" : i === 0 ? "●" : "○"}
            title={t}
            note={i === 0 ? "2 мин · 8 вопросов" : "3 мин"}
            tail={done.includes(t) ? "готово" : "→"}
            disabled={locked || done.includes(t)}
            onClick={() => fill(t)}
          />
        ))}
        {expanded &&
          REST_FORMS.map((t) => (
            <ChoiceRow
              key={t}
              icon={done.includes(t) ? "✓" : "○"}
              title={t}
              note="2–4 мин"
              tail={done.includes(t) ? "готово" : "→"}
              disabled={locked || done.includes(t)}
              onClick={() => fill(t)}
            />
          ))}
      </div>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2.5 w-full rounded-2xl border border-dashed border-line py-2.5 text-[13px] font-semibold text-dim transition-colors duration-300 ease-fluid hover:bg-card-2"
        >
          Ещё 6 анкет · заполним позже
        </button>
      )}

      <WhyNote>
        Эти три первыми, потому что сильнее всего влияют на вашу цель. Остальные уточнят картину и подождут
      </WhyNote>
    </Widget>
  )
}

function FilesWidget({ onRetry, onDone }: { onRetry: () => void; onDone: () => void }) {
  const [locked, setLocked] = React.useState(false)
  return (
    <Widget title="Загруженные файлы" description="3 файла · проверил каждый" className={locked ? "opacity-55" : ""}>
      <div className="flex flex-col gap-1.5">
        <ChoiceRow
          icon="▣"
          title="Биохимия крови"
          note="18 августа 2026 · 14 показателей"
          tail={
            <Badge variant="ok">
              <BadgeDot />
              принят
            </Badge>
          }
        />
        <ChoiceRow icon="▣" title="УЗИ щитовидной железы" note="3 марта 2019 · старше 3 лет" tail={<Badge variant="warn">устарел</Badge>} />
        <ChoiceRow
          icon="▣"
          title="IMG_4821.jpg"
          note="Текст не читается — снимите ближе и при свете"
          tail={<Badge variant="bad">не распознан</Badge>}
        />
      </div>
      <Button variant="ghost" size="block" className="mt-3.5" disabled={locked} onClick={onRetry}>
        Загрузить снимок снова
      </Button>
      <Button
        size="block"
        className="group mt-2"
        disabled={locked}
        onClick={() => {
          setLocked(true)
          onDone()
        }}
      >
        Продолжить
        <ButtonKnob>
          <ArrowRight className="size-3.5" />
        </ButtonKnob>
      </Button>
    </Widget>
  )
}

function DevicesWidget({ onConnect, onSkip }: { onConnect: (kind: "ring" | "health") => void; onSkip: () => void }) {
  return (
    <Widget title="Устройства" description="Подключение занимает 30 секунд и дальше работает само">
      <div className="flex flex-col gap-1.5">
        <ChoiceRow icon="◉" title="Кольцо Sber" note="Сон, пульс, ресурс" tail="подключить" onClick={() => onConnect("ring")} />
        <ChoiceRow icon="◍" title="Apple Health" note="Шаги, активность, вес" tail="подключить" onClick={() => onConnect("health")} />
      </div>
      <Button variant="ghost" size="block" className="mt-3.5" onClick={onSkip}>
        Пропустить шаг
      </Button>
    </Widget>
  )
}

function MailWidget({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  return (
    <Widget title="Почта" description="Найду письма из клиник и лабораторий, остальное не трогаю">
      <ChoiceRow icon="✉" title="Подключить почту" note="Только письма с результатами анализов" tail="→" onClick={onDone} />
      <Button variant="ghost" size="block" className="mt-3.5" onClick={onSkip}>
        Пропустить шаг
      </Button>
    </Widget>
  )
}

function VideoWidget({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [busy, setBusy] = React.useState(false)
  return (
    <Widget title="Экспресс-диагностика" description="2 минуты, лицо в кадре, камера телефона">
      <ChoiceRow icon="▶" title="Что измерим" note="Пульс, вариабельность ритма, уровень стресса" />
      <Button
        size="block"
        className="group mt-3.5"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          window.setTimeout(onDone, 1400)
        }}
      >
        {busy ? "Измеряю…" : "Начать диагностику"}
      </Button>
      <Button variant="ghost" size="block" className="mt-2" disabled={busy} onClick={onSkip}>
        Пропустить шаг
      </Button>
    </Widget>
  )
}

function CriticalWidget({ onSave }: { onSave: (weight: string, height: string) => void }) {
  const [weight, setWeight] = React.useState("")
  const [height, setHeight] = React.useState("")
  const [saved, setSaved] = React.useState(false)

  const w = weight.trim() || "84"
  const h = height.trim() || "181"

  return (
    <Widget title="Базовые данные" description="Без них риск считается грубо" badge={<Badge>30 секунд</Badge>} className={saved ? "opacity-55" : ""}>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Пол" value="Мужской" />
        <Field label="Возраст" value="38 лет" />
        <Field label="Вес" value={saved ? `${w} кг` : "— кг"} empty={!saved} />
        <Field label="Рост" value={saved ? `${h} см` : "— см"} empty={!saved} />
      </div>
      <div className="mt-2.5 flex gap-2">
        <Input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="numeric" placeholder="Вес, кг" aria-label="Вес в килограммах" disabled={saved} />
        <Input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="numeric" placeholder="Рост, см" aria-label="Рост в сантиметрах" disabled={saved} />
      </div>
      <Button
        size="block"
        className="group mt-3.5"
        disabled={saved}
        onClick={() => {
          setSaved(true)
          onSave(w, h)
        }}
      >
        Сохранить
        <ButtonKnob>
          <ArrowRight className="size-3.5" />
        </ButtonKnob>
      </Button>
    </Widget>
  )
}

function Field({ label, value, empty = false }: { label: string; value: string; empty?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-2xl bg-card-2 px-3.5 py-3">
      <span className="text-[11px] font-semibold text-dim-2">{label}</span>
      <span className={`font-display text-base font-semibold ${empty ? "text-dim-2" : "text-ink"}`}>{value}</span>
    </div>
  )
}

// ================= галерея =================

function GalleryLabel({ children }: { children: React.ReactNode }) {
  return <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-dim-2">{children}</div>
}

function CompletenessWidget() {
  return (
    <Widget title="Полнота данных" description="Чем полнее профиль, тем точнее риск" badge={<Badge variant="warn">62%</Badge>}>
      <Progress value={62} />
      <div className="mt-3 flex flex-col gap-1.5">
        <ChoiceRow highlight icon="▣" title="Анализы крови" note="Дадут +18% к точности — самый большой вклад" tail="→" onClick={() => {}} />
        <ChoiceRow icon="▤" title="Наследственность" note="+11%, 3 минуты" tail="→" onClick={() => {}} />
        <ChoiceRow icon="◉" title="Давление" note="+9%, нужен тонометр или запись врача" tail="→" onClick={() => {}} />
        <ChoiceRow icon="✓" title="Сон, активность, базовые данные" note="Собраны" tail={<Badge variant="ok"><BadgeDot />готово</Badge>} />
      </div>
    </Widget>
  )
}

function RecommendationsWidget() {
  const items = [
    { title: "Отбой до 00:30", note: "5 дней подряд · ресурс вырастет на 15–20%" },
    { title: "Ферритин и витамин D", note: "Сдать вместе, натощак · объясняют усталость чаще остального" },
    { title: "Обсудить с терапевтом", note: "Низкая вариабельность ритма держится месяц" },
  ]
  return (
    <Widget title="Что делать сейчас" description="Под цель «энергия», обновлено сегодня">
      {items.map((r, i) => (
        <div key={r.title} className={`flex gap-2.5 py-3 ${i > 0 ? "border-t border-white/7" : ""}`}>
          <span className="grid size-5.5 shrink-0 place-items-center rounded-lg bg-card-3 text-[11px] font-bold text-mint">{i + 1}</span>
          <span>
            <b className="block text-[13.5px] font-semibold">{r.title}</b>
            <span className="mt-0.5 block text-xs text-dim">{r.note}</span>
          </span>
        </div>
      ))}
      <Button variant="ghost" size="block" className="mt-3.5">
        Все рекомендации · 7
      </Button>
    </Widget>
  )
}

// ================= правая колонка =================

function ComponentSpec() {
  const rows: [string, string, string][] = [
    ["Button", "variant: default · ghost · outline · quiet", "size: default · sm · block · icon, ButtonKnob для стрелки"],
    ["Card", "Card, CardHeader, CardTitle, CardDescription", "CardBezel — двойной бортик с концентрическими радиусами"],
    ["Badge", "variant: default · ok · warn · bad", "Статусы файлов, полнота, «цель зафиксирована»"],
    ["Progress", "Radix Progress", "Прогресс анкет и полноты данных"],
    ["ChoiceTile", "selected · locked · wide", "Источники данных, множественный выбор"],
    ["ChoiceRow", "highlight · tail · disabled", "Анкеты, файлы, устройства, план"],
    ["Segmented", "Radix ToggleGroup", "Переключение шаги / сон / ресурс"],
    ["Widget", "title · description · badge", "Общая обёртка всех виджетов в ленте"],
    ["ResultWidget", "mode: novice · returning", "Виджет результатов в двух состояниях"],
    ["Toast, ConnectSheet", "open", "Возврат с экрана подключения устройства"],
  ]

  return (
    <div className="flex max-w-[640px] flex-col gap-6">
      <section className="rounded-3xl border border-line bg-panel p-6">
        <h2 className="font-display text-xl font-bold tracking-tight">Компоненты</h2>
        <p className="mt-1 text-sm text-dim">
          Всё собрано по конвенциям shadcn: `cn` из `@/lib/utils`, варианты на CVA, примитивы Radix, `data-slot` на
          корне. Компонент из реестра подменяет наш одноимённый файл без правок в экранах.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Компонент", "Варианты", "Где используется"].map((h) => (
                  <th key={h} className="border-b border-line px-2.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-dim-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, variants, usage]) => (
                <tr key={name}>
                  <td className="border-b border-line px-2.5 py-2.5 align-top font-semibold">{name}</td>
                  <td className="border-b border-line px-2.5 py-2.5 align-top text-dim">{variants}</td>
                  <td className="border-b border-line px-2.5 py-2.5 align-top text-dim">{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-panel p-6">
        <h2 className="font-display text-xl font-bold tracking-tight">Как подключить @fluid</h2>
        <p className="mt-1 text-sm text-dim">
          Реестр не скачивается из этой сессии: `ui.shadcn.com` закрыт сетевой политикой окружения. На машине с доступом
          порядок такой:
        </p>
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          {[
            "npx shadcn@latest registry add @fluid — команда сама пропишет адрес реестра в components.json",
            "npx shadcn@latest add @fluid/button — файл ляжет в src/components/ui и заменит наш button.tsx",
            "Проверить, что варианты совпадают: экраны обращаются к variant и size, а не к классам",
          ].map((t, i) => (
            <li key={t} className="flex gap-2.5">
              <span className="grid size-5.5 shrink-0 place-items-center rounded-lg bg-card-2 font-display text-[11px] font-bold text-mint">
                {i + 1}
              </span>
              <span className="text-dim">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 border-l-2 border-amber pl-3.5 text-[13.5px] text-dim">
          Пока реестр недоступен, компоненты написаны вручную по тем же конвенциям. Подмена — это замена файла в
          `src/components/ui`, экраны трогать не нужно.
        </p>
      </section>
    </div>
  )
}
