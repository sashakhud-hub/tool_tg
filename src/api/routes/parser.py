from fastapi import APIRouter, UploadFile, HTTPException, Form, Query
from fastapi.responses import FileResponse
from pathlib import Path
from urllib.parse import urlparse
import shutil
import json
import re
from src.etl.parser import TelegramExportParser
from src.db.posts_repo import save_posts, is_supabase_configured
from typing import List, Optional

router = APIRouter()

DATA_DIR = Path("data")


def _extract_channel_name(channel_link: str) -> str:
    """Извлекает username канала из ссылки (https://t.me/NGI_ru -> NGI_ru)."""
    link = channel_link.rstrip("/")
    parsed = urlparse(link)
    channel_name = parsed.path.strip("/").split("/")[-1]
    # Очищаем от небезопасных символов для имени файла
    channel_name = re.sub(r"[^\w\-]", "_", channel_name)
    return channel_name or "unknown"


@router.post("/parse")
async def parse_messages(
    file: UploadFile,
    channel_link: Optional[str] = Form("https://t.me/channel"),
):
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)

        # Имя канала для файлов
        channel_name = _extract_channel_name(channel_link)
        messages_file = DATA_DIR / f"messages_{channel_name}.html"
        posts_file = DATA_DIR / f"posts_{channel_name}.json"

        # Сохраняем загруженный файл
        with open(messages_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Парсим
        parser = TelegramExportParser(messages_file, channel_link=channel_link)
        posts = parser.parse()

        # Сохраняем в Supabase или JSON
        save_posts(channel_name, posts)
        if not is_supabase_configured():
            with open(posts_file, "w", encoding="utf-8") as f:
                json.dump(posts, f, ensure_ascii=False, indent=2)

        return {
            "message": "Successfully parsed messages",
            "count": len(posts),
            "channel_name": channel_name,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/posts/download")
async def download_posts(channel: str = Query("unknown")):
    """Скачивание posts JSON по имени канала."""
    from src.db.posts_repo import get_all_posts, channel_exists
    if not channel_exists(channel):
        raise HTTPException(status_code=404, detail=f"Channel '{channel}' not found")
    posts = get_all_posts(channel)
    # Возвращаем как JSON через Response
    from fastapi.responses import Response
    return Response(
        content=json.dumps(posts, ensure_ascii=False, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="posts_{channel}.json"'},
    )
