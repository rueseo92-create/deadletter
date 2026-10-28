"""
slop_killers.py - AI 슬롭 킬러 10명: 발행 전 품질 심사위원단

각 심사위원은 한 가지 관점만 엄격하게 본다. 10명이 동시에 읽고 판정한 뒤
  - 8명 이상 통과 + 치명적(critical) 지적 없음 → 발행
  - 아니면 모든 지적을 모아 1회 고쳐 쓰고, 탈락했던 심사위원만 다시 심사
  - 그래도 기준 미달이면 발행하지 않는다 (SlopRejected)

규칙 기반 사전 검사(상투어·과장·지난 연도 등)는 API 호출 없이 먼저 돌려 심사위원에게 함께 넘긴다.
"""

import json
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

import claude_client
import title_rules

PANEL_SIZE = 10
PASS_NEEDED = 8

REVIEWERS = [
    {"id": "fact", "name": "팩트체커",
     "focus": "근거 없는 수치·통계·날짜·인용, 지어낸 사실. 출처 없이 단정한 숫자는 모두 지적. 존재가 불확실한 기능·요금제·정책.",
     "critical": True},
    {"id": "source", "name": "출처 감시관",
     "focus": "본문 주장마다 근거가 밝혀졌는지, '(출처: ...)' 가 실제 제공된 자료와 맞는지, 뉴스 글이 제공된 기사 밖의 내용을 쓰지 않았는지.",
     "critical": True},
    {"id": "cliche", "name": "상투어 사냥꾼",
     "focus": "AI가 쓴 티가 나는 표현: '혹시 ~한 적 있나요?', '결론적으로', '다양한', '중요합니다', '~의 세계', '게임 체인저', "
              "'혁신적인', '놓치지 마세요', '알아보겠습니다', 문단마다 같은 어미 반복, 의미 없는 이모지.",
     "critical": False},
    {"id": "fluff", "name": "군더더기 편집자",
     "focus": "같은 말 반복, 정보 없는 도입·마무리, 분량 채우기용 문단, 표와 본문이 같은 내용을 반복하는 곳.",
     "critical": False},
    {"id": "practical", "name": "실전성 검사관",
     "focus": "독자가 바로 따라 할 수 있는가: 구체적인 도구 이름, 메뉴 경로, 단계, 예시 프롬프트, 비용, 한계. 추상적인 조언만 있으면 탈락.",
     "critical": False},
    {"id": "hype", "name": "과장·부업 단속반",
     "focus": "수익 보장·과장('월 300 버는', '누구나', '하루 10분으로'), 비용·시간·실패 위험·플랫폼 정책(수익화 제한, 저작권, AI 생성물 표시) 누락, "
              "낚시성 표현. AI 부업 글은 현실적인 기대치와 리스크가 반드시 있어야 함.",
     "critical": True},
    {"id": "reader", "name": "독자 대변인",
     "focus": "제목이 약속한 것을 본문이 주는가, 첫 3~4줄 안에 검색한 사람이 원하는 답이 나오는가, 핵심이 늦게 나오지 않는가.",
     "critical": False},
    {"id": "fresh", "name": "최신성 검사관",
     "focus": f"지금은 {datetime.now():%Y년 %m월}이다. 오래된 모델·요금·기능을 최신인 것처럼 쓴 곳, 지난 연도 정보, 이미 바뀐 UI 설명. "
              "확실하지 않으면 '작성 시점 기준'이라고 밝혔는지.",
     "critical": False},
    {"id": "structure", "name": "가독성 디자이너",
     "focus": "모바일에서 읽기 좋은 구조인가: 소제목이 내용을 요약하는가, 문단 길이, 표가 꼭 필요한 곳에만 있는가, 목록 남용, 굵은 글씨·기호 남발.",
     "critical": False},
    {"id": "original", "name": "독창성 심사관",
     "focus": "어디서나 볼 수 있는 일반론인가, 이 글만의 관점·비교·예시·체크리스트가 있는가. 상위 노출 글 제목과 사실상 같은 글이면 탈락.",
     "critical": False},
]

