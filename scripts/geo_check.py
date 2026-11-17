"""
GEO 간이 진단 — AI 답변에 우리(또는 고객) 브랜드가 '추천'되는지 측정한다.

GenRank 방법론을 1개 엔진(Claude + 웹검색)으로 근사한 것이다.
"[지역/상황] + [업종] 추천" 질문을 여러 개 던져, AI가 추천하는 업체 목록을 뽑고
우리 브랜드가 ① 등장했는지 ② 몇 번째로 추천됐는지 ③ 몇 %의 질문에서 언급됐는지(언급률)를 센다.

중요(정직 원칙):
- 이것은 '간이' 진단이다. 실제 GEO는 ChatGPT·네이버 AI 브리핑·Gemini 등 여러 엔진의 가중 합이다.
  여기서는 Claude 한 엔진만 본다 → 네이버가 중요한 지역 업종은 과소/과대평가될 수 있다.
- AI 추천은 확률적이라 매번 다르다. 그래서 질문당 여러 번(trials) 돌려 평균을 낸다.
- '추천된 이름'만 센다. 각주로 인용된 출처 URL은 세지 않는다(GenRank와 동일).
- 순위·추천을 '보장'하지 않는다. 이 도구는 현재 상태를 재는 자(ruler)일 뿐이다.

사용:
  export ANTHROPIC_API_KEY=...
  python geo_check.py --brand "세로AI 딸깍스튜디오" --category "소상공인 AI 자동화 대행" \\
      --region "서울" --trials 3
  python geo_check.py --config geo_targets.json      # 여러 질문을 파일로

JSON 설정 예:
  {
    "brand": "세로AI 딸깍스튜디오",
    "aliases": ["세로AI", "딸깍스튜디오", "seroai"],
    "questions": [
      "소상공인 업무 자동화 대행 어디가 좋아?",
      "서울 소상공인 홈페이지 제작 추천",
      "자영업자 AI 마케팅 대행 추천해줘"
    ],
    "trials": 3
  }
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import claude_client  # noqa: E402

# GenRank 순위 감쇠: 1/(1+log10(r))
import math


def rank_weight(r: int) -> float:
    return 1.0 / (1.0 + math.log10(max(r, 1)))


EXTRACT_MODEL = claude_client.MODEL  # 추천 목록 추출은 일반 모델로 충분


def default_questions(category: str, region: str) -> list[str]:
    reg = (region + " ") if region else ""
    return [
        f"{reg}{category} 추천해줘",
        f"{reg}{category} 어디가 괜찮아?",
        f"{reg}{category} 잘하는 곳 알려줘",
        f"{category} 업체 고를 때 어디가 좋을까?",
    ]


ASK_SYSTEM = (
    "너는 한국 사용자의 질문에 답하는 검색형 AI다. "
    "업종·지역에 맞는 실제 업체나 서비스를 추천할 때는, 번호를 매긴 목록으로 "
    "구체적인 '이름'을 제시해라. 이름을 모르면 지어내지 말고 솔직히 말해라."
)

EXTRACT_SYSTEM = (
    "다음 AI 답변에서, '추천된 업체/서비스의 고유 이름'만 순서대로 뽑아라. "
    "일반명사(예: '지역 업체', '전문가', '프리랜서')나 플랫폼 일반 언급(예: '크몽에서 찾아보세요')은 제외하고, "
    "실제 상호·브랜드명만. 각주로 인용된 출처는 제외. "
    'JSON 배열로만 답해라. 예: ["A스튜디오", "B에이전시"]. 없으면 [].'
)


def ask_engine(question: str) -> str:
    """Claude + 웹검색으로 질문에 답하게 한다. 실패하면 웹검색 없이 재시도."""
    c = claude_client.client()
    for tools in ([{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}], []):
        try:
            resp = c.messages.create(
                model=EXTRACT_MODEL,
                max_tokens=1200,
                system=ASK_SYSTEM,
                tools=tools or None,
                messages=[{"role": "user", "content": question}],
            )
            return claude_client.text_of(resp)
        except Exception as e:
            last = e
    raise last


def extract_names(answer: str) -> list[str]:
    if not answer.strip():
        return []
    c = claude_client.client()
    resp = c.messages.create(
        model=EXTRACT_MODEL,
        max_tokens=500,
        system=EXTRACT_SYSTEM,
        messages=[{"role": "user", "content": answer}],
    )
    raw = claude_client.text_of(resp).strip()
    m = re.search(r"\[.*\]", raw, re.S)
    if not m:
        return []
    try:
        names = json.loads(m.group(0))
        return [str(n).strip() for n in names if str(n).strip()]
    except Exception:
        return []


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s).lower()


def find_rank(names: list[str], brand: str, aliases: list[str]) -> int | None:
    """추천 목록에서 브랜드가 몇 번째인지(1-based). 없으면 None."""
    keys = [norm(brand)] + [norm(a) for a in aliases]
    for i, n in enumerate(names, 1):
        nn = norm(n)
        if any(k and (k in nn or nn in k) for k in keys):
            return i
    return None


def run(brand: str, aliases: list[str], questions: list[str], trials: int) -> dict:
    results = []
    mentions = 0
    total = 0
    score_sum = 0.0
    for q in questions:
        for t in range(trials):
            total += 1
            answer = ask_engine(q)
            names = extract_names(answer)
            rank = find_rank(names, brand, aliases)
            if rank:
                mentions += 1
                score_sum += rank_weight(rank) * 100
            results.append({
                "question": q, "trial": t + 1,
                "recommended": names[:10],
                "our_rank": rank,
            })
            print(f"  Q: {q[:30]}… [{t+1}/{trials}] "
                  f"→ {'미등장' if not rank else str(rank)+'위'} "
                  f"(추천 {len(names)}곳: {', '.join(names[:3])}{'…' if len(names) > 3 else ''})")
    mention_rate = (mentions / total * 100) if total else 0.0
    # 간이 점수: 등장한 시행의 평균 순위 가중치 × 언급률 (0~100 근사)
    geo_score = (score_sum / total) if total else 0.0
    return {
        "brand": brand,
        "engine": "Claude + web_search (1-engine 간이)",
        "trials_per_question": trials,
        "total_runs": total,
        "mentions": mentions,
        "mention_rate_pct": round(mention_rate, 1),
        "geo_score_approx": round(geo_score, 1),
        "detail": results,
    }


def report(res: dict) -> str:
    lines = [
        "=" * 56,
        f"GEO 간이 진단 — {res['brand']}",
        f"엔진: {res['engine']}",
        "=" * 56,
        f"언급률(1차 지표): {res['mention_rate_pct']}%  "
        f"({res['mentions']}/{res['total_runs']} 시행에서 추천됨)",
        f"간이 GEO 점수: {res['geo_score_approx']} / 100  (순위 가중 평균×언급)",
        "",
        "해석:",
    ]
    mr = res["mention_rate_pct"]
    if mr == 0:
        lines.append("  · AI가 이 질문들에 우리를 전혀 추천하지 않음. '추천되는 엔티티'가 되려면"
                     " 한 줄 정체성·카테고리·지역을 공개 웹/네이버에 또렷이 심는 작업이 먼저.")
    elif mr < 40:
        lines.append("  · 가끔 등장. 경쟁사 대비 노출이 약함 → 비교·목록형 콘텐츠와 구조화 데이터로 보강.")
    else:
        lines.append("  · 자주 추천됨. 순위를 끌어올리는(1~3위) 쪽으로 콘텐츠·리뷰·일관된 이름 관리.")
    lines += [
        "",
        "주의: Claude 1개 엔진 근사치. 지역 업종이면 네이버 AI 브리핑이 더 중요하므로",
        "      네이버 노출(플레이스·블로그)은 별도로 점검해야 정확합니다.",
        "",
        "경쟁사(이번에 추천된 다른 이름 상위):",
    ]
    freq: dict[str, int] = {}
    for d in res["detail"]:
        for n in d["recommended"]:
            if find_rank([n], res["brand"], []) is None:
                freq[n] = freq.get(n, 0) + 1
    for n, c in sorted(freq.items(), key=lambda x: -x[1])[:8]:
        lines.append(f"  · {n}  ({c}회 추천)")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="GEO 간이 진단 (1-engine)")
    ap.add_argument("--brand")
    ap.add_argument("--aliases", default="", help="쉼표로 구분한 별칭")
    ap.add_argument("--category", default="")
    ap.add_argument("--region", default="")
    ap.add_argument("--trials", type=int, default=3)
    ap.add_argument("--config", help="질문·브랜드를 담은 JSON 파일")
    ap.add_argument("--out", help="결과 JSON 저장 경로")
    a = ap.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY 가 필요합니다.")
        return 1

    if a.config:
        cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
        brand = cfg["brand"]
        aliases = cfg.get("aliases", [])
        questions = cfg.get("questions") or default_questions(cfg.get("category", ""), cfg.get("region", ""))
        trials = int(cfg.get("trials", a.trials))
    else:
        if not a.brand or not a.category:
            print("--brand 와 --category 를 주거나 --config 를 쓰세요.")
            return 1
        brand = a.brand
        aliases = [x.strip() for x in a.aliases.split(",") if x.strip()]
        questions = default_questions(a.category, a.region)
        trials = a.trials

    print(f"\n질문 {len(questions)}개 × {trials}회 = {len(questions)*trials}회 측정 시작…\n")
    try:
        res = run(brand, aliases, questions, trials)
    except Exception as e:
        msg = str(e)
        if "credit balance is too low" in msg:
            print("\n[중단] Anthropic API 크레딧이 부족합니다. 충전 후 다시 돌려주세요.")
            return 2
        print(f"\n[중단] 진단 실패: {msg}")
        return 1
    print("\n" + report(res))
    if a.out:
        Path(a.out).write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n저장: {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
