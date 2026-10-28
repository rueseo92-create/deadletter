"""사진 정리: 촬영 시각순 정렬, 크기 조정, 위치정보(GPS) 등 메타데이터 제거, 키워드 파일명."""
import base64
import io
import re
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

try:
    import pillow_heif  # 아이폰 HEIC
    pillow_heif.register_heif_opener()
    EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
except ImportError:
    EXT = {".jpg", ".jpeg", ".png", ".webp"}


def _taken(path: Path) -> datetime:
    try:
        exif = Image.open(path).getexif()
        raw = exif.get_ifd(0x8769).get(36867) or exif.get(306)  # DateTimeOriginal / DateTime
        if raw:
            return datetime.strptime(str(raw), "%Y:%m:%d %H:%M:%S")
    except Exception:
        pass
    return datetime.fromtimestamp(path.stat().st_mtime)


def collect(folder: Path, limit: int) -> list[Path]:
    files = [p for p in folder.iterdir() if p.suffix.lower() in EXT]
    skipped = [p.name for p in folder.iterdir() if p.suffix.lower() in {".heic", ".heif"} and p not in files]
    if skipped:
        print(f"  ! HEIC 사진 {len(skipped)}장은 pillow-heif 설치 후 읽을 수 있습니다: pip install pillow-heif")
    return sorted(files, key=_taken)[:limit]


def slug(text: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]+", "-", text).strip("-")[:40] or "photo"


def export(files: list[Path], out_dir: Path, name: str, long_edge: int, quality: int) -> list[Path]:
    """EXIF(GPS 포함)를 지운 JPEG 로 저장한다. 파일명: {키워드}-01.jpg"""
    out_dir.mkdir(parents=True, exist_ok=True)
    out = []
    for i, src in enumerate(files, 1):
        img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        img.thumbnail((long_edge, long_edge))
        dst = out_dir / f"{slug(name)}-{i:02d}.jpg"
        img.save(dst, "JPEG", quality=quality, optimize=True)  # exif 미포함 → 위치정보 제거
        out.append(dst)
    return out


def vision_block(path: Path, edge: int = 768) -> dict:
    img = Image.open(path).convert("RGB")
    img.thumbnail((edge, edge))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=80)
    return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg",
                                        "data": base64.standard_b64encode(buf.getvalue()).decode()}}
