import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
INBOX = ROOT / "inbox"
OUT = ROOT / "out"
DATA = ROOT / "data"
STYLE_FILE = DATA / "style.md"
EXAMPLES_FILE = DATA / "style_examples.txt"
QUEUE_FILE = DATA / "queue.json"


def load() -> dict:
    try:
        from dotenv import load_dotenv
        load_dotenv(ROOT / ".env")
        load_dotenv(ROOT.parent / ".env")
    except ImportError:
        pass
    path = ROOT / "config.json"
    if not path.exists():
        path = ROOT / "config.example.json"
    for d in (INBOX, OUT, DATA):
        d.mkdir(parents=True, exist_ok=True)
    return json.loads(path.read_text(encoding="utf-8"))


def require_key():
    if not (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")):
        raise SystemExit("ANTHROPIC_API_KEY 가 없습니다. naver_blog/.env 에 넣어 주세요.")
