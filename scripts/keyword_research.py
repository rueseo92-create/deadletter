"""
keyword_research.py - 키워드 발굴 → 세부 키워드 선택 → 검색 의도·근거 자료 수집

흐름 (돈나나 4단계 중 1~3단계):
  1. 메인 키워드(SEED_KEYWORDS)에서 출발
  2. 네이버·구글 자동완성 + 네이버 검색광고 연관 키워드로 세부 키워드 확장
  3. 검색량(검색광고 API)과 블로그 문서 수(검색 API)로 '검색량 대비 문서가 적은' 키워드를 고름
  4. 고른 키워드의 상위 글 제목·지식iN 질문·연관 키워드로 검색 의도를 분류

API 키가 없으면 자동완성 신호(순위, 양쪽 엔진 동시 등장)만으로 점수를 매긴다.

.env (모두 선택)
  NAVER_CLIENT_ID / NAVER_CLIENT_SECRET         네이버 검색 API (문서 수, 상위 글, 지식iN)
  NAVER_AD_API_KEY / NAVER_AD_SECRET / NAVER_AD_CUSTOMER_ID   네이버 검색광고 API (월간 검색량)

미리보기:
  python keyword_research.py --category finance -n 3
"""

import base64
import hashlib
import hmac
import html
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

import search_intent
import title_rules

CACHE_FILE = Path(__file__).parent / "keyword_cache.json"
POSTS_DIR = Path(os.getenv("BLOG_REPO_PATH", str(Path(__file__).parent.parent))) / "content" / "posts"
CACHE_TTL_DAYS = 7
MIN_VOLUME = 100            # 월간 검색량(PC+모바일) 하한. 검색광고 키가 있을 때만 적용
MEASURE_TOP = 12            # 문서 수를 조회할 후보 수 (시드당)
UA = "Mozilla/5.0 (compatible; DailyInsightBot/1.0)"

# 메인 키워드. 큰 주제 그대로 쓰지 않고 여기서 세부 키워드로 좁힌다.
SEED_KEYWORDS = {
    "ai-automation": ["업무 자동화 AI", "엑셀 자동화 챗GPT", "n8n 자동화", "Make 자동화", "AI 에이전트 만들기",
                      "클로드 코드", "GPTs 만들기", "노션 AI", "AI 이메일 자동화", "구글 시트 자동화",
                      "AI 회의록", "파이썬 자동화 챗GPT"],
    "ai-side-hustle": ["AI 부업", "챗GPT 부업", "AI 블로그 수익", "AI 이미지 판매", "AI 쇼츠 수익",
                       "AI 전자책", "AI 그림 부업", "AI 번역 부업", "AI 영상 편집 부업", "AI 강의 판매"],
    "ai-tools": ["챗GPT 사용법", "클로드 사용법", "제미나이 사용법", "퍼플렉시티", "미드저니", "AI 영상 생성",
                 "AI 음성 생성", "AI 코딩 도구", "AI PPT 만들기", "AI 요약 도구", "AI 이미지 생성", "커서 AI"],
}

# 블로그 글로 답할 수 없는 탐색형·도구형 키워드
NAV_WORDS = ["영어로", "계산기", "로그인", "홈페이지", "사이트", "고객센터", "전화번호", "앱 다운", "다운로드",
             "주가", "시세", "날씨", "가사", "노래", "영화", "드라마", "주소", "위치", "갤러리", "디시", "나무위키",
             "책", "apk", "크랙", "탈옥", "우회", "무료 계정", "공유 계정"]

# 자동완성은 영문을 소문자로 준다 → 브랜드 표기 복원
CASING = {"챗gpt": "챗GPT", "chatgpt": "ChatGPT", "gpt": "GPT", "gpts": "GPTs", "ai": "AI", "pdf": "PDF",
          "ppt": "PPT", "api": "API", "n8n": "n8n", "make": "Make", "notion": "Notion", "zapier": "Zapier",
          "claude": "Claude", "gemini": "Gemini", "cursor": "Cursor", "midjourney": "Midjourney", "sora": "Sora"}


def _case(kw: str) -> str:
    out = []
    for w in kw.split():
        low = w.lower()
        fixed = CASING.get(low)
        if not fixed:
            for k, v in CASING.items():  # 붙어 있는 경우 (챗gpt사용법)
                if low.startswith(k) and len(k) >= 3:
                    fixed = v + w[len(k):]
                    break
        out.append(fixed or w)
    return " ".join(out)


# ──────────────────────────────────────────────
# HTTP
# ──────────────────────────────────────────────
def _get_json(url: str, headers: dict = None, timeout: int = 10):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt:
                raise
            time.sleep(1)


