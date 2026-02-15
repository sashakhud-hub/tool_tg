from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from src.db.posts_repo import get_posts, channel_exists

router = APIRouter()

class Post(BaseModel):
    id: int
    url: str
    text: str
    date: str
    reactions: int = 0

class PostsResponse(BaseModel):
    total: int
    posts: List[Post]

@router.get("/posts", response_model=PostsResponse)
async def get_posts_route(
    channel_name: str = Query(..., description="Name of the channel (e.g., 'NGI_ru')"),
    sort_by: str = Query("date", enum=["date", "reactions"]),
    order: str = Query("desc", enum=["asc", "desc"]),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None
):
    """Get channel posts with sorting and filtering (Supabase or JSON)."""
    if not channel_exists(channel_name):
        raise HTTPException(status_code=404, detail=f"Channel {channel_name} not found")
    posts_data, total = get_posts(channel_name, sort_by, order, limit, offset, search)
    return PostsResponse(total=total, posts=posts_data)
