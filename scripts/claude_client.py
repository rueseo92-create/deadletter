"""공용 Claude 설정. 모델을 바꿀 때는 여기 한 곳만 고친다."""

MODEL = "claude-sonnet-5-5"          # 심사·각도 설계·소셜 등 일반 작업
WRITER_MODEL = "claude-opus-5-5"     # 블로그 본문 작성·고쳐 쓰기 (품질이 가장 중요한 단계)


def text_of(response) -> str:
    """응답에서 text 블록만 이어 붙인다 (thinking 블록이 앞에 올 수 있음)."""
    if getattr(response, "stop_reason", None) == "refusal":
        raise RuntimeError(f"모델이 요청을 거절했습니다: {getattr(response, 'stop_details', None)}")
    return "".join(b.text for b in response.content if getattr(b, "type", "") == "text")


_client = None


def client():
    """공용 Anthropic 클라이언트 (ANTHROPIC_API_KEY 사용)."""
    global _client
    if _client is None:
        import anthropic
        _client = anthropic.Anthropic()
    return _client