def _strip(s: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()


def _nkey(s: str) -> str:
    return re.sub(r"\s+", "", s.lower())


# ──────────────────────────────────────────────
# 데이터 소스
# ──────────────────────────────────────────────
def naver_autocomplete(q: str) -> list[str]:
    url = ("https://ac.search.naver.com/nx/ac?con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0"
           "&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100&q=" + urllib.parse.quote(q))
    try:
        data = _get_json(url)
        return [it[0] for it in (data.get("items") or [[]])[0]]
    except Exception:
        return []


def google_autocomplete(q: str) -> list[str]:
    url = "https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&gl=kr&q=" + urllib.parse.quote(q)
    try:
        return list(_get_json(url)[1])
    except Exception:
        return []


def _has_search_api() -> bool:
    return bool(os.getenv("NAVER_CLIENT_ID") and os.getenv("NAVER_CLIENT_SECRET"))


def _has_ad_api() -> bool:
    return all(os.getenv(k) for k in ("NAVER_AD_API_KEY", "NAVER_AD_SECRET", "NAVER_AD_CUSTOMER_ID"))


def naver_search(kind: str, q: str, display: int = 10) -> dict:
    """kind: blog | kin | news. {'total': int, 'items': [{'title','description'}]}"""
    if not _has_search_api():
        return {"total": None, "items": []}
    url = (f"https://openapi.naver.com/v1/search/{kind}.json?display={display}&sort=sim&query="
           + urllib.parse.quote(q))
    try:
        data = _get_json(url, {"X-Naver-Client-Id": os.environ["NAVER_CLIENT_ID"],
                               "X-Naver-Client-Secret": os.environ["NAVER_CLIENT_SECRET"]})
    except Exception as e:
        print(f"  [키워드] 네이버 검색 API 실패({kind}): {e}")
        return {"total": None, "items": []}
    return {"total": int(data.get("total", 0)),
            "items": [{"title": _strip(i.get("title")), "description": _strip(i.get("description"))}
                      for i in data.get("items", [])]}


def _vol(v) -> int:
    if isinstance(v, (int, float)):
        return int(v)
    return 5 if "<" in str(v) else int(re.sub(r"\D", "", str(v)) or 0)


def searchad_keywords(hints: list[str]) -> dict[str, dict]:
    """네이버 검색광고 키워드 도구. {공백제거 키워드: {'keyword','volume','comp'}}"""
    if not _has_ad_api() or not hints:
        return {}
    out = {}
    for i in range(0, len(hints), 5):  # 힌트는 5개까지, 공백 불가
        batch = [h.replace(" ", "") for h in hints[i:i + 5]]
        ts = str(int(time.time() * 1000))
        sig = base64.b64encode(hmac.new(os.environ["NAVER_AD_SECRET"].encode(),
                                        f"{ts}.GET./keywordstool".encode(), hashlib.sha256).digest()).decode()
        url = ("https://api.searchad.naver.com/keywordstool?showDetail=1&hintKeywords="
               + urllib.parse.quote(",".join(batch)))
        try:
            data = _get_json(url, {"X-Timestamp": ts, "X-API-KEY": os.environ["NAVER_AD_API_KEY"],
                                   "X-Customer": os.environ["NAVER_AD_CUSTOMER_ID"], "X-Signature": sig})
        except Exception as e:
            print(f"  [키워드] 검색광고 API 실패: {e}")
            continue
        for k in data.get("keywordList", []):
            kw = k.get("relKeyword", "")
            out[_nkey(kw)] = {"keyword": kw,
                              "volume": _vol(k.get("monthlyPcQcCnt")) + _vol(k.get("monthlyMobileQcCnt")),
                              "comp": k.get("compIdx", "")}
        time.sleep(0.3)
    return out


# ──────────────────────────────────────────────
# 확장 + 점수
# ──────────────────────────────────────────────
def _usable(kw: str, seed: str) -> bool:
    if _nkey(kw) == _nkey(seed) or len(kw) < 3 or len(kw) > 30:
        return False
    if not re.search(r"[가-힣]", kw):
        return False
    if any(w in kw for w in NAV_WORDS):
        return False
    return title_rules.keyword_risk(kw, "")["level"] != "red"


def expand(seed: str) -> list[dict]:
    """자동완성 2단계 확장. 후보마다 자동완성 신호 점수(ac_score)를 매긴다."""
    found: dict[str, dict] = {}

    def add(kw, engine, rank, depth):
        if not _usable(kw, seed):
            return
        c = found.setdefault(_nkey(kw), {"keyword": kw, "engines": set(), "ac_score": 0.0})
        if c["keyword"].islower() and not kw.islower():  # 네이버는 영문을 소문자로 준다 (챗gpt → 챗GPT)
            c["keyword"] = kw
        c["engines"].add(engine)
        c["ac_score"] += (11 - min(rank, 10)) / 10 * (1.0 if depth == 1 else 0.6)

    first = []
    for engine, fn in (("naver", naver_autocomplete), ("google", google_autocomplete)):
        for r, kw in enumerate(fn(seed), 1):
            add(kw, engine, r, 1)
            if engine == "naver" and _usable(kw, seed):
                first.append(kw)
    for kw in first[:4]:  # 상위 4개는 한 단계 더 좁힌다 (롱테일)
        for engine, fn in (("naver", naver_autocomplete), ("google", google_autocomplete)):
            for r, kw2 in enumerate(fn(kw), 1):
                add(kw2, engine, r, 2)
        time.sleep(0.2)

    out = []
    for c in found.values():
        words = len(c["keyword"].split())
        bonus = 0.5 if len(c["engines"]) == 2 else 0.0
        bonus += 0.3 if 2 <= words <= 4 else 0.0  # 롱테일 선호
        out.append({"keyword": _case(c["keyword"]), "ac_score": round(c["ac_score"] + bonus, 3),
                    "engines": sorted(c["engines"])})
    return sorted(out, key=lambda x: -x["ac_score"])


def measure(seed: str, cands: list[dict]) -> list[dict]:
    """검색량·문서 수를 붙이고 최종 점수(score)를 계산한다."""
    top = cands[:MEASURE_TOP]
    ad = searchad_keywords([seed] + [c["keyword"] for c in top]) if _has_ad_api() else {}
    # 검색광고 연관 키워드 중 시드를 포함하는 것도 후보로 추가
    for k, v in ad.items():
        if _nkey(seed) in k and k not in {_nkey(c["keyword"]) for c in top} and _usable(v["keyword"], seed):
            top.append({"keyword": v["keyword"], "ac_score": 0.0, "engines": ["searchad"]})
    for c in top:
        a = ad.get(_nkey(c["keyword"]))
        c["volume"] = a["volume"] if a else None
        c["comp"] = a["comp"] if a else ""
        c["docs"] = naver_search("blog", c["keyword"], display=1)["total"] if _has_search_api() else None
        if c["volume"] is not None and c["docs"] is not None:
            # 검색량이 클수록, 검색량 대비 문서가 적을수록 높다 (경쟁 여유)
            ratio = c["docs"] / max(c["volume"], 1)
            c["score"] = round(math.log10(c["volume"] + 10) / (1 + math.log10(1 + ratio)), 3)
            if c["volume"] < MIN_VOLUME:
                c["score"] = 0.0
        elif c["docs"] is not None:
            c["score"] = round(c["ac_score"] / (1 + math.log10(1 + c["docs"] / 1000)), 3)
        else:
            c["score"] = c["ac_score"]
    return sorted(top, key=lambda x: -x["score"])


# ──────────────────────────────────────────────
# 캐시 / 사용 이력
# ──────────────────────────────────────────────
def _load_cache() -> dict:
    try:
        return json.loads(CACHE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"seeds": {}, "seed_used": {}}


def _save_cache(cache: dict):
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")


def seed_candidates(seed: str, cache: dict, refresh: bool = False) -> list[dict]:
    ent = cache["seeds"].get(seed)
    fresh = ent and datetime.fromisoformat(ent["fetched"]) > datetime.now() - timedelta(days=CACHE_TTL_DAYS)
    if fresh and not refresh:
        return ent["candidates"]
    cands = measure(seed, expand(seed))
    if cands:
        cache["seeds"][seed] = {"fetched": datetime.now().isoformat(timespec="seconds"), "candidates": cands}
    return cands


def used_keywords() -> set[str]:
    """이미 발행한 글의 keyword(프론트매터)와 제목."""
    used = set()
    if POSTS_DIR.exists():
        for f in POSTS_DIR.glob("*.mdx"):
            head = f.read_text(encoding="utf-8")[:1500]
            for field in ("keyword", "title"):
                m = re.search(rf'^{field}:\s*"(.+?)"', head, re.MULTILINE)
                if m:
                    used.add(_nkey(m.group(1)))
    return used


def _already_used(kw: str, used: set[str]) -> bool:
    k = _nkey(kw)
    return k in used or any(k in u for u in used if len(k) >= 6)


# ──────────────────────────────────────────────
# 키워드 플랜 (글 1편에 필요한 모든 재료)
# ──────────────────────────────────────────────
def build_plan(seed: str, cand: dict, category: str) -> dict:
    kw = cand["keyword"]
    related = [x for x in naver_autocomplete(kw) + google_autocomplete(kw + " ")
               if _nkey(x) != _nkey(kw) and not any(w in x for w in NAV_WORDS)
               and title_rules.keyword_risk(x, "")["level"] != "red"]
    related = list(dict.fromkeys(related))[:10]
    blog = naver_search("blog", kw, 10)
    kin = naver_search("kin", kw, 8)
    news = naver_search("news", kw, 5)
    serp_titles = [i["title"] for i in blog["items"]]
    questions = [i["title"] for i in kin["items"]]
    intent = search_intent.classify(kw, related, serp_titles, questions)
    risk = title_rules.keyword_risk(kw, category)
    return {
        "category": category,
        "main": seed,
        "keyword": kw,
        "volume": cand.get("volume"),
        "docs": cand.get("docs"),
        "score": cand.get("score"),
        "related": related,
        "serp_titles": serp_titles,
        "questions": questions,
        "evidence": [f"{i['title']} - {i['description'][:80]}" for i in kin["items"][:4] + news["items"][:3]],
        "intent": intent["intent"],
        "intent_confidence": intent["confidence"],
        "risk": risk,
    }


def pick_plans(category: str, n: int, exclude: set[str] = None, refresh: bool = False) -> list[dict]:
    """카테고리에서 n개의 키워드 플랜. 최근에 덜 쓴 시드부터 돌아가며 시드당 1개씩 고른다."""
    cache = _load_cache()
    cache.setdefault("seed_used", {})
    used = used_keywords() | {_nkey(x) for x in (exclude or set())}
    seeds = sorted(SEED_KEYWORDS.get(category, []), key=lambda s: cache["seed_used"].get(s, ""))
    plans = []
    for seed in seeds:
        if len(plans) >= n:
            break
        cands = [c for c in seed_candidates(seed, cache, refresh)
                 if c.get("score", 0) > 0 and not _already_used(c["keyword"], used)]
        for c in cands:
            plan = build_plan(seed, c, category)
            if plan["risk"]["level"] == "red":
                continue
            plans.append(plan)
            used.add(_nkey(c["keyword"]))
            cache["seed_used"][seed] = datetime.now().isoformat(timespec="seconds")
            break
    _save_cache(cache)
    return plans


def prompt_block(plan: dict) -> str:
    """글 생성 프롬프트에 넣을 키워드 전략 블록."""
    lines = [
        "[키워드 전략 - 반드시 따를 것]",
        f"메인 키워드: {plan['main']}",
        f"세부 키워드: {plan['keyword']}  ← 제목 앞부분과 첫 100자 안에 그대로 넣을 것",
        search_intent.outline_text(plan["intent"]),
    ]
    if plan["related"]:
        lines.append("함께 검색되는 키워드(본문에서 실제로 다루는 것만 H2/H3·본문에 자연스럽게): "
                     + ", ".join(plan["related"][:8]))
    if plan["questions"]:
        lines.append("독자가 실제로 묻는 질문(본문·FAQ에서 답할 것):\n"
                     + "\n".join(f"   - {q}" for q in plan["questions"][:6]))
    if plan["evidence"]:
        lines.append("수식어 근거로 쓸 실제 자료(지식iN·뉴스 요약, 그대로 베끼지 말 것):\n"
                     + "\n".join(f"   - {e}" for e in plan["evidence"][:6]))
    if plan["serp_titles"]:
        lines.append("현재 상위 노출 글 제목(따라 쓰지 말고 겹치지 않게 차별화할 것):\n"
                     + "\n".join(f"   - {t}" for t in plan["serp_titles"][:6]))
    for g in plan["risk"]["guides"]:
        lines.append(f"주의 분야 규칙: {g}")
    return "\n".join(lines)


if __name__ == "__main__":
    import argparse

    try:
        from dotenv import load_dotenv
        load_dotenv()
    except Exception:
        pass
    p = argparse.ArgumentParser(description="키워드 플랜 미리보기 (글 생성 없음)")
    p.add_argument("--category", default="finance", choices=list(SEED_KEYWORDS))
    p.add_argument("-n", type=int, default=3)
    p.add_argument("--refresh", action="store_true", help="캐시 무시하고 다시 조회")
    p.add_argument("--show-block", action="store_true", help="프롬프트 블록까지 출력")
    a = p.parse_args()
    print(f"검색 API: {'O' if _has_search_api() else 'X (자동완성 신호로 대체)'} / "
          f"검색광고 API: {'O' if _has_ad_api() else 'X'}")
    for pl in pick_plans(a.category, a.n, refresh=a.refresh):
        print(f"\n[{pl['main']}] → {pl['keyword']}  (의도 {pl['intent']}, 점수 {pl['score']}, "
              f"검색량 {pl['volume']}, 문서 {pl['docs']}, 위험 {pl['risk']['level']})")
        print("  연관:", ", ".join(pl["related"][:6]))
        if a.show_block:
            print(prompt_block(pl))
