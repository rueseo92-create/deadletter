"""설정 로딩. config.json(없으면 config.example.json) + 환경변수."""
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = Path(os.environ.get("SHORTS_DATA_DIR", ROOT / "data"))
ASSETS = Path(os.environ.get("SHORTS_ASSETS_DIR", ROOT / "assets"))

AUDIO_DIR = DATA / "audio"
VIDEO_DIR = DATA / "videos"
WORK_DIR = DATA / "work"
DB_PATH = DATA / "loop.db"
TOKEN_PATH = DATA / "youtube_token.json"


def _load_dotenv():
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def load() -> dict:
    _load_dotenv()
    path = Path(os.environ.get("SHORTS_CONFIG", ROOT / "config.json"))
    if not path.exists():
        path = ROOT / "config.example.json"
    cfg = json.loads(path.read_text(encoding="utf-8"))
    for d in (DATA, AUDIO_DIR, VIDEO_DIR, WORK_DIR):
        d.mkdir(parents=True, exist_ok=True)
    return cfg


def env(name: str, required: bool = True) -> str:
    val = os.environ.get(name, "")
    if required and not val:
        raise SystemExit(f"환경변수 {name} 가 비어 있습니다. shorts_loop/.env 를 확인하세요.")
    return val
