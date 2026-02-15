-- Таблица для кэша username -> chat_id (Telegram бот)
CREATE TABLE IF NOT EXISTS telegram_users (
    username TEXT PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
