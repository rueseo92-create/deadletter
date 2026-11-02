"""
오늘의 황금 키워드 리포트 — 지금 뜨는 검색어 중 '검색량은 많은데 글은 적은' 키워드를 고른다.

  후보: 구글 트렌드 한국 일간 검색어 + 네이버·구글 자동완성으로 넓힌 연관어
  측정: 월간 검색량(네이버 검색광고 API) ÷ 블로그 문서 수(네이버 검색 API) = 황금 비율
  분류: 사건·사고·범죄·의혹·건강 루머는 '제외', 연예 가십은 '주의', 우리 사이트 주제와 맞으면 'seroai 적합'

  python golden_keywords.py              → research/keywords/YYYY-MM-DD.md (표)
  python golden_keywords.py --json       → 같은 내용을 JSON 으로도 저장

네이버 API 키가 없으면 검색량·문서 수 칸은 비고, 구글 트렌드 유입 추정치와 자동완성 신호만 보여 준다.
"""

import json
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import keyword_research as kr  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "research" / "keywords"
KST = timezone(timedelta(hours=9))
TRENDS_RSS = "https://trends.google.com/trending/rss?geo=KR"
NS = {"ht": "https://trends.google.com/trending/rss"}

# 다루지 않는 키워드: 실명 사건·범죄·의혹·사망·질병 루머 (명예훼손·광고 정책·저품질 위험)
EXCLUDE = ["징역", "성폭행", "성추행", "학폭", "의혹", "사망", "숨진", "살해", "살인", "폭행", "구속", "기소", "체포",
           "음주운전", "마약", "도박", "불륜", "이혼", "열애", "결별", "논란", "폭로", "피해자", "가해자", "돌진", "사고",
           "화재", "참사", "부고", "자살", "투신", "병명", "희귀병", "암 투병", "cctv", "유출", "사생활", "교도소", "수감",
           "깡패", "조폭", "징계", "고소", "고발", "혐의", "재판", "법정"]
# 특정 사이트를 찾아가는 검색(블로그 글로 답할 게 없음)
NAVIGATIONAL = ["홈페이지", "고객센터", "로그인", "전화번호", "지점", "채용", "주소", "바로가기", "앱 다운"]
# 조심해서만 쓸 것: 연예인·인물 근황 (사실만, 추측 금지)
CAUTION = ["근황", "나이", "프로필", "남편", "아내", "여자친구", "남자친구", "재산", "집안", "학력"]
# 세로AI(사장님 대상 AI 자동화 대행) 주제와 맞는 단어
FIT = ["AI", "인공지능", "챗GPT", "클로드", "제미나이", "자동화", "엑셀", "구글시트", "노션", "앱", "홈페이지", "블로그",
       "마케팅", "광고", "쇼핑몰", "스마트스토어", "네이버 플레이스", "소상공인", "자영업", "지원금", "정책자금", "창업",
       "카드", "결제", "세금", "부가세", "종합소득세", "키오스크", "배달", "예약", "MTS", "업데이트", "출시", "요금제"]
# 생활정보 (별도 생활 블로그용으로 표시만)
LIFE = ["축제", "쿠폰", "할인", "쓱데이", "세일", "신메뉴", "콘서트", "예매", "일정", "날씨", "연휴", "휴무", "택배"]


def trends() -> list[dict]:
    """구글 트렌드 한국 일간 검색어 (제목, 유입 추정, 관련 기사 제목)"""
    with urllib.request.urlopen(urllib.request.Request(TRENDS_RSS, headers={"User-Agent": "Mozilla/5.0"}), timeout=20) as r:
        root = ET.fromstring(r.read())
    out = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        traffic = (it.findtext("ht:approx_traffic", namespaces=NS) or "").strip()
        news = [n.findtext("ht:news_item_title", namespaces=NS) or "" for n in it.findall("ht:news_item", NS)]
        if title:
            out.append({"keyword": title, "traffic": traffic, "news": [x for x in news if x][:2]})
    return out


def classify(kw: str, news: list[str]) -> tuple[str, str]:
    text = " ".join([kw] + news).lower()
    if any(w.lower() in text for w in EXCLUDE):
        hit = next(w for w in EXCLUDE if w.lower() in text)
        return "제외", f"사건·사고·루머 ({hit})"
    if any(kw.endswith(w) or f" {w}" in kw for w in NAVIGATIONAL):
        return "제외", "특정 사이트 찾기(탐색형)"
    if any(w.lower() in kw.lower() for w in FIT):
        return "seroai 적합", "AI·업무·사장님 주제"
    if any(w in kw for w in CAUTION):
        return "주의", "인물 신상 (사실만)"
    if any(w in text for w in LIFE):
        return "생활정보", "생활 블로그용"
    return "일반 이슈", "사실 확인 후 정보형으로만"


