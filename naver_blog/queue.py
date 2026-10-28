"""예약발행 대기열: 슬롯 추천과 발행 확인(RSS)."""
import json
import re
from datetime import datetime, timedelta, timezone

from . import style
from .config import QUEUE_FILE

KST = timezone(timedelta(hours=9))
DAYS = "월화수목금토일"


def load() -> list[dict]:
    try:
        return json.loads(QUEUE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def save(q: list[dict]):
    QUEUE_FILE.write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding="utf-8")


def next_slot(cfg: dict, q: list[dict]) -> str:
    taken = {x["slot"] for x in q if x.get("status") in ("ready", "published")}
    now = datetime.now(KST) + timedelta(hours=1)
    for d in range(0, 60):
        day = now + timedelta(days=d)
        for s in cfg["publish_slots"]:
            wd, hm = s.split()
            if DAYS[day.weekday()] != wd:
                continue
            h, m = map(int, hm.split(":"))
            t = day.replace(hour=h, minute=m, second=0, microsecond=0)
            label = f"{t:%Y-%m-%d} ({wd}) {hm}"
            if t > now and label not in taken:
                return label
    return "직접 정하기"


def add(cfg: dict, d: dict) -> str:
    q = [x for x in load() if x["folder"] != d["folder"]]
    slot = next_slot(cfg, q)
    q.append({"folder": d["folder"], "title": d["title"], "slot": slot, "status": "ready",
              "created": datetime.now(KST).isoformat(timespec="minutes")})
    save(q)
    return slot


def _n(s: str) -> str:
    return re.sub(r"\W+", "", s)


def sync(cfg: dict) -> list[str]:
    """RSS 에 올라온 글과 대기열 제목을 맞춰 published 로 바꾼다."""
    posts = style.rss_posts(cfg["blog_id"])
    q, done = load(), []
    for x in q:
        if x["status"] != "ready":
            continue
        for p in posts:
            if _n(x["title"])[:15] and (_n(x["title"])[:15] in _n(p["title"]) or _n(p["title"])[:15] in _n(x["title"])):
                x.update(status="published", url=p["url"], published=p["date"])
                done.append(f"{x['title']} → {p['url']}")
                break
    save(q)
    return done
