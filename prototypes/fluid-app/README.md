# Первый опыт на компонентах

React-версия прототипа первого опыта: тот же сценарий, что в `prototypes/first-experience/index.html`,
но собранный из переиспользуемых компонентов.

## Запуск

```bash
npm install
npm run dev     # разработка
npm run build   # сборка в dist/
```

## Компоненты

`src/components/ui` — база по конвенциям shadcn: утилита `cn`, варианты на CVA, примитивы Radix,
`data-slot` на корневом элементе. Экраны обращаются к `variant` и `size`, а не к классам, поэтому
компонент из реестра подменяет наш одноимённый файл без правок в экранах.

| Файл | Что внутри |
| --- | --- |
| `ui/button.tsx` | `Button` (default, ghost, outline, quiet) и `ButtonKnob` — вложенный кружок со стрелкой |
| `ui/card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardBezel` (двойной бортик) |
| `ui/badge.tsx` | `Badge` (default, ok, warn, bad), `BadgeDot` |
| `ui/progress.tsx` | Прогресс анкет и полноты данных |
| `ui/input.tsx` | Поле свободного ввода цели, вес и рост |
| `ui/choice.tsx` | `ChoiceTile` — плитка множественного выбора, `ChoiceRow` — строка списка |
| `ui/segmented.tsx` | Переключатель шаги / сон / ресурс |
| `ui/toast.tsx` | Возврат с экрана подключения устройства |

`src/components/chat` — экранные блоки: реплики и инсайт (`primitives.tsx`), рама телефона и экран
подключения (`phone.tsx`), виджеты ленты и галереи (`widgets.tsx`).

## Реестр @fluid

Команда `npx shadcn@latest registry add @fluid` в этой среде не отрабатывает: `ui.shadcn.com` закрыт
сетевой политикой окружения (403 на CONNECT). На машине с доступом:

```bash
npx shadcn@latest registry add @fluid    # пропишет адрес реестра в components.json
npx shadcn@latest add @fluid/button      # заменит src/components/ui/button.tsx
```

После подмены стоит проверить, что набор `variant` и `size` совпадает с тем, что используют экраны.
