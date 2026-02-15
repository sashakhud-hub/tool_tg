-- Таблица tele_post для хранения постов Telegram-каналов
CREATE TABLE IF NOT EXISTS tele_post (
    id BIGINT NOT NULL,
    channel_name TEXT NOT NULL,
    url TEXT,
    text TEXT,
    date TEXT,
    reactions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_name, id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_tele_post_channel ON tele_post(channel_name);
CREATE INDEX IF NOT EXISTS idx_tele_post_reactions ON tele_post(channel_name, reactions DESC);
CREATE INDEX IF NOT EXISTS idx_tele_post_date ON tele_post(channel_name, id DESC);

-- Сервисный ключ (service_role) обходит RLS — для backend этого достаточно
