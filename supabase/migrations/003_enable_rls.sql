-- Включаем RLS на таблицах (закрываем прямой доступ через anon key)
ALTER TABLE public.tele_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

-- Политики не нужны: Edge Functions используют service_role и обходят RLS
-- Анонимный доступ (anon key) будет полностью заблокирован