def expand(seed: str, n: int = 3) -> list[str]:
    """트렌드 검색어마다 자동완성 상위 몇 개를 붙여 '롱테일' 후보를 만든다."""
    out = []
    for kw in kr.naver_autocomplete(seed)[:n] + kr.google_autocomplete(seed)[:n]:
        if kw != seed and kw not in out and re.search(r"[가-힣]", kw):
            out.append(kw)
    return out[:n]


def build(limit_trends: int = 20) -> list[dict]:
    rows = []
    for t in trends()[:limit_trends]:
        verdict, why = classify(t["keyword"], t["news"])
        cands = [t["keyword"]] + ([] if verdict == "제외" else expand(t["keyword"]))
        for i, kw in enumerate(cands):
            v, w = classify(kw, t["news"] if i == 0 else [])
            if verdict == "제외":
                v, w = verdict, why
            rows.append({"keyword": kw, "source": t["keyword"], "trend_traffic": t["traffic"] if i == 0 else "",
                         "news": t["news"][0] if (i == 0 and t["news"]) else "", "verdict": v, "why": w,
                         "volume": None, "docs": None, "ratio": None})
        time.sleep(.2)
    # 측정 (키가 있을 때만, 제외 키워드는 재지 않음)
    measurable = [r for r in rows if r["verdict"] != "제외"]
    if kr._has_ad_api():
        vols = kr.searchad_keywords([r["keyword"] for r in measurable])
        for r in measurable:
            hit = vols.get(kr._nkey(r["keyword"]))
            r["volume"] = hit["volume"] if hit else None
    if kr._has_search_api():
        for r in measurable:
            r["docs"] = kr.naver_search("blog", r["keyword"], display=1)["total"]
            time.sleep(.12)
    for r in rows:
        if r["volume"] and r["docs"]:
            r["ratio"] = round(r["volume"] / max(r["docs"], 1), 2)
    order = {"seroai 적합": 0, "일반 이슈": 1, "생활정보": 2, "주의": 3, "제외": 4}
    rows.sort(key=lambda r: (order[r["verdict"]], -(r["ratio"] or 0), -(r["volume"] or 0)))
    return rows


def report(rows: list[dict]) -> Path:
    today = datetime.now(KST).strftime("%Y-%m-%d")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    keys = "있음" if kr._has_ad_api() and kr._has_search_api() else "없음 (검색량·문서 수 빈칸)"
    fmt = lambda v: f"{v:,}" if isinstance(v, int) else ("" if v is None else str(v))
    lines = [f"# 오늘의 황금 키워드 ({today})", "",
             f"후보: 구글 트렌드 한국 일간 검색어 + 자동완성 · 네이버 API 키: {keys}",
             "황금 비율 = 월간 검색량 ÷ 블로그 문서 수 (클수록 글이 부족한 키워드)", "",
             "| # | 키워드 | 월 검색량 | 블로그 문서 | 비율 | 트렌드 | 판정 | 이유 |",
             "|---|---|---:|---:|---:|---|---|---|"]
    for i, r in enumerate(rows, 1):
        lines.append(f"| {i} | {r['keyword']} | {fmt(r['volume'])} | {fmt(r['docs'])} | {fmt(r['ratio'])} | "
                     f"{r['trend_traffic']} | {r['verdict']} | {r['why']} |")
    lines += ["", "## 쓰는 법",
              "- **seroai 적합**: 자동 발행 파이프라인이 우선 후보로 씀 (업무 자동화·AI 마케팅·AI 도구·AI 뉴스)",
              "- **생활정보·일반 이슈**: 세로AI 사이트에는 쓰지 않음. 별도 생활 블로그를 연다면 사실 확인 후 정보형으로",
              "- **주의**: 인물 관련은 공개된 사실만, 추측·사생활 금지",
              "- **제외**: 사건·범죄·의혹·사망·루머는 쓰지 않음 (명예훼손, 애드센스 민감 콘텐츠, 저품질 위험)",
              "- 하루 발행 수보다 간격이 중요: 몇 시간 간격으로 나눠 올리기"]
    p = OUT_DIR / f"{today}.md"
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return p


def fit_keywords(rows: list[dict] | None = None, n: int = 5) -> list[str]:
    """자동 발행에서 쓸 '세로AI 적합' 키워드 (오늘 리포트가 있으면 그걸 읽는다)"""
    if rows is None:
        p = OUT_DIR / f"{datetime.now(KST).strftime('%Y-%m-%d')}.json"
        if not p.exists():
            return []
        rows = json.loads(p.read_text(encoding="utf-8"))
    return [r["keyword"] for r in rows if r["verdict"] == "seroai 적합"][:n]


if __name__ == "__main__":
    rows = build()
    print(report(rows))
    if "--json" in sys.argv:
        p = OUT_DIR / f"{datetime.now(KST).strftime('%Y-%m-%d')}.json"
        p.write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
        print(p)
    for r in rows[:15]:
        print(f"  [{r['verdict']}] {r['keyword']}  {r['trend_traffic']}  {r['why']}")
