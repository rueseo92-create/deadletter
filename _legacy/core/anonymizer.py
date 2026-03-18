"""deadletter core — 2단계 개인정보 필터링

Stage 1: Regex 기반 패턴 매칭 (전화번호, 이메일, 주민번호 등)
Stage 2: AI 기반 컨텍스트 인식 필터링 (이름, 학교, 회사 등)
"""

import re
import logging
from typing import Optional

from anthropic import Anthropic

import config

logger = logging.getLogger(__name__)

# ── Stage 1: Regex Patterns ──

PATTERNS: dict[str, str] = {
    "phone_kr": r"01[016789]-?\d{3,4}-?\d{4}",
    "phone_intl": r"\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "ssn_kr": r"\d{6}[-\s]?\d{7}",
    "address_kr": (
        r"(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)"
        r"[시도]?\s*\S+[시군구]\s*\S+[읍면동로길]"
    ),
    "card_number": r"\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}",
}

REPLACEMENT = "[REDACTED]"

# ── Stage 2: AI Filter Prompt ──

AI_FILTER_PROMPT = """Analyze the following text and identify ANY personal information that could identify a specific person. Replace each identified item with [REDACTED].

Look for:
- Personal names (Korean or English)
- Company names that could identify the person
- School names
- Specific location names (building names, apartment names)
- Social media handles or usernames
- Any other contextually identifying information

IMPORTANT: Only redact information that could identify a specific individual.
Generic references like "my company" or "my school" should be kept.

Return ONLY the anonymized text, nothing else."""

# Anthropic 클라이언트 (lazy init)
_client: Optional[Anthropic] = None


def _get_client() -> Anthropic:
    """Anthropic 클라이언트를 반환한다 (싱글톤)."""
    global _client
    if _client is None:
        _client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
    return _client


def stage1_regex_filter(text: str) -> tuple[str, int]:
    """Stage 1: Regex 패턴으로 개인정보를 필터링한다.

    Args:
        text: 원본 텍스트

    Returns:
        (필터링된 텍스트, 치환 횟수)
    """
    total_replacements = 0
    filtered = text

    for pattern_name, pattern in PATTERNS.items():
        matches = re.findall(pattern, filtered)
        if matches:
            filtered = re.sub(pattern, REPLACEMENT, filtered)
            total_replacements += len(matches)
            logger.debug(
                "Stage 1 [%s]: %d개 매칭 → 치환", pattern_name, len(matches)
            )

    return filtered, total_replacements


def stage2_ai_filter(text: str) -> tuple[str, bool]:
    """Stage 2: AI로 컨텍스트 기반 개인정보를 필터링한다.

    Args:
        text: Stage 1 처리 완료된 텍스트

    Returns:
        (AI 필터링된 텍스트, 성공 여부)
    """
    client = _get_client()

    try:
        response = client.messages.create(
            model=config.AI_MODEL,
            max_tokens=config.AI_MAX_TOKENS,
            system=AI_FILTER_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
        filtered_text = response.content[0].text.strip()
        logger.info("Stage 2 AI 필터링 완료")
        return filtered_text, True

    except Exception as e:
        logger.error("Stage 2 AI 필터링 실패: %s", e)
        return text, False


def anonymize(text: str, skip_ai: bool = False) -> dict:
    """2단계 파이프라인으로 텍스트를 익명화한다.

    Args:
        text: 원본 메시지 텍스트
        skip_ai: True이면 Stage 2 (AI) 건너뜀

    Returns:
        {
            "original_length": int,
            "anonymized_text": str,
            "stage1_replacements": int,
            "stage2_success": bool,
            "is_safe": bool,  # 게시 가능 여부
        }
    """
    original_length = len(text)

    # Stage 1: Regex
    stage1_text, stage1_count = stage1_regex_filter(text)
    logger.info("Stage 1 완료: %d개 개인정보 치환", stage1_count)

    # Stage 2: AI
    stage2_success = True
    if not skip_ai:
        stage1_text, stage2_success = stage2_ai_filter(stage1_text)

    # 안전성 판단
    is_safe = stage2_success or stage1_count == 0

    if not is_safe:
        logger.warning("익명화 불완전 — 게시 보류 (action: %s)", config.ANONYMIZE_FAIL_ACTION)

    return {
        "original_length": original_length,
        "anonymized_text": stage1_text,
        "stage1_replacements": stage1_count,
        "stage2_success": stage2_success,
        "is_safe": is_safe,
    }
