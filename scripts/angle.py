"""
angle.py - 쓰기 전에 '각도'를 잡고, 가능한 건 실제로 돌려 본다.

1) 편집 방향: 같은 키워드라도 어떤 각도로 쓰느냐가 클릭과 체류를 가른다.
   반전 / 계산 / 실험 / 실수 모음 / 비교 대결 / 공개 사례 / 체크리스트 중 하나를 고르고,
   첫 3줄 후킹과 소제목 흐름까지 먼저 설계한다.
2) 세로AI 테스트: 프롬프트·자동화처럼 'AI에 시켜 보면 되는 것'은 실제로 실행해서 결과를 글에 넣는다.
   지어낸 체험담 대신 진짜 실행 결과로 '해 봤더니'를 만든다.
"""

from typing import Literal

from pydantic import BaseModel, Field

import claude_client

TEST_MODEL_LABEL = "Claude Sonnet 5.5"


class Experiment(BaseModel):
    purpose: str = Field(description="이 테스트로 독자에게 보여 줄 것")
    prompt: str = Field(description="AI에 그대로 입력할 프롬프트(한국어, 예시 데이터 포함)")


class Angle(BaseModel):
    hook_type: Literal["반전", "계산", "실험", "실수모음", "비교대결", "공개사례", "체크리스트"]
    angle: str = Field(description="이 글만의 관점 한 문장")
    opening: str = Field(description="첫 2-3문장 후킹 초안. 사실만, 과장 없이")
    title_ideas: list[str] = Field(description="클릭할 이유가 있는 제목 5개 (과장·지어낸 숫자 금지)")
    outline: list[str] = Field(description="H2 소제목 흐름 4-6개. 질문이나 결론형으로")
    experiments: list[Experiment] = Field(description="실제로 실행해 보여 줄 프롬프트 0-2개")
    calc: str = Field(description="부업 글이면 '가정'을 밝힌 수익 구조 계산 설계, 아니면 빈 문자열")
    share_point: str = Field(description="읽고 나서 남에게 말하고 싶어질 한 가지")


SYSTEM = """너는 한국어 AI 실무 매체 '세로AI'의 편집장이다. 조회수는 높지만 낚시는 아닌 글을 기획한다.

좋은 각도의 조건:
- 독자가 이미 아는 뻔한 얘기를 반복하지 않는다. 오해를 깨거나, 숫자로 계산해 보거나, 직접 돌려 본 결과를 보여 주거나, 흔한 실수를 짚는다.
- 첫 2-3문장은 독자의 손해·시간·돈·의외의 사실로 시작한다. "혹시 ~한 적 있나요?" 금지.
- 제목은 구체적으로: 몇 단계, 얼마, 몇 분, 무엇과 무엇 비교, 어떤 실수. 단, 본문에서 실제로 보여 줄 수 있는 것만.
- 부업 글은 '돈 되는 구조 해부'로: 단가 × 건수 - 비용(도구 요금, 수수료, 시간) = 실제 시급. 모든 숫자는 '가정'이라고 밝히고, 단가는 공개된 시세 범위로만. 수익 보장·인증 흉내 금지.
- 실험(experiments): 프롬프트, 요약, 분류, 문서 초안, 표 정리, 코드 한 조각처럼 AI에 시켜서 결과를 바로 보여 줄 수 있는 것만. 외부 사이트 접속·이미지·영상 생성·실제 결제는 불가. 실행 결과는 그대로 글에 인용된다.
- AI 뉴스는 실험 없이: 원문에서 독자에게 가장 의외인 사실 하나를 후킹으로."""


def plan(topic_title: str, category: str, block: str) -> Angle:
    user = f"토픽: {topic_title}\n카테고리: {category}\n\n{block}\n\n이 글의 각도를 설계해라."
    r = claude_client.client().messages.parse(
        model=claude_client.MODEL, max_tokens=8000, system=SYSTEM,
        messages=[{"role": "user", "content": user}],
        output_format=Angle, output_config={"effort": "medium"})
    if r.parsed_output is None:
        raise RuntimeError("각도 설계 실패")
    return r.parsed_output


def run_experiments(exps: list[Experiment], limit: int = 2) -> list[dict]:
    out = []
    for e in exps[:limit]:
        try:
            r = claude_client.client().messages.create(
                model=claude_client.MODEL, max_tokens=3000,
                messages=[{"role": "user", "content": e.prompt}],
                output_config={"effort": "low"})
            text = claude_client.text_of(r).strip()
        except Exception as ex:
            print(f"  [테스트] 실행 실패: {ex}")
            continue
        if text:
            out.append({"purpose": e.purpose, "prompt": e.prompt, "output": text[:1800],
                        "truncated": len(text) > 1800, "model": TEST_MODEL_LABEL})
    return out


def prompt_block(a: Angle, results: list[dict]) -> str:
    lines = ["[편집 방향 - 이 각도로 쓸 것]",
             f"후킹 유형: {a.hook_type}",
             f"각도: {a.angle}",
             f"첫 문단 초안(다듬어서 사용): {a.opening}",
             "제목 아이디어: " + " / ".join(a.title_ideas),
             "소제목 흐름: " + " → ".join(a.outline),
             f"독자가 공유하고 싶어질 포인트: {a.share_point}"]
    if a.calc:
        lines.append(f"수익 구조 계산(모든 숫자는 '가정'이라고 표시할 것): {a.calc}")
    if results:
        lines.append("\n[세로AI 테스트 결과 - 실제 실행한 결과. 본문에 '세로AI 테스트' 섹션으로 넣을 것]")
        lines.append(f"규칙: 프롬프트는 코드블록으로, 결과는 인용블록이나 코드블록으로 핵심만(필요하면 줄임 표시). "
                     f"'{TEST_MODEL_LABEL}로 실행한 결과'라고 밝히고, 다른 AI(챗GPT 등)에서도 같다고 단정하지 말 것. "
                     f"결과에서 좋았던 점과 고쳐야 할 점을 솔직하게 평가할 것.")
        for i, r in enumerate(results, 1):
            lines.append(f"테스트 {i} 목적: {r['purpose']}\n프롬프트:\n{r['prompt']}\n실행 결과:\n{r['output']}")
    return "\n".join(lines)
