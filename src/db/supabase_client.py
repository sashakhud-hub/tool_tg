"""Supabase client — используется только при наличии SUPABASE_URL и SUPABASE_KEY."""
import os
from typing import Optional

_supabase = None


def get_supabase():
    """Возвращает клиент Supabase или None, если не настроен."""
    global _supabase
    if _supabase is not None:
        return _supabase
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY", "")).strip()
    if not url or not key:
        return None
    try:
        from supabase import create_client
        _supabase = create_client(url, key)
        return _supabase
    except Exception:
        return None


def is_supabase_configured() -> bool:
    return get_supabase() is not None
