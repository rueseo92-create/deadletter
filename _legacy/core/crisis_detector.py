"""deadletter core — 위기 감지 모듈

자해/자살 관련 위기 상황을 감지하고 전문 상담 연결 정보를 제공한다.
"""

import re
import logging

import config

logger = logging.getLogger(__name__)

# 위기 키워드 (한국어)
CRISIS_KEYWORDS_KO = [
    "죽고 싶", "죽고싶", "자살", "자해",
    "살고 싶지 않", "살기 싫", "끝내고 싶",
    "없어지고 싶", "사라지고 싶", "태어나지 말았",
    "삶이 끝", "더 이상 못",
]

# 위기 키워드 (영어)
CRISIS_KEYWORDS_EN = [
    "kill myself", "suicide", "self-harm", "self harm",
    "want to die", "end my life", "end it all",
    "don't want to live", "no reason to live",
    "better off dead", "can't go on",
]

CRISIS_RESPONSE_KO = """당신의 이야기를 들을 수 있어서 다행이에요. 지금 많이 힘드시죠.

혼자 감당하지 않아도 돼요. 전문 상담사가 24시간 대기하고 있어요:
- 자살예방상담전화: 1393
- 정신건강위기상담전화: 1577-0199

전화가 어려우시면 여기서 계속 이야기해도 괜찮아요."""

CRISIS_RESPONSE_EN = """I hear you, and I'm glad you're reaching out. What you're feeling is heavy, and you don't have to carry it alone.

Please reach out to someone who can help right now:
- Crisis Text Line: text HOME to 741741
- National Suicide Prevention Lifeline: 988

And if you'd rather keep talking here, I'm not going anywhere."""


def detect_crisis(text: str) -> dict:
    """텍스트에서 위기 신호를 감지한다.

    Args:
        text: 사용자 메시지 텍스트

    Returns:
        {
            "is_crisis": bool,
            "matched_keywords": list[str],
            "language": str,
            "crisis_response": str | None,
        }
    """
    text_lower = text.lower()
    matched = []

    # 한국어 키워드 체크
    for kw in CRISIS_KEYWORDS_KO:
        if kw in text_lower:
            matched.append(kw)

    # 영어 키워드 체크
    for kw in CRISIS_KEYWORDS_EN:
        if kw in text_lower:
            matched.append(kw)

    is_crisis = len(matched) > 0

    if is_crisis:
        # 언어 판별
        korean_chars = sum(1 for c in text if "\uac00" <= c <= "\ud7a3")
        language = "ko" if korean_chars > len(text) * 0.2 else "en"

        crisis_response = CRISIS_RESPONSE_KO if language == "ko" else CRISIS_RESPONSE_EN

        logger.warning(
            "위기 감지: keywords=%s, lang=%s", matched, language
        )

        return {
            "is_crisis": True,
            "matched_keywords": matched,
            "language": language,
            "crisis_response": crisis_response,
        }

    return {
        "is_crisis": False,
        "matched_keywords": [],
        "language": "",
        "crisis_response": None,
    }
