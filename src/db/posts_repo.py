"""
Репозиторий постов — Supabase или JSON-файлы.
Если настроен Supabase — используется tele_post. Иначе — data/posts_*.json.
"""
import json
import re
from pathlib import Path
from typing import List, Dict, Optional

from src.db.supabase_client import get_supabase, is_supabase_configured

DATA_DIR = Path("data")
TABLE = "tele_post"


def _safe_channel(name: str) -> str:
    return "".join(c for c in name if c.isalnum() or c in ("_", "-")) or "unknown"


# --- Supabase ---


def _supabase_channels() -> List[str]:
    sb = get_supabase()
    if not sb:
        return []
    try:
        r = sb.table(TABLE).select("channel_name").execute()
        channels = list({row["channel_name"] for row in (r.data or [])})
        return sorted(channels)
    except Exception:
        return []


def _supabase_insert_posts(channel_name: str, posts: List[Dict]) -> int:
    sb = get_supabase()
    if not sb:
        return 0
    channel = _safe_channel(channel_name)
    rows = [
        {
            "id": p["id"],
            "channel_name": channel,
            "url": p.get("url", ""),
            "text": p.get("text", ""),
            "date": p.get("date", ""),
            "reactions": p.get("reactions", 0),
        }
        for p in posts
    ]
    try:
        sb.table(TABLE).upsert(rows, on_conflict="channel_name,id").execute()
        return len(rows)
    except Exception:
        raise


def _supabase_get_posts(
    channel_name: str,
    sort_by: str = "id",
    order: str = "desc",
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None,
) -> tuple[List[Dict], int]:
    sb = get_supabase()
    if not sb:
        return [], 0
    channel = _safe_channel(channel_name)
    try:
        q = sb.table(TABLE).select("*", count="exact").eq("channel_name", channel)
        if search:
            q = q.ilike("text", f"%{search}%")
        order_col = "reactions" if sort_by == "reactions" else "id"  # date => id
        q = q.order(order_col, desc=(order == "desc"))
        r = q.range(offset, offset + limit - 1).execute()
        total = r.count if hasattr(r, "count") and r.count is not None else len(r.data or [])
        rows = r.data or []
        return [dict(p) for p in rows], total
    except Exception:
        return [], 0


def _supabase_get_all_posts(channel_name: str) -> List[Dict]:
    sb = get_supabase()
    if not sb:
        return []
    channel = _safe_channel(channel_name)
    try:
        r = sb.table(TABLE).select("id,url,text,date,reactions").eq("channel_name", channel).order("id", desc=False).execute()
        data = r.data or []
        return [{k: p[k] for k in ("id", "url", "text", "date", "reactions") if k in p} for p in data]
    except Exception:
        return []


# --- JSON fallback ---


def _json_channels() -> List[str]:
    channels = []
    if not DATA_DIR.exists():
        return channels
    if (DATA_DIR / "posts.json").exists():
        channels.append("default")
    for f in sorted(DATA_DIR.glob("posts_*.json")):
        name = f.stem.replace("posts_", "")
        if name:
            channels.append(name)
    return channels


def _json_insert_posts(channel_name: str, posts: List[Dict]) -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    channel = _safe_channel(channel_name)
    path = DATA_DIR / f"posts_{channel}.json"
    existing = []
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            existing = json.load(f)
    by_id = {p["id"]: p for p in existing}
    for p in posts:
        by_id[p["id"]] = p
    merged = sorted(by_id.values(), key=lambda x: x["id"])
    with open(path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    return len(posts)


def _json_get_posts(
    channel_name: str,
    sort_by: str = "date",
    order: str = "desc",
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
) -> tuple[List[Dict], int]:
    channel = _safe_channel(channel_name)
    path = DATA_DIR / f"posts_{channel}.json"
    if channel_name in ("default", "posts"):
        path = DATA_DIR / "posts.json"
    if not path.exists():
        return [], 0
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if search:
        s = search.lower()
        data = [p for p in data if s in (p.get("text") or "").lower()]
    total = len(data)
    reverse = order == "desc"
    key = "reactions" if sort_by == "reactions" else "id"
    data.sort(key=lambda x: x.get(key, 0), reverse=reverse)
    return data[offset : offset + limit], total


def _json_get_all_posts(channel_name: str) -> List[Dict]:
    channel = _safe_channel(channel_name)
    path = DATA_DIR / f"posts_{channel}.json"
    if channel_name in ("default", "posts"):
        path = DATA_DIR / "posts.json"
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# --- Public API ---


def list_channels() -> List[str]:
    if is_supabase_configured():
        return _supabase_channels()
    return _json_channels()


def save_posts(channel_name: str, posts: List[Dict]) -> int:
    if is_supabase_configured():
        return _supabase_insert_posts(channel_name, posts)
    return _json_insert_posts(channel_name, posts)


def get_posts(
    channel_name: str,
    sort_by: str = "date",
    order: str = "desc",
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
) -> tuple[List[Dict], int]:
    if is_supabase_configured():
        return _supabase_get_posts(channel_name, sort_by, order, limit, offset, search)
    return _json_get_posts(channel_name, sort_by, order, limit, offset, search)


def get_all_posts(channel_name: str) -> List[Dict]:
    if is_supabase_configured():
        return _supabase_get_all_posts(channel_name)
    return _json_get_all_posts(channel_name)


def channel_exists(channel_name: str) -> bool:
    return channel_name in list_channels()
