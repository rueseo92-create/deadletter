"""
ai_news.py - AI 뉴스 소재 수집 (RSS) → 같은 사건을 다룬 기사 묶음 → 글 플랜

AI 뉴스 글은 여기서 모은 실제 기사만 근거로 쓴다. 기사에 없는 내용은 쓰지 않는다.
여러 매체가 함께 다룬 사건일수록, 최근일수록 우선한다. 이미 다룬 기사는 news_seen.json 으로 거른다.

미리보기:
  python ai_news.py
"""

import hashlib
import html
import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

SEEN_FILE = Path(__file__).parent / "news_seen.json"
UA = "Mozilla/5.0 (compatible; SeroAI-NewsBot/1.0; +https://seroai.xyz)"
WINDOW_HOURS = 48

FEEDS = [
    {"name": "구글 뉴스(생성형 AI)", "lang": "ko",
     "url": "https://news.google.com/rss/search?q=%EC%83%9D%EC%84%B1%ED%98%95+AI+when:2d&hl=ko&gl=KR&ceid=KR:ko"},
    {"name": "구글 뉴스(AI 에이전트)", "lang": "ko",
     "url": "https://news.google.com/rss/search?q=AI+%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8+when:2d&hl=ko&gl=KR&ceid=KR:ko"},
    {"name": "AI타임스", "lang": "ko", "url": "https://www.aitimes.com/rss/allArticle.xml"},
    {"name": "GeekNews", "lang": "ko", "url": "https://news.hada.io/rss/news"},
    {"name": "OpenAI", "lang": "en", "url": "https://openai.com/news/rss.xml"},
    {"name": "The Verge AI", "lang": "en", "url": "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"},
    {"name": "TechCrunch AI", "lang": "en", "url": "https://techcrunch.com/category/artificial-intelligence/feed/"},
]

# GeekNews 등 일반 기술 피드에서 AI 관련만 남기기
AI_WORDS = ["ai", "인공지능", "gpt", "llm", "챗gpt", "chatgpt", "claude", "클로드", "gemini", "제미나이",
            "openai", "오픈ai", "anthropic", "앤트로픽", "에이전트", "agent", "생성형", "딥러닝", "모델",
            "copilot", "코파일럿", "midjourney", "sora", "퍼플렉시티", "perplexity", "llama", "엔비디아", "nvidia"]

STOP = set("의 가 이 은 는 을 를 에 와 과 도 로 으로 에서 한 및 등 더 수 것 위해 대한 통해 또 the a an of to in for on and with is are by at as from new how why what".split())


def _get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read()


def _text(s: str, limit: int = 400) -> str:
    s = html.unescape(re.sub(r"<[^>]+>", " ", s or ""))
    return re.sub(r"\s+", " ", s).strip()[:limit]


def _date(s: str):
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try:
            d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _find(el, *names):
    for n in names:
        x = el.find(n)
        if x is not None and (x.text or x.get("href")):
            return x.text if x.text and x.text.strip() else x.get("href", "")
    return ""


def fetch_feed(feed: dict) -> list[dict]:
    root = ET.fromstring(_get(feed["url"]))
    atom = "{http://www.w3.org/2005/Atom}"
    items = root.findall(".//item") or root.findall(f".//{atom}entry")
    out = []
    for it in items:
        title = _text(_find(it, "title", f"{atom}title"), 200)
        link = _find(it, "link", f"{atom}link")
        pub = _date(_find(it, "pubDate", f"{atom}published", f"{atom}updated"))
        summary = _text(_find(it, "description", f"{atom}summary", f"{atom}content"))
        source = feed["name"]
        if feed["name"].startswith("구글 뉴스") and " - " in title:  # "제목 - 언론사"
            title, source = title.rsplit(" - ", 1)
        if title and link:
            out.append({"title": title.strip(), "url": link.strip(), "published": pub, "summary": summary,
                        "source": source.strip(), "lang": feed["lang"]})
    return out