# 규칙 기반 사전 검사 (API 없음)
SLOP_PATTERNS = [
    (r"혹시\s*[^?\n]{0,40}(적|분|경험)\s*(있|없)(나요|으신가요|으셨나요)\?", "뻔한 질문형 도입"),
    (r"결론적으로|요약하자면|정리하자면", "상투적 마무리"),
    (r"다양한\s", "'다양한' 남발"),
    (r"중요합니다|중요한 역할", "'중요합니다' 류 빈말"),
    (r"게임\s*체인저|혁신적인|획기적인", "과장 수식어"),
    (r"알아보겠습니다|살펴보겠습니다|알아볼까요", "목차 낭독형 문장"),
    (r"놓치지\s*마세요|꼭\s*확인하세요!", "낚시성 권유"),
    (r"[\U0001F300-\U0001FAFF]", "이모지"),
]


class Issue(BaseModel):
    quote: str = Field(description="문제가 된 본문 문장 그대로(짧게)")
    problem: str
    fix: str = Field(description="구체적인 수정 방향")
    severity: Literal["critical", "major", "minor"]


class Verdict(BaseModel):
    passed: bool
    score: int = Field(description="0-10")
    issues: list[Issue]


class Revision(BaseModel):
    content: str
    title_candidates: list[str]
    tldr: str
    description: str


class SlopRejected(RuntimeError):
    pass


def lint(content: str) -> list[str]:
    found = []
    for pat, label in SLOP_PATTERNS:
        n = len(re.findall(pat, content))
        limit = 3 if label in ("'다양한' 남발", "이모지") else 0
        if n > limit:
            found.append(f"{label} {n}회")
    for y in set(re.findall(r"(20[12]\d)년", content)):
        if int(y) < datetime.now().year - 1:
            found.append(f"오래된 연도 언급 {y}년 - 최신 정보인지 확인")
    return found


def _context(plan: dict | None) -> str:
    if not plan:
        return "(제공된 자료 없음)"
    if plan.get("news"):
        return "\n".join(f"- [{s['name']}] {s['title']} :: {s['summary'][:200]}" for s in plan["sources"])
    lines = [f"세부 키워드: {plan.get('keyword')}", f"검색 의도: {plan.get('intent')}"]
    if plan.get("serp_titles"):
        lines.append("상위 노출 글 제목: " + " / ".join(plan["serp_titles"][:6]))
    if plan.get("questions"):
        lines.append("독자 질문: " + " / ".join(plan["questions"][:6]))
    return "\n".join(lines)


def _review_one(rv: dict, title: str, content: str, plan: dict | None, lint_notes: list[str]) -> dict:
    system = (f"너는 한국어 AI 정보 블로그의 발행 전 심사위원 '{rv['name']}'이다. 오직 이 관점만 본다: {rv['focus']}\n"
              "엄격하게 보되, 실제로 문제인 곳만 지적한다. 지적마다 본문 문장을 그대로 인용한다. "
              "이 관점에서 독자에게 내보내도 부끄럽지 않으면 passed=true. "
              "severity: critical=사실 왜곡·지어낸 정보·위험한 과장, major=글의 신뢰나 쓸모를 크게 떨어뜨림, minor=다듬으면 좋음.")
    user = (f"[제목]\n{title}\n\n[참고 자료]\n{_context(plan)}\n\n"
            f"[규칙 검사에서 걸린 것]\n{chr(10).join(lint_notes) or '없음'}\n\n[본문]\n{content}")
    try:
        r = claude_client.client().messages.parse(
            model=claude_client.MODEL, max_tokens=4000, system=system,
            messages=[{"role": "user", "content": user}],
            output_format=Verdict, output_config={"effort": "low"})
        v = r.parsed_output
    except Exception as e:  # 심사 호출 실패는 통과로 치지 않는다
        return {"id": rv["id"], "name": rv["name"], "passed": False, "score": 0, "error": str(e)[:200], "issues": []}
    issues = [i.model_dump() for i in v.issues]
    passed = v.passed and not (rv["critical"] and any(i["severity"] == "critical" for i in issues))
    return {"id": rv["id"], "name": rv["name"], "passed": passed, "score": max(0, min(10, v.score)), "issues": issues}


