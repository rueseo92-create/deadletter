"""
인스타 벤치마킹 분석 — Agent Reach로 읽어 온 공개 게시물(캡션·숫자)에서 주제와 후킹 패턴을 뽑는다.

  1. 내 PC에서 보조 계정으로:  agent-reach instagram posts 계정아이디 --limit 12 > 계정아이디.json
  2. 그 파일들을 research/instagram/raw/ 에 넣고 커밋
  3. python ig_benchmark.py            → research/instagram/insights.md
     python ig_benchmark.py --stats    → API 호출 없이 숫자만

다른 계정의 문구·이미지를 가져오지 않는다. 뽑는 건 '형식과 주제'뿐이고,
아이디어는 세로AI 딸깍스튜디오(사장님 대상 AI 자동화 대행)에 맞춘 원본으로 만든다.
"""

import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "research" / "instagram" / "raw"
OUT = ROOT / "research" / "instagram" / "insights.md"


def _num(v):
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str):
        s = v.replace(",", "").strip().lower()
        m = re.match(r"([\d.]+)\s*([km만천]?)", s)
        if m:
            n = float(m.group(1))
            return int(n * {"k": 1e3, "m": 1e6, "만": 1e4, "천": 1e3}.get(m.group(2), 1))
    return None


def _pick(d: dict, *keys):
    for k in keys:
        if k in d and d[k] not in (None, ""):
            return d[k]
    return None


def load() -> list[dict]:
    """Agent Reach 출력({items: [...]}) 이나 그냥 리스트 모두 받는다. 필드 이름은 백엔드마다 달라 넓게 찾는다."""
    rows = []
    for f in sorted(RAW.glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            print(f"  [!] JSON 아님: {f.name}")
            continue
        items = data.get("items", data) if isinstance(data, dict) else data
        if isinstance(data, dict) and data.get("ok") is False:
            print(f"  [!] {f.name}: 수집 실패 ({(data.get('error') or {}).get('code')})")
            continue
        for it in items or []:
            if not isinstance(it, dict):
                continue
            caption = _pick(it, "caption", "text", "content", "description", "title") or ""
            rows.append({
                "account": _pick(it, "username", "owner", "author", "user") or f.stem,
                "caption": str(caption)[:1200],
                "likes": _num(_pick(it, "likes", "like_count", "likeCount", "likesCount")),
                "comments": _num(_pick(it, "comments", "comment_count", "commentCount", "commentsCount")),
                "views": _num(_pick(it, "views", "view_count", "play_count", "videoViewCount", "plays")),
                "type": str(_pick(it, "type", "media_type", "product_type", "kind") or "").lower(),
                "url": _pick(it, "url", "link", "permalink") or "",
            })
    return rows


def stats(rows: list[dict]) -> dict:
    if not rows:
        return {"count": 0}
    eng = lambda r: (r["likes"] or 0) + 3 * (r["comments"] or 0)  # 댓글에 가중치
    top = sorted(rows, key=eng, reverse=True)
    tags = Counter(t.lower() for r in rows for t in re.findall(r"#([0-9A-Za-z가-힣_]+)", r["caption"]))
    kinds = Counter("릴스" if ("reel" in r["type"] or "clip" in r["type"] or "video" in r["type"]) else
                    "캐러셀" if ("carousel" in r["type"] or "sidecar" in r["type"]) else
                    "사진" if r["type"] else "알 수 없음" for r in rows)
    firsts = [r["caption"].strip().split("\n")[0][:60] for r in top[:15] if r["caption"].strip()]
    return {"count": len(rows), "accounts": sorted({r["account"] for r in rows}), "top": top[:20],
            "kinds": kinds.most_common(), "tags": tags.most_common(20), "first_lines": firsts}


class Insight(BaseModel):
    winning_topics: list[str] = Field(description="반응 좋은 주제 5개 이내")
    hook_patterns: list[str] = Field(description="첫 줄 후킹 패턴 5개 이내 (문장을 베끼지 말고 구조로)")
    format_notes: str = Field(description="릴스/캐러셀/사진 중 무엇이 잘 되는지, 길이·구성 관찰")
    reel_ideas: list[str] = Field(description="딸깍스튜디오용 원본 릴스 아이디어 5개 (9칸 카드·what-if 등 우리 형식)")
    card_ideas: list[str] = Field(description="카드뉴스 표지 문구 5개 (28자 이내)")
    blog_topics: list[str] = Field(description="블로그 AI 마케팅·업무 자동화 주제 5개")
    avoid: list[str] = Field(description="피할 것 (과장·가짜 숫자·저작권 등)")


PROMPT = """너는 숏폼·카드뉴스 기획자다. 아래는 공개 인스타 게시물의 캡션 앞부분과 반응 숫자다.
남의 게시물을 따라 만들라는 게 아니라, 반응을 얻는 '주제와 구조'를 뽑아
세로AI 딸깍스튜디오(바쁜 사장님 대신 AI 자동화·홈페이지·AI 마케팅을 세팅하는 대행사)가 직접 만들 원본 아이디어로 바꿔라.
특정 계정의 문장·이미지·캐릭터를 복제하는 제안 금지. 매출·순위 보장, 가짜 숫자를 쓰는 아이디어 금지.

계정: {accounts}
형식 분포: {kinds}
많이 쓴 해시태그: {tags}

반응 상위 게시물:
{table}"""


def analyze() -> Path:
    import claude_client
    s = stats(load())
    if not s["count"]:
        raise SystemExit(f"{RAW} 에 분석할 JSON 이 없습니다.")
    table = "\n".join(
        f"- [{r['account']}] 좋아요 {r['likes'] or '?'} · 댓글 {r['comments'] or '?'} · 조회 {r['views'] or '?'} · {r['type'] or '?'}"
        f"\n  {r['caption'][:220].replace(chr(10), ' / ')}" for r in s["top"])
    r = claude_client.client().messages.parse(
        model=claude_client.MODEL, max_tokens=6000,
        messages=[{"role": "user", "content": PROMPT.format(
            accounts=", ".join(s["accounts"]), kinds=s["kinds"], tags=", ".join(t for t, _ in s["tags"]), table=table)}],
        output_format=Insight, output_config={"effort": "medium"})
    ins = r.parsed_output
    sec = lambda title, xs: [f"## {title}", *[f"- {x}" for x in xs], ""]
    md = ["# 인스타 벤치마킹 인사이트", "",
          f"게시물 {s['count']}개 · 계정 {len(s['accounts'])}곳 · 형식 {s['kinds']}", "",
          *sec("반응 좋은 주제", ins.winning_topics), *sec("첫 줄 후킹 패턴", ins.hook_patterns),
          "## 형식", ins.format_notes, "",
          *sec("우리 릴스 아이디어", ins.reel_ideas), *sec("카드뉴스 표지 후보", ins.card_ideas),
          *sec("블로그 주제 후보", ins.blog_topics), *sec("피할 것", ins.avoid)]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(md), encoding="utf-8")
    return OUT


if __name__ == "__main__":
    if "--stats" in sys.argv:
        s = stats(load())
        print(json.dumps({k: v for k, v in s.items() if k != "top"}, ensure_ascii=False, indent=2))
        for r in s.get("top", [])[:10]:
            print(f"- [{r['account']}] ♥{r['likes']} 💬{r['comments']} ▶{r['views']} | {r['caption'][:70]!r}")
    else:
        print(analyze())
