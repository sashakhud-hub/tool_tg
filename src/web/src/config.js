/**
 * Базовый URL API.
 * - Пустая строка: dev (Vite proxy на localhost:8000)
 * - Supabase: https://xxx.supabase.co/functions/v1
 * - Railway: https://xxx.railway.app
 */
export const API_BASE = import.meta.env.VITE_API_URL || '';

const isSupabase = API_BASE.includes('supabase.co/functions');

/** URL для endpoint (совместимость Supabase Edge Functions и FastAPI) */
export function apiUrl(path, params = '') {
  if (!API_BASE) return `/api${path}${params}`;
  if (isSupabase) {
    const map = {
      '/channels': '/channels',
      '/posts': '/posts',
      '/parse': '/parse',
      '/format': '/format',
      '/send-telegram': '/send-telegram',
      '/channel-posts': '/channel-posts',
      '/ai-search': '/ai-search',
      '/toolkit/generate': '/toolkit-generate',
      '/missed/search': '/missed-search',
      '/gemini-models': '/gemini-models',
      '/posts/download': '/posts-download',
    };
    for (const [k, v] of Object.entries(map)) {
      if (path === k) return `${API_BASE}${v}${params}`;
    }
    if (path.startsWith('/channel-posts/')) {
      const ch = path.replace('/channel-posts/', '');
      return `${API_BASE}/channel-posts?channel=${encodeURIComponent(ch)}`;
    }
  }
  return `${API_BASE}/api${path}${params}`;
}
