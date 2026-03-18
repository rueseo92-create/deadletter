"""deadletter core — 대화 세션 관리

사용자별 대화 세션을 추적하고, 컨텍스트를 유지한다.
"""

import json
import logging
from typing import Optional

import config
from db import models

logger = logging.getLogger(__name__)


def get_or_create_session(user_id: int) -> dict:
    """사용자의 활성 세션을 반환하거나 새로 생성한다.

    Args:
        user_id: 사용자 DB ID

    Returns:
        세션 dict (id, user_id, context, started_at, last_activity, is_active)
    """
    # 타임아웃된 세션 정리
    stale = models.deactivate_stale_sessions(config.SESSION_TIMEOUT_MINUTES)
    if stale > 0:
        logger.info("만료 세션 %d개 비활성화", stale)

    session = models.get_active_session(user_id)
    if session:
        logger.debug("기존 세션 사용: session_id=%d", session["id"])
        return session

    session = models.create_session(user_id)
    logger.info("새 세션 생성: session_id=%d, user_id=%d", session["id"], user_id)
    return session


def get_conversation_history(session: dict) -> list[dict]:
    """세션의 대화 기록을 반환한다.

    Args:
        session: 세션 dict

    Returns:
        [{"role": "user"|"assistant", "content": str}, ...]
    """
    context_str = session.get("context", "[]")
    try:
        return json.loads(context_str) if context_str else []
    except json.JSONDecodeError:
        logger.warning("세션 컨텍스트 파싱 실패: session_id=%d", session["id"])
        return []


def add_to_history(
    session: dict,
    user_message: str,
    ai_reply: str,
) -> list[dict]:
    """세션 대화 기록에 새 메시지 쌍을 추가한다.

    Args:
        session: 세션 dict
        user_message: 사용자 메시지
        ai_reply: AI 답변

    Returns:
        업데이트된 대화 기록
    """
    history = get_conversation_history(session)

    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": ai_reply})

    # 최대 컨텍스트 크기 유지
    max_entries = config.MAX_CONTEXT_MESSAGES * 2  # user + assistant 쌍
    if len(history) > max_entries:
        history = history[-max_entries:]

    models.update_session_context(session["id"], history)
    logger.debug(
        "대화 기록 업데이트: session_id=%d, entries=%d",
        session["id"],
        len(history),
    )

    return history


def is_first_message(session: dict) -> bool:
    """세션의 첫 메시지인지 확인한다."""
    history = get_conversation_history(session)
    return len(history) == 0