def collect(hours: int = WINDOW_HOURS) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    items, seen_urls = [], set()
    for f in FEEDS:
        try:
            got = fetch_feed(f)
        except Exception as e:
            print(f"  [뉴스] {f['name']} 실패: {e}")
            continue
        for it in got:
            if it["published"] and it["published"] < cutoff:
                continue
            blob = (it["title"] + " " + it["summary"]).lower()
            if f["name"] in ("GeekNews",) and not any(w in blob for w in AI_WORDS):
                continue
            tkey = re.sub(r"\W+", "", it["title"])
            if it["url"] in seen_urls or tkey in seen_urls:
                continue
            seen_urls.update({it["url"], tkey})
            items.append(it)
        time.sleep(0.3)
    return items


def _tokens(s: str) -> set[str]:
    toks = re.findall(r"[A-Za-z][A-Za-z0-9.\-]+|[가-힣]{2,}", s.lower())
    return {t for t in toks if t not in STOP and len(t) >= 2}


def _key(url: str) -> str:
    return hashlib.sha1(url.encode()).hexdigest()[:16]


def load_seen() -> set[str]:
    try:
        return set(json.loads(SEEN_FILE.read_text(encoding="utf-8")))
    except Exception:
        return set()


def mark_seen(urls: list[str]):
    seen = load_seen() | {_key(u) for u in urls}
    SEEN_FILE.write_text(json.dumps(sorted(seen)[-3000:], ensure_ascii=False), encoding="utf-8")


MAJOR = ["openai", "오픈ai", "chatgpt", "챗gpt", "gpt", "anthropic", "앤트로픽", "claude", "클로드", "google",
         "구글", "gemini", "제미나이", "microsoft", "마이크로소프트", "copilot", "meta", "메타", "llama", "nvidia",
         "엔비디아", "apple", "애플", "naver", "네이버", "카카오", "삼성", "lg", "xai", "grok", "deepseek",
         "딥시크", "mistral", "perplexity", "퍼플렉시티", "midjourney", "sora", "cursor", "커서"]
USEFUL = ["출시", "공개", "업데이트", "무료", "가격", "요금", "기능", "launch", "release", "pricing", "free",
          "update", "introduc", "available", "api", "모델", "model", "에이전트", "agent"]
LOCAL = ["시의회", "교육청", "구청", "시청", "군청", "도의회", "축제", "체험", "업무협약", "mou", "협약식",
         "세미나", "포럼 개최", "교육 진행", "교육 실시", "목표가", "주가", "특징주", "코인"]


def _rare_tokens(items: list[dict]) -> list[set[str]]:
    """여러 기사에 흔하게 나오는 단어(AI, 생성형 등)는 빼고 사건을 구별하는 단어만 남긴다."""
    toks = [_tokens(i["title"]) for i in items]
    df = {}
    for t in toks:
        for w in t:
            df[w] = df.get(w, 0) + 1
    limit = max(3, int(len(items) * 0.08))
    generic = {w for w, c in df.items() if c > limit} | {w.lower() for w in AI_WORDS} | {"2026년", "2026"}
    return [t - generic for t in toks]


def clusters(items: list[dict]) -> list[list[dict]]:
    """구별되는 단어가 2개 이상 겹치는 기사끼리 같은 사건으로 묶는다."""
    toks = _rare_tokens(items)
    used, groups = set(), []
    for i in range(len(items)):
        if i in used:
            continue
        g = [i]
        for j in range(i + 1, len(items)):
            if j not in used and len(toks[i] & toks[j]) >= 2:
                g.append(j)
        used.update(g)
        groups.append([items[k] for k in g])
    return groups


def _score(group: list[dict]) -> float:
    now = datetime.now(timezone.utc)
    newest = max((i["published"] for i in group if i["published"]), default=now - timedelta(hours=WINDOW_HOURS))
    hours = (now - newest).total_seconds() / 3600
    sources = len({i["source"] for i in group})
    blob = " ".join(i["title"] for i in group).lower()
    major = sum(1 for w in MAJOR if w in blob)
    useful = sum(1 for w in USEFUL if w in blob)
    local = any(w in blob for w in LOCAL)
    specialist = any(i["source"] in ("AI타임스", "GeekNews", "OpenAI", "The Verge AI", "TechCrunch AI") for i in group)
    return (sources * 1.5 + min(major, 3) * 1.5 + min(useful, 3) * 0.7 + (1 if specialist else 0)
            + max(0, 24 - hours) / 12 - (4 if local else 0))


