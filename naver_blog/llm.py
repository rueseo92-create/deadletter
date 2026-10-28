"""Claude 호출 (구조화 출력)."""
import anthropic

from .config import require_key

_client = None


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        require_key()
        _client = anthropic.Anthropic()
    return _client


def parse(model: str, system: str, content, schema, effort: str = "medium"):
    """content: 문자열 또는 content block 리스트(이미지 포함 가능)."""
    resp = client().beta.messages.parse(
        model=model,
        max_tokens=16000,
        system=system,
        messages=[{"role": "user", "content": content}],
        output_format=schema,
        output_config={"effort": effort},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    )
    if resp.stop_reason == "refusal":
        raise RuntimeError(f"모델이 요청을 거절했습니다: {resp.stop_details}")
    if resp.parsed_output is None:
        raise RuntimeError(f"구조화 출력 파싱 실패 (stop_reason={resp.stop_reason})")
    return resp.parsed_output
