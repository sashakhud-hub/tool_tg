# TeleTools

**TeleTools** — это мощный набор инструментов для работы с Telegram-каналами. Анализируйте контент, находите интересные посты с помощью AI, генерируйте новые идеи и форматируйте сообщения для отправки.

![TeleTools UI](assets/app_demo.png)

## Возможности

### 1. 📥 Парсер
Загрузка и обработка истории сообщений канала.
- Поддержка экспорта из Telegram Desktop (`messages.html`).
- Извлечение текста, дат и реакций.
- Сохранение в JSON для далнейшей работы.

### 2. 📊 Посты (View Posts)
Просмотр всей базы постов канала.
- Таблица с сортировкой по **Дате** и **Реакциям**.
- Поиск по тексту поста.
- Быстрый переход к оригиналу.

### 3. ✍️ Тулкит Автора
Инструмент для креаторов.
- **Контекстный поиск**: выберите лучшие посты (например, с максимумом реакций).
- **AI Генерация**: попросите Gemini предложить новые темы, переписать пост или сделать саммари на основе выбранных.
- **Настройки**: выбор модели (Gemini 2.0 Flash/Pro/Lite) и температуры креативности.
- **Превью**: удобный просмотр полного текста поста перед выбором.

### 4. ✨ Что пропустил (Missed Posts)
Персонализированная лента обновлений.
- Укажите свои интересы (например, "AI, Python, Startups").
- Выберите период (последние 3, 7, 30 дней).
- AI найдёт самые релевантные посты, которые вы могли пропустить.

### 5. 🔍 Подборки (AI Search / Digests)
Семантический поиск по всей истории канала.
- Задавайте вопросы на естественном языке: *"Найди все посты про инвестиции в крипту"*.
- Получайте список постов с кратким содержанием и ссылками.
- Отправляйте готовую подборку себе в Telegram в один клик.

### 6. 🎨 Форматтер
Инструмент для оформления постов.
- Превращает Markdown (из ChatGPT/Gemini/Claude) в правильный HTML для Telegram.
- Поддерживает **жирный**, *курсив*, [ссылки](url), списки.
- Предпросмотр перед отправкой.

---

## Установка и Запуск

### Предварительные требования
- **Docker**
- **Google API Key** (для AI функций)
- **Telegram Bot Token** (для отправки сообщений)

### 1. Клонирование и настройка

```bash
git clone https://github.com/vladkor97/teletools_ngi.git
cd teletools_ngi
cp .env.example .env
```

### 2. Конфигурация (.env)

Заполните файл `.env`:

```env
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
GOOGLE_API_KEY=ваш_ключ_от_AI_Studio
```

- **Bot token:** Напишите [@BotFather](https://t.me/BotFather) команду `/newbot`.
- **Google API Key:** Получите ключ в [Google AI Studio](https://aistudio.google.com/apikey).
- **Supabase** (опционально): URL и Service Role Key из [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API. Посты будут храниться в таблице `tele_post`. Без настроек — в JSON-файлах в `data/`.

  Создайте таблицу в Supabase SQL Editor (см. `supabase/migrations/001_create_tele_post.sql`):
  ```sql
  CREATE TABLE IF NOT EXISTS tele_post (
      id BIGINT NOT NULL,
      channel_name TEXT NOT NULL,
      url TEXT, text TEXT, date TEXT,
      reactions INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (channel_name, id)
  );
  CREATE INDEX IF NOT EXISTS idx_tele_post_channel ON tele_post(channel_name);
  ```

### 3. Запуск

```bash
docker compose up --build -d
```

Приложение будет доступно по адресу: [http://localhost:5173](http://localhost:5173)

### 4. Подключение бота

1. Найдите своего бота в Telegram.
2. Нажмите **Start** (или отправьте `/start`).
3. Теперь вы можете отправлять себе сообщения из интерфейса TeleTools.

---

## Использование

### Шаг 1: Экспорт данных
1. Откройте канал в **Telegram Desktop**.
2. Три точки (⋮) → **Export chat history**.
3. Формат: **HTML**. Галочки с фото/видео можно снять (нужен только текст).
4. Загрузите файл `messages.html` во вкладке **Парсер**.

### Шаг 2: Работа с контентом
- Используйте **Тулкит Автора** для анализа успешных постов.
- Ищите информацию через **Подборки**.
- Следите за трендами через **Что пропустил**.

---

## Деплой на Vercel + Supabase

### Архитектура
- **Фронтенд** (Vercel): React-приложение
- **Бэкенд** (Supabase Edge Functions): API вместо Railway

### 1. Supabase
1. Создайте проект на [Supabase](https://supabase.com)
2. Выполните миграции в SQL Editor:
   - `supabase/migrations/001_create_tele_post.sql`
   - `supabase/migrations/002_telegram_users.sql`
3. Разверните Edge Functions:
   ```bash
   supabase functions deploy channels
   supabase functions deploy posts
   supabase functions deploy channel-posts
   supabase functions deploy format
   supabase functions deploy parse
   supabase functions deploy send-telegram
   supabase functions deploy telegram-webhook
   supabase functions deploy gemini-models
   supabase functions deploy ai-search
   supabase functions deploy toolkit-generate
   supabase functions deploy missed-search
   supabase functions deploy posts-download
   ```
4. Добавьте секреты: `supabase secrets set TELEGRAM_BOT_TOKEN=xxx GOOGLE_API_KEY=xxx SUPABASE_SERVICE_ROLE_KEY=xxx`
5. Настройте webhook бота: `https://api.telegram.org/botTOKEN/setWebhook?url=https://PROJECT.supabase.co/functions/v1/telegram-webhook`

### 2. Vercel
1. Импортируйте репозиторий в [Vercel](https://vercel.com)
2. Environment Variables:
   - `VITE_API_URL` = `https://YOUR_PROJECT.supabase.co/functions/v1`

---

## Технологический стек

- **Backend**: Python, FastAPI, Pydantic, httpx
- **Frontend**: React, Vite, Lucide React
- **AI**: Google Gemini API
- **Telegram**: Telegram Bot API

---

## Лицензия

MIT
