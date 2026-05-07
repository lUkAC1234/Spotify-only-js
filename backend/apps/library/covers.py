import logging
from io import BytesIO
from pathlib import Path
from typing import Iterable

import httpx
from django.conf import settings
from PIL import Image

from .models import Playlist, PlaylistItem

logger = logging.getLogger(__name__)

MOSAIC_SIZE = 600
TILE_SIZE = MOSAIC_SIZE // 2
COVER_TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
WEBP_QUALITY = 82


def _mosaic_dir() -> Path:
    return Path(settings.MEDIA_ROOT) / "playlist-covers"


def _mosaic_url(playlist_id: int, version: int) -> str:
    base = settings.MEDIA_URL.rstrip("/")
    return f"{base}/playlist-covers/{playlist_id}.webp?v={version}"


def _collect_cover_urls(playlist_id: int, *, limit: int = 4) -> list[str]:
    items = (
        PlaylistItem.objects.filter(playlist_id=playlist_id)
        .select_related("track__album")
        .order_by("position")
    )
    seen: set[str] = set()
    urls: list[str] = []
    for item in items:
        track = item.track
        url = (track.cover or (track.album.cover if track.album_id else "")) or ""
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append(url)
        if len(urls) >= limit:
            break
    return urls


def _download_image(url: str) -> Image.Image | None:
    try:
        with httpx.Client(timeout=COVER_TIMEOUT, follow_redirects=True) as client:
            response = client.get(url)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGB")
            return image.resize((TILE_SIZE, TILE_SIZE), Image.LANCZOS)
    except Exception as exc:
        logger.warning("Failed to fetch cover %s: %s", url, exc)
        return None


def _build_canvas(images: Iterable[Image.Image | None]) -> Image.Image:
    positions = [(0, 0), (TILE_SIZE, 0), (0, TILE_SIZE), (TILE_SIZE, TILE_SIZE)]
    canvas = Image.new("RGB", (MOSAIC_SIZE, MOSAIC_SIZE), color=(28, 28, 28))
    for image, position in zip(images, positions):
        if image is not None:
            canvas.paste(image, position)
    return canvas


def regenerate_playlist_mosaic(playlist: Playlist) -> str:
    if playlist.is_system:
        return playlist.cover_mosaic

    cover_urls = _collect_cover_urls(playlist.pk, limit=4)
    if len(cover_urls) < 4:
        if playlist.cover_mosaic:
            playlist.cover_mosaic = ""
            playlist.save(update_fields=["cover_mosaic", "updated_at"])
        return ""

    images = [_download_image(url) for url in cover_urls[:4]]
    canvas = _build_canvas(images)

    target_dir = _mosaic_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{playlist.pk}.webp"

    buffer = BytesIO()
    canvas.save(buffer, format="WEBP", quality=WEBP_QUALITY)
    target_path.write_bytes(buffer.getvalue())

    version = int(playlist.updated_at.timestamp()) if playlist.updated_at else 0
    new_url = _mosaic_url(playlist.pk, version)
    playlist.cover_mosaic = new_url
    playlist.save(update_fields=["cover_mosaic", "updated_at"])
    return new_url
