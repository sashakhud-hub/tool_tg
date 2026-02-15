/**
 * Базовый URL API. В dev — пустая строка (Vite proxy на localhost:8000).
 * В production (Vercel) — URL бэкенда, например https://teletools-api.railway.app
 */
export const API_BASE = import.meta.env.VITE_API_URL || '';
