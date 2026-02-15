-- Выполните в Supabase Dashboard → SQL Editor
-- 1. tele_post
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
CREATE INDEX IF NOT EXISTS idx_tele_post_channel ON tele_post(channel_name);
CREATE INDEX IF NOT EXISTS idx_tele_post_reactions ON tele_post(channel_name, reactions DESC);
CREATE INDEX IF NOT EXISTS idx_tele_post_date ON tele_post(channel_name, id DESC);

-- 2. telegram_users (для webhook /start)
CREATE TABLE IF NOT EXISTS telegram_users (
    username TEXT PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