def review(title: str, content: str, plan: dict | None, only: set[str] | None = None) -> list[dict]:
    notes = lint(content)
    targets = [r for r in REVIEWERS if not only or r["id"] in only]
    with ThreadPoolExecutor(max_workers=5) as ex:
        return list(ex.map(lambda rv: _review_one(rv, title, content, plan, notes), targets))


def _summary(results: list[dict]) -> dict:
    passed = sum(r["passed"] for r in results)
    critical = [i for r in results for i in r["issues"] if i["severity"] == "critical"]
    score = round(sum(r["score"] for r in results) / max(len(results), 1) * 10)
    return {"panel": len(results), "passed": passed, "score": score, "critical": len(critical),
            "ok": passed >= PASS_NEEDED and not critical}


def _revise(post, plan: dict | None, results: list[dict]) -> Revision:
    problems = []
    for r in results:
        for i in r["issues"]:
            if i["severity"] != "minor" or not r["passed"]:
                problems.append(f"- [{r['name']}/{i['severity']}] \"{i['quote'][:80]}\" → {i['problem']} / 수정: {i['fix']}")
    system = ("너는 한국어 AI 정보 블로그 편집장이다. 심사위원 지적을 모두 반영해 글을 고친다. "
              "근거 없는 수치·사실은 삭제하거나 '확인되지 않음'으로 바꾸고, 새 사실을 지어내지 않는다. "
              "마크다운 구조(H2/H3, 표, 인용블록, FAQ, 내부 링크)는 유지한다. 굵은 글씨(**)와 물결표(~)는 쓰지 않는다.")
    user = (f"[현재 제목]\n{post.title}\n\n[참고 자료]\n{_context(plan)}\n\n[심사 지적]\n" + "\n".join(problems[:60])
            + f"\n\n[본문]\n{post.content}")
    with claude_client.client().messages.stream(
            model=claude_client.MODEL, max_tokens=32000, system=system,
            messages=[{"role": "user", "content": user}],
            output_format=Revision, output_config={"effort": "medium"}) as st:
        msg = st.get_final_message()
    return Revision.model_validate_json(claude_client.text_of(msg))


def gate(post, plan: dict | None):
    """심사 → 필요하면 1회 수정 → 재심사. 통과하면 post.review 를 채워 돌려준다."""
    print(f"  [슬롭 킬러] 10명 심사 중...")
    results = review(post.title, post.content, plan)
    s = _summary(results)
    _print(results, s)
    if not s["ok"]:
        print("  [슬롭 킬러] 기준 미달 → 지적 반영해 고쳐 쓰기")
        rev = _revise(post, plan, results)
        post.content = rev.content
        post.tldr = rev.tldr or post.tldr
        post.description = (rev.description or post.description)[:155]
        kw = (plan or {}).get("keyword", "")
        title, _, _ = title_rules.choose_title([post.title, *rev.title_candidates], kw, post.category, post.content,
                                               (plan or {}).get("serp_titles", []), (plan or {}).get("intent", "info"))
        post.title = title
        failed = {r["id"] for r in results if not r["passed"]} | {r["id"] for r in results
                                                                   if any(i["severity"] == "critical" for i in r["issues"])}
        again = review(post.title, post.content, plan, only=failed)
        merged = {r["id"]: r for r in results}
        merged.update({r["id"]: r for r in again})
        results = list(merged.values())
        s = _summary(results)
        _print(again, s)
        if not s["ok"]:
            raise SlopRejected(f"슬롭 킬러 재심사 탈락: {s['passed']}/{s['panel']} 통과, 치명적 지적 {s['critical']}건")
    post.review = {"panel": s["panel"], "passed": s["passed"], "score": s["score"]}
    return post


def _print(results: list[dict], s: dict):
    for r in results:
        mark = "통과" if r["passed"] else "탈락"
        top = r["issues"][0]["problem"][:50] if r["issues"] else (r.get("error") or "")
        print(f"    - {r['name']:<8} {mark} ({r['score']}/10) {top}")
    print(f"  [슬롭 킬러] {s['passed']}/{s['panel']} 통과, 점수 {s['score']}, 치명적 {s['critical']}건")


def dump(results: list[dict]) -> str:
    return json.dumps(results, ensure_ascii=False, indent=1)
