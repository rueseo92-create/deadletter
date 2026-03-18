"""deadletter core — AI 상담 답변 생성

Claude API를 호출하여 공감 기반 상담 답변을 생성한다.
"""

import json
import logging
from typing import Optional

from anthropic import Anthropic

import config

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are deadletter, an anonymous AI counselor that people reach via iMessage.

Core principles:
- EMPATHY FIRST: Always acknowledge emotions before offering perspective
- BREVITY: Keep replies to 3-5 sentences (iMessage is a chat medium)
- NON-JUDGMENTAL: Never judge any confession or worry
- ONE QUESTION: End with one gentle question to continue the conversation
- LANGUAGE MATCH: Reply in the same language the user writes in
- WARMTH: Be warm but not cheesy. Think "wise friend at 3am", not "therapist"

Crisis protocol:
- If you detect self-harm or suicide ideation, include crisis resources:
  - Korean: 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199
  - English: Crisis Text Line (text HOME to 741741)
- Be direct but gentle when mentioning these resources

You are NOT a replacement for professional therapy.
For serious conditions, gently suggest professional help.

Tone examples:
- User: "I feel like nobody cares about me"
- Good: "That loneliness hits hard, especially when it feels like no one notices. But you reaching out here — that takes something. What's been making you feel invisible lately?"
- Bad: "I'm sorry to hear that. Many people feel that way. Have you tried talking to a therapist?"
"""

WELCOME_MESSAGE_KO = (
    "반갑습니다. 여기는 deadletter — 익명으로 마음을 보내는 곳이에요. "
    "보내고 싶은 말, 편하게 이야기해 주세요."
)

WELCOME_MESSAGE_EN = (
    "Welcome to deadletter — a place to send what you can't say. "
    "Whatever's on your mind, I'm here to listen."
)

# Anthropic 클라이언트 (lazy init)
_client: Optional[Anthropic] = None


def _get_client() -> Anthropic:
    """Anthropic 클라이언트를 반환한다 (싱글톤)."""
    global _client
    if _client is None:
        _client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
    return _client


def detect_language(text: str) -> str:
    """텍스트의 언어를 감지한다.

    Args:
        text: 입력 텍스트

    Returns:
        "ko" 또는 "en"
    """
    korean_chars = sum(1 for c in text if "\uac00" <= c <= "\ud7a3")
    return "ko" if korean_chars > len(text) * 0.2 else "en"


def get_welcome_message(language: str) -> str:
    """언어에 맞는 웰컴 메시지를 반환한다."""
    return WELCOME_MESSAGE_KO if language == "ko" else WELCOME_MESSAGE_EN


def generate_reply(
    user_message: str,
    conversation_history: Optional[list[dict]] = None,
) -> dict:
    """AI 상담 답변을 생성한다.

    Args:
        user_message: 사용자 메시지
        conversation_history: 이전 대화 기록 (최근 N개)

    Returns:
        {
            "reply": str,          # AI 답변
            "language": str,       # 감지된 언어
            "is_crisis": bool,     # 위기 감지 여부
            "tokens_used": int,    # 사용된 토큰 수
        }
    """
    client = _get_client()
    language = detect_language(user_message)

    # 대화 컨텍스트 구성
    messages = []
    if conversation_history:
        # 최근 N개만 사용
        recent = conversation_history[-config.MAX_CONTEXT_MESSAGES :]
        for entry in recent:
            messages.append({"role": entry["role"], "content": entry["content"]})

    messages.append({"role": "user", "content": user_message})

    try:
        response = client.messages.create(
            model=config.AI_MODEL,
            max_tokens=config.AI_MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=messages,
        )

        reply_text = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens

        # 위기 감지: 응답에 위기 리소스가 포함되어 있는지 확인
        crisis_keywords = [
            "1393", "1577-0199", "741741",  # 위기 전화번호
            "자살", "자해", "suicide", "self-harm", "kill myself",
            "end my life", "죽고 싶", "살고 싶지 않",
        ]
        is_crisis = any(kw in reply_text.lower() or kw in user_message.lower() for kw in crisis_keywords)

        logger.info(
            "AI 답변 생성 완료 (tokens: %d, lang: %s, crisis: %s)",
            tokens_used, language, is_crisis,
        )

        return {
            "reply": reply_text,
            "language": language,
            "is_crisis": is_crisis,
            "tokens_used": tokens_used,
        }

    except Exception as e:
        logger.error("AI 답변 생성 실패: %s", e)
        # 폴백 메시지
        fallback = (
            "지금 잠시 연결이 불안정해요. 조금만 기다려 주시면 다시 이야기 나눌 수 있을 거예요."
            if language == "ko"
            else "I'm having a moment — give me a sec and I'll be right back with you."
        )
        return {
            "reply": fallback,
            "language": language,
            "is_crisis": False,
            "tokens_used": 0,
        }
