#!/bin/bash
# Деплой Edge Functions в Supabase
# Требует: supabase login, supabase link --project-ref bjyrsepsoysymdaspqdq

set -e
PROJECT_REF="bjyrsepsoysymdaspqdq"
cd "$(dirname "$0")/.."

echo "=== Деплой Edge Functions ==="
supabase functions deploy --project-ref "$PROJECT_REF" --no-verify-jwt

echo ""
echo "=== Секреты (запустите вручную с вашими ключами) ==="
echo "supabase secrets set --project-ref $PROJECT_REF \\"
echo "  TELEGRAM_BOT_TOKEN=ваш_токен \\"
echo "  GOOGLE_API_KEY=ваш_ключ \\"
echo "  SUPABASE_SERVICE_ROLE_KEY=ваш_service_role_key"
echo ""
echo "=== Webhook бота ==="
echo "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://$PROJECT_REF.supabase.co/functions/v1/telegram-webhook"
