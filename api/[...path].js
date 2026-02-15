/** Заглушка для /api/* на Vercel — укажите VITE_API_URL на Supabase Functions */
export default function handler(req, res) {
  res.status(503).json({
    error: 'Backend not configured',
    message: 'Укажите VITE_API_URL = https://YOUR_PROJECT.supabase.co/functions/v1',
  });
}
