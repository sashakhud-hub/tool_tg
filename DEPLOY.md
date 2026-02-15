# Деплой TeleTools на Supabase + Vercel

## 1. Миграции в Supabase

1. Открой [Supabase Dashboard](https://supabase.com/dashboard) → твой проект
2. **SQL Editor** → New query
3. Скопируй содержимое `supabase/setup.sql` и выполни

## 2. Установка Supabase CLI и логин

```bash
npm install -g supabase
supabase login
```

## 3. Деплой Edge Functions

```bash
cd /Users/aleksandrhudiakov/Desktop/teletools_ngi-main
supabase functions deploy --project-ref bjyrsepsoysymdaspqdq --no-verify-jwt
```

## 4. Секреты (Supabase Dashboard)

**Project Settings** → **Edge Functions** → **Secrets** — добавь:

- `TELEGRAM_BOT_TOKEN` — токен от @BotFather
- `GOOGLE_API_KEY` — ключ из AI Studio
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (Settings → API)

## 5. Webhook для Telegram-бота

**Важно:** Сначала задеплой функции (шаг 3), иначе webhook получит 404.

Открой в браузере (подставь свой TOKEN):

```
https://api.telegram.org/bot8224486265:AAEGXi7ApQPc7Db90a7uYAX7PppaJUq0Wqk/setWebhook?url=https://bjyrsepsoysymdaspqdq.supabase.co/functions/v1/telegram-webhook
```

## 6. Vercel — переменная окружения

**Vercel** → Project → **Settings** → **Environment Variables**:

| Name | Value |
|------|-------|
| VITE_API_URL | https://bjyrsepsoysymdaspqdq.supabase.co/functions/v1 |

Пересобери проект (Redeploy).

---

## Автодеплой через GitHub

1. [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) → Access Tokens → Generate
2. GitHub → репо **tool_tg** → Settings → Secrets → **SUPABASE_ACCESS_TOKEN**
3. При push в `supabase/functions/` функции задеплоятся автоматически.
