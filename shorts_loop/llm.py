"""Claude API 래퍼. 구조화 출력(pydantic)으로 받는다."""
import anthropic

from .config import env

_client = None


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        env("ANTHROPIC_API_KEY")
        _client = anthropic.Anthropic()
    return _client


def parse(model: str, system: str, prompt: str, schema, effort: str = "medium"):
    """schema(pydantic 모델) 인스턴스를 돌려준다. 거절되면 RuntimeError."""
    resp = client().beta.messages.parse(
        model=model,
        max_tokens=16000,
        system=system,
        messages=[{"role": "user", "content": prompt}],
        output_format=schema,
        output_config={"effort": effort},
        # 안전 분류기가 거절하면 서버가 다른 모델로 자동 재시도
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )
    if resp.stop_reason == "refusal":
        raise RuntimeError(f"모델이 요청을 거절했습니다: {resp.stop_details}")
    if resp.parsed_output is None:
        raise RuntimeError(f"구조화 출력 파싱 실패 (stop_reason={resp.stop_reason})")
    return resp.parsed_output
