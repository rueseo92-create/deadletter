"""틱톡 트렌드 리서치 (메타데이터만, 영상은 받지 않는다).

공개 검색 결과(또는 직접 모은 링크 목록)에서 조회수·좋아요·댓글·길이·설명·해시태그만 읽어
어떤 주제와 후킹이 반응을 얻는지 분석하고, 그 결과를 data/insights.md 에 덧붙인다.
쇼츠 소재 제안(ideas suggest)과 대본 작성(script)이 이 인사이트를 읽는다.

남의 영상을 내려받거나 다시 올리지 않는다. 여기서 얻는 건 '무엇이 먹히는가'라는 정보뿐이다.

원본: tiktok-practice/main.py 의 검색(discover)·조회수 정렬 로직을 메타데이터 전용으로 옮김.
틱톡이 로그인 벽·CAPTCHA·지역 제한을 걸면 실패할 수 있고, 이를 우회하지 않는다.
그때는 브라우저에서 모은 공개 링크를 파일로 넣는다(--urls).
"""
import re
import time
from collections import Counter
from pathlib import Path
from urllib.parse import quote

from pydantic import BaseModel

from . import db, llm
from .config import DATA

PATTERN = re.compile(r"https://www\.tiktok\.com/@[^/]+/video/\d+")

SCHEMA = """
CREATE TABLE IF NOT EXISTS tiktok_trends (
  video_id TEXT PRIMARY KEY,
  query TEXT, url TEXT, creator TEXT, description TEXT, hashtags TEXT,
  duration_s REAL, view_count INTEGER, like_count INTEGER, comment_count INTEGER,
  upload_date TEXT, found_at TEXT
);
"""


def init():
    with db.connect() as c:
        c.executescript(SCHEMA)


