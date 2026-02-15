/**
 * Заглушка для /api/* на Vercel.
 * Возвращает понятную ошибку, если VITE_API_URL не настроен.
 * Бэкенд должен быть развёрнут на Railway/Render.
 */
export default function handler(req, res) {
  res.status(503).json({
    error: 'Backend not configured',
    message: 'Укажите VITE_API_URL в настройках Vercel и разверните бэкенд на Railway.',
  });
}
