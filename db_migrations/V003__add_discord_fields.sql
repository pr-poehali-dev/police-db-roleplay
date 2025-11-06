-- Добавление полей Discord для интеграции с Discord ботом

-- Добавляем Discord ID и username к гражданам
ALTER TABLE citizens 
ADD COLUMN IF NOT EXISTS discord_user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS discord_username VARCHAR(255);

-- Создаём индекс для быстрого поиска по Discord ID
CREATE INDEX IF NOT EXISTS idx_citizens_discord_user_id ON citizens(discord_user_id);

-- Добавляем Discord ID к пользователям системы
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS discord_user_id VARCHAR(255);

-- Создаём индекс для быстрого поиска пользователей по Discord ID
CREATE INDEX IF NOT EXISTS idx_users_discord_user_id ON users(discord_user_id);

-- Добавляем уникальность Discord ID для граждан (один Discord аккаунт = один персонаж)
CREATE UNIQUE INDEX IF NOT EXISTS idx_citizens_discord_unique ON citizens(discord_user_id) WHERE discord_user_id IS NOT NULL;
