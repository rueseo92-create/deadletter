"""② 소재 수집 (4강).

소재 출처는 세 가지다.
- form:    시청자 사연 제보(구글 폼 응답 CSV). 가장 안전한 1순위 소재.
- manual:  직접 메모한 소재.
- suggest: 인사이트 + 학습 가중치를 바탕으로 LLM이 만든 '창작' 소재.

커뮤니티 글은 원문을 저장하지 않는다. 참고했다면 요지만 manual 로 한 줄 적는다.
"""
import csv
from pathlib import Path

from pydantic import BaseModel

from . import db, learn, llm, research


def add(title: str, summary: str, category: str | None = None, source: str = "manual") -> int:
    with db.connect() as c:
        cur = c.execute("INSERT INTO ideas (source, title, summary, category, created_at) "
                        "VALUES (?,?,?,?,?)", (source, title.strip(), summary.strip(), category, db.now()))
        return cur.lastrowid


def _pick(row: dict, *names) -> str:
    for k, v in row.items():
        if k and any(n in k.lower() for n in names):
            return (v or "").strip()
    return ""


def import_csv(path: str) -> int:
    """구글 폼 응답 CSV. 헤더에 '제목'과 '사연/내용' 이 들어간 열을 찾고,
    '동의' 열이 있으면 '예/동의' 로 답한 행만 가져온다."""
    n = 0
    with open(Path(path), encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            consent = _pick(row, "동의", "consent")
            if consent and not any(w in consent for w in ("예", "동의", "yes", "Yes")):
                continue
            body = _pick(row, "사연", "내용", "story", "summary")
            if len(body) < 30:
                continue
            title = _pick(row, "제목", "title") or body[:30]
            add(title, body, _pick(row, "분류", "카테고리", "category") or None, source="form")
            n += 1
    return n


class IdeaItem(BaseModel):
    title: str
    summary: str
    category: str


class IdeaBatch(BaseModel):
    ideas: list[IdeaItem]


def suggest(cfg: dict, n: int = 6) -> int:
    weights = learn.top_weights("category")
    dropped = set(learn.dropped_categories(cfg))
    cats = [c for c in cfg["categories"] if c not in dropped] or cfg["categories"]
    with db.connect() as c:
        recent = [r["title"] for r in c.execute(
            "SELECT title FROM ideas ORDER BY id DESC LIMIT 60").fetchall()]
    w_txt = ", ".join(f"{k}({v:.2f})" for k, v in weights) or "아직 데이터 없음 - 고르게 분배"
    batch = llm.parse(
        cfg["script"]["model"],
        "너는 쇼츠 썰 채널의 기획 작가다. 실존 인물·기업·사건을 쓰지 않는 창작 에피소드만 만든다. "
        "다른 채널이나 커뮤니티 글을 재현하지 말고, 일상에서 있을 법한 새 상황을 만든다.",
        f"채널 니치: {cfg['niche']}\n카테고리: {', '.join(cats)}\n"
        f"카테고리 성과 가중치(높을수록 더 많이): {w_txt}\n\n"
        f"형식 인사이트:\n{research.load_insights() or '(없음)'}\n\n"
        "최근에 쓴 소재(중복 금지):\n" + "\n".join(f"- {t}" for t in recent) + "\n\n"
        f"새 소재 {n}개. summary 는 3~5문장으로 기승전결과 반전 포인트를 포함한다. "
        "category 는 위 카테고리 중 하나.",
        IdeaBatch,
    )
    for it in batch.ideas[:n]:
        cat = it.category if it.category in cats else None
        add(it.title, it.summary, cat, source="suggest")
    return len(batch.ideas[:n])


def queue_size() -> int:
    with db.connect() as c:
        return c.execute("SELECT COUNT(*) FROM ideas WHERE status='new'").fetchone()[0]


def next_ideas(cfg: dict, limit: int):
    """제보(form) 우선, 그다음 가중치 높은 카테고리 순. 제외된 카테고리는 제보만 허용."""
    weights = dict(learn.top_weights("category"))
    dropped = set(learn.dropped_categories(cfg))
    with db.connect() as c:
        rows = [r for r in c.execute("SELECT * FROM ideas WHERE status='new'").fetchall()
                if r["source"] == "form" or r["category"] not in dropped]
    rows.sort(key=lambda r: (r["source"] != "form", -weights.get(r["category"], 0.5), r["id"]))
    return rows[:limit]