def _subject(group: list[dict]) -> str:
    """기사 묶음에서 공통으로 나오는 고유명사(제품·회사명)를 세부 키워드로."""
    counts = {}
    for i in group:
        for t in set(re.findall(r"[A-Z][A-Za-z0-9.\-]+(?: [0-9.]+)?|[가-힣]{2,6}", i["title"])):
            if t.lower() in STOP:
                continue
            counts[t] = counts.get(t, 0) + 1
    generic = {"서비스", "기업", "정부", "시장", "기술", "사용", "활용", "개발", "공개", "출시", "도입", "기반", "전략",
               "강화", "확대", "지원", "검토", "직원", "사업", "프로젝트", "플랫폼", "솔루션", "업계", "국내", "글로벌"}
    particle = re.compile(r"(까지|에서|으로|에게|부터|보다|처럼|이며|하고|했다|한다|된다|는|를|을|은|이|가|의|도|에|와|과|로)$")
    ranked = sorted(((k, v) for k, v in counts.items()
                     if k.lower() not in AI_WORDS and k != "AI" and k not in generic and not particle.search(k)),
                    key=lambda kv: (-kv[1], -len(kv[0])))
    return ranked[0][0] if ranked and (ranked[0][1] >= 2 or len(group) == 1) else ""


def pick_plans(n: int = 1, exclude: set = None) -> list[dict]:
    items = collect()
    seen = load_seen()
    items = [i for i in items if _key(i["url"]) not in seen]
    groups = sorted(clusters(items), key=_score, reverse=True)
    plans = []
    for g in [g for g in groups if _score(g) > 0][:n]:
        g = sorted(g, key=lambda i: i["published"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)[:6]
        subject = _subject(g)
        plans.append({
            "category": "ai-news",
            "news": True,
            "main": "AI 뉴스",
            "keyword": subject,
            "intent": "news",
            "related": [],
            "serp_titles": [],
            "questions": [],
            "evidence": [],
            "risk": {"level": "green", "fields": [], "guides": [], "notes": []},
            "sources": [{"name": i["source"], "url": i["url"], "title": i["title"],
                         "published": i["published"].strftime("%Y-%m-%d %H:%M UTC") if i["published"] else "",
                         "summary": i["summary"]} for i in g],
        })
    return plans


def prompt_block(plan: dict) -> str:
    lines = ["[AI 뉴스 - 아래 기사만 근거로 쓸 것]"]
    if plan.get("keyword"):
        lines.append(f"핵심 대상(제목 앞부분에 넣을 것): {plan['keyword']}")
    for i, s in enumerate(plan["sources"], 1):
        lines.append(f"{i}. [{s['name']}] {s['title']} ({s['published']})\n   요약: {s['summary'] or '(요약 없음)'}")
    lines.append(
        "작성 규칙:\n"
        "   - 위 기사에 있는 사실만 쓴다. 기사에 없는 수치·날짜·인용·출시 일정은 쓰지 않는다.\n"
        "   - 문장마다 근거 매체를 (출처: 매체명) 으로 밝힌다. 매체마다 말이 다르면 다르다고 쓴다.\n"
        "   - 구조: 한 줄 요약 → 무슨 일이 있었나 → 왜 중요한가 → 한국 사용자·직장인에게 의미 → 아직 확인되지 않은 것 → FAQ\n"
        "   - 전망·의견은 '의견'임을 분명히 표시하고 짧게.\n"
        "   - 영어 기사는 핵심만 자연스러운 한국어로 옮기고 원문 제품명은 그대로 둔다.")
    return "\n".join(lines)


if __name__ == "__main__":
    for p in pick_plans(3):
        print(f"\n▶ 키워드: {p['keyword'] or '(없음)'}  기사 {len(p['sources'])}건")
        for s in p["sources"]:
            print(f"   - [{s['name']}] {s['title'][:70]}")
