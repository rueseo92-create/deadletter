"""deadletter moderation — 수신 콘텐츠 필터

수신 메시지에서 스팸, 악성 콘텐츠, 부적절한 내용을 감지한다.
"""

import re
import logging

logger = logging.getLogger(__name__)

# 스팸 패턴
SPAM_PATTERNS = [
    r"http[s]?://\S+",          # URL
    r"bit\.ly/\S+",             # 단축 URL
    r"무료\s*상담",              # 광고성
    r"대출\s*상담",              # 대출 스팸
    r"카지노",                   # 도박
    r"투자\s*수익",              # 투자 사기
    r"click here",
    r"free money",
    r"you have won",
]

# 최소 메시지 길이
MIN_MESSAGE_LENGTH = 2

# 최대 메시지 길이
MAX_MESSAGE_LENGTH = 5000


def check_inbound(text: str) -> dict:
    """수신 메시지의 적절성을 검사한다.

    Args:
        text: 수신 메시지 텍스트

    Returns:
        {
            "is_allowed": bool,
            "reason": str | None,
            "spam_score": float,  # 0.0 ~ 1.0
        }
    """
    # 빈 메시지
    if not text or not text.strip():
        return {"is_allowed": False, "reason": "empty_message", "spam_score": 0.0}

    text = text.strip()

    # 최소 길이
    if len(text) < MIN_MESSAGE_LENGTH:
        return {"is_allowed": False, "reason": "too_short", "spam_score": 0.0}

    # 최대 길이
    if len(text) > MAX_MESSAGE_LENGTH:
        return {"is_allowed": False, "reason": "too_long", "spam_score": 0.0}

    # 스팸 패턴 검사
    spam_matches = 0
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            spam_matches += 1

    spam_score = min(spam_matches / 3.0, 1.0)  # 3개 이상이면 1.0

    if spam_score >= 0.7:
        logger.warning("스팸 감지 (score: %.2f): %s...", spam_score, text[:50])
        return {"is_allowed": False, "reason": "spam_detected", "spam_score": spam_score}

    return {"is_allowed": True, "reason": None, "spam_score": spam_score}
