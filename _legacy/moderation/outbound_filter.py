"""deadletter moderation — 게시 전 최종 필터

편지가 웹에 게시되기 전 최종 안전성 검사를 수행한다.
"""

import re
import logging

logger = logging.getLogger(__name__)

# 게시 금지 패턴 (익명화 이후에도 남을 수 있는 것들)
BLOCK_PATTERNS = [
    r"\[REDACTED\].*\[REDACTED\].*\[REDACTED\].*\[REDACTED\].*\[REDACTED\]",  # 5개 이상 redaction
    r"@\w+",                     # 소셜 핸들 잔류
    r"instagram\.com",           # SNS 링크 잔류
    r"twitter\.com",
    r"facebook\.com",
]

# 최소 편지 길이 (너무 짧으면 의미 없음)
MIN_LETTER_LENGTH = 20


def check_outbound(anonymized_text: str, ai_reply: str) -> dict:
    """게시 전 편지와 AI 답변의 적절성을 최종 검사한다.

    Args:
        anonymized_text: 익명화된 편지 텍스트
        ai_reply: AI 상담 답변

    Returns:
        {
            "is_publishable": bool,
            "reason": str | None,
            "warnings": list[str],
        }
    """
    warnings: list[str] = []

    # 빈 텍스트 체크
    if not anonymized_text or not anonymized_text.strip():
        return {"is_publishable": False, "reason": "empty_text", "warnings": warnings}

    if not ai_reply or not ai_reply.strip():
        return {"is_publishable": False, "reason": "empty_reply", "warnings": warnings}

    # 최소 길이
    if len(anonymized_text.strip()) < MIN_LETTER_LENGTH:
        return {"is_publishable": False, "reason": "too_short", "warnings": warnings}

    # 과도한 redaction 체크 (원문 의미 손실)
    redaction_count = anonymized_text.count("[REDACTED]")
    word_count = len(anonymized_text.split())

    if word_count > 0 and redaction_count / word_count > 0.4:
        warnings.append(f"높은 redaction 비율: {redaction_count}/{word_count}")
        return {
            "is_publishable": False,
            "reason": "excessive_redaction",
            "warnings": warnings,
        }

    # 금지 패턴 체크
    combined_text = f"{anonymized_text} {ai_reply}"
    for pattern in BLOCK_PATTERNS:
        if re.search(pattern, combined_text, re.IGNORECASE):
            return {
                "is_publishable": False,
                "reason": f"blocked_pattern: {pattern}",
                "warnings": warnings,
            }

    # 경고 (게시는 허용)
    if redaction_count >= 3:
        warnings.append(f"다수의 redaction ({redaction_count}개)")

    return {"is_publishable": True, "reason": None, "warnings": warnings}