def discover(query: str, limit: int = 30, headless: bool = True) -> list[str]:
    """공개 검색 결과 페이지에서 영상 링크만 모은다 (Playwright 필요)."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("playwright 가 없습니다: pip install playwright && python -m playwright install chromium")
    found: list[str] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        try:
            page = browser.new_page()
            page.goto("https://www.tiktok.com/search?q=" + quote(query), timeout=60000,
                      wait_until="domcontentloaded")
            for _ in range(12):
                page.wait_for_timeout(2000)
                links = page.locator('a[href*="/video/"]').evaluate_all("(els) => els.map(e => e.href)")
                for link in links:
                    m = PATTERN.match(link)
                    if m and m[0] not in found:
                        found.append(m[0])
                if len(found) >= limit:
                    break
                page.mouse.wheel(0, 1000)
        finally:
            browser.close()
    if not found:
        raise SystemExit("공개 검색에서 링크를 찾지 못했습니다(로그인 벽·접근 제한·페이지 변경 가능). "
                         "브라우저에서 모은 링크를 파일로 넣어 --urls 로 다시 실행하세요.")
    return found[:limit]


def _tags(text: str) -> list[str]:
    return [t.lower() for t in re.findall(r"#([0-9A-Za-z가-힣_]+)", text or "")]


def collect(query: str, urls: list[str], extract=None) -> dict:
    """링크마다 메타데이터만 읽어 저장한다. extract: 테스트용 주입 (url -> info dict)."""
    init()
    if extract is None:
        from yt_dlp import YoutubeDL
        ydl = YoutubeDL({"quiet": True, "noplaylist": True, "skip_download": True, "socket_timeout": 20,
                         "retries": 1, "extractor_retries": 1, "cachedir": False})
        extract = lambda u: ydl.extract_info(u, download=False)  # noqa: E731
    ok, errors = 0, []
    urls = list(dict.fromkeys(u.strip() for u in urls if PATTERN.fullmatch(u.strip())))
    for url in urls:
        try:
            info = extract(url)
        except Exception as e:
            errors.append(f"{url}: {str(e)[:120]}")
            continue
        desc = info.get("description") or info.get("title") or ""
        tags = list(dict.fromkeys(_tags(desc) + [t.lower() for t in (info.get("tags") or [])]))
        with db.connect() as c:
            c.execute("INSERT OR REPLACE INTO tiktok_trends VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                      (str(info.get("id") or url.rsplit("/", 1)[-1]), query, url, info.get("uploader") or "",
                       desc[:500], " ".join(tags), info.get("duration"), info.get("view_count"),
                       info.get("like_count"), info.get("comment_count"), info.get("upload_date") or "", db.now()))
        ok += 1
        time.sleep(1)
    return {"saved": ok, "errors": errors}


def stats(query: str | None = None, top: int = 40) -> dict:
    """API 호출 없이 계산하는 기본 통계: 조회수 상위의 길이·해시태그·참여율."""
    init()
    with db.connect() as c:
        q = "SELECT * FROM tiktok_trends WHERE view_count IS NOT NULL"
        args = ()
        if query:
            q += " AND query = ?"
            args = (query,)
        rows = c.execute(q + " ORDER BY view_count DESC LIMIT ?", (*args, top)).fetchall()
    if not rows:
        return {"count": 0}
    durs = sorted(r["duration_s"] for r in rows if r["duration_s"])
    eng = [((r["like_count"] or 0) + (r["comment_count"] or 0)) / r["view_count"] * 100
           for r in rows if r["view_count"]]
    tags = Counter(t for r in rows for t in (r["hashtags"] or "").split() if t)
    return {
        "count": len(rows),
        "median_duration_s": durs[len(durs) // 2] if durs else None,
        "median_engagement_pct": round(sorted(eng)[len(eng) // 2], 2) if eng else None,
        "top_hashtags": tags.most_common(15),
        "rows": rows,
    }


class TrendInsight(BaseModel):
    winning_topics: list[str]
    hook_patterns: list[str]
    length_advice: str
    hashtags_to_use: list[str]
    original_ideas: list[str]
    avoid: list[str]


def analyze(cfg: dict, query: str | None = None) -> str:
    """상위 영상의 설명·수치만 보고 '형식'을 뽑아 insights.md 에 덧붙인다. 특정 영상 복제 아이디어는 만들지 않는다."""
    s = stats(query)
    if not s["count"]:
        raise SystemExit("수집된 틱톡 데이터가 없습니다. 먼저 `tiktok collect` 를 실행하세요.")
    table = "\n".join(
        f"- [{r['view_count']:,}회, 좋아요 {r['like_count'] or 0:,}, {r['duration_s'] or '?'}초] {r['description'][:140]}"
        for r in s["rows"])
    ins = llm.parse(
        cfg["script"]["model"],
        "너는 숏폼 트렌드 분석가다. 남의 영상을 따라 만들라는 게 아니라, 반응을 얻는 주제와 구조를 뽑아 "
        "우리 채널이 '직접 만든 원본'으로 다룰 수 있는 아이디어로 바꾼다. 특정 크리에이터·영상을 복제하는 제안 금지.",
        f"우리 채널 니치: {cfg['niche']}\n검색어: {query or '(전체)'}\n"
        f"상위 영상 중앙 길이: {s['median_duration_s']}초, 중앙 참여율: {s['median_engagement_pct']}%\n"
        f"많이 쓰인 해시태그: {', '.join(t for t, _ in s['top_hashtags'])}\n\n상위 영상:\n{table}\n\n"
        "반응 좋은 주제, 첫 1-2초 후킹 패턴, 적정 길이 조언, 우리가 쓸 해시태그, 우리 니치에 맞춘 원본 아이디어 5개, 피할 것을 정리해라.",
        TrendInsight,
    )
    md = ["", f"# 틱톡 트렌드 인사이트 ({query or '전체'})", "",
          f"상위 {s['count']}개 기준 중앙 길이 {s['median_duration_s']}초, 중앙 참여율 {s['median_engagement_pct']}%", "",
          "## 반응 좋은 주제", *[f"- {x}" for x in ins.winning_topics], "",
          "## 후킹 패턴", *[f"- {x}" for x in ins.hook_patterns], "",
          f"## 길이\n{ins.length_advice}", "",
          "## 해시태그", " ".join("#" + t.lstrip("#") for t in ins.hashtags_to_use), "",
          "## 우리 채널용 원본 아이디어", *[f"- {x}" for x in ins.original_ideas], "",
          "## 피할 것", *[f"- {x}" for x in ins.avoid], ""]
    path = DATA / "insights.md"
    old = path.read_text(encoding="utf-8") if path.exists() else ""
    # 같은 검색어의 이전 틱톡 섹션은 교체
    old = re.sub(rf"\n# 틱톡 트렌드 인사이트 \({re.escape(query or '전체')}\).*?(?=\n# |\Z)", "", old, flags=re.S)
    path.write_text(old.rstrip() + "\n" + "\n".join(md), encoding="utf-8")
    return str(path)


def read_urls(path: Path) -> list[str]:
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
