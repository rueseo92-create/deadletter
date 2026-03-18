"""deadletter — 메인 파이프라인

iMessage 수신 → AI 상담 → 익명화 → 게시 전체 흐름을 관리한다.
"""

import json
import logging
import sys
from pathlib import Path

import config
from db import models
from core import (
    message_watcher,
    message_sender,
    ai_handler,
    anonymizer,
    session_manager,
    crisis_detector,
)
from moderation import inbound_filter, outbound_filter
from publisher import letter_publisher
from monitoring import alerter

# 로깅 설정
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(
            config.LOG_DIR / "deadletter.log", encoding="utf-8"
        )
        if config.LOG_DIR.exists() or not config.LOG_DIR.mkdir(parents=True, exist_ok=True)
        else logging.StreamHandler(),
    ],
)

logger = logging.getLogger("deadletter")


def process_message(msg: dict) -> None:
    """새 메시지를 처리하는 메인 파이프라인.

    Args:
        msg: {
            "rowid": int,
            "text": str,
            "sender_id": str,
            "date": int,
        }
    """
    sender = msg["sender_id"]
    text = msg["text"]

    logger.info("메시지 처리 시작: ROWID=%d", msg["rowid"])

    # 1. 사용자 차단 체크
    if models.is_user_blocked(sender):
        logger.info("차단된 사용자 — 무시: %s", sender[:8])
        return

    # 2. 수신 콘텐츠 필터
    inbound_check = inbound_filter.check_inbound(text)
    if not inbound_check["is_allowed"]:
        logger.info(
            "수신 필터 거부 (%s): %s...",
            inbound_check["reason"],
            text[:30],
        )
        return

    # 3. 사용자 조회/생성
    user = models.get_or_create_user(sender)
    models.increment_message_count(user["id"])

    # 4. 위기 감지
    crisis = crisis_detector.detect_crisis(text)
    if crisis["is_crisis"]:
        logger.warning("위기 감지 — 위기 리소스 전달")
        message_sender.send_imessage(sender, crisis["crisis_response"])
        alerter.alert_crisis_detected(crisis["matched_keywords"])
        # 위기 편지는 DB에 저장하되 게시하지 않음
        models.create_letter(
            user_id=user["id"],
            anonymized_text="[위기 감지 — 비공개]",
            ai_reply=crisis["crisis_response"],
            language=crisis["language"],
            is_crisis=True,
        )
        return

    # 5. 세션 관리 + 대화 기록
    session = session_manager.get_or_create_session(user["id"])
    history = session_manager.get_conversation_history(session)
    is_first = session_manager.is_first_message(session)

    # 6. AI 답변 생성
    ai_result = ai_handler.generate_reply(text, history)

    # 첫 메시지이면 웰컴 멘트 추가
    reply = ai_result["reply"]
    if is_first:
        welcome = ai_handler.get_welcome_message(ai_result["language"])
        reply = f"{welcome}\n\n{reply}"

    # 7. iMessage 발신
    sent = message_sender.send_imessage(sender, reply)
    if not sent:
        logger.error("메시지 발송 실패 — 파이프라인 중단")
        alerter.alert_error("message_sender", f"발송 실패: ROWID={msg['rowid']}")
        return

    # 8. 대화 기록 업데이트
    session_manager.add_to_history(session, text, ai_result["reply"])

    # 9. 익명화
    anon_result = anonymizer.anonymize(text)

    if not anon_result["is_safe"]:
        logger.warning("익명화 불완전 — 게시 보류")
        # DB에 저장하되 미게시
        models.create_letter(
            user_id=user["id"],
            anonymized_text=anon_result["anonymized_text"],
            ai_reply=ai_result["reply"],
            language=ai_result["language"],
            is_crisis=False,
        )
        return

    # 10. 게시 전 최종 필터
    outbound_check = outbound_filter.check_outbound(
        anon_result["anonymized_text"], ai_result["reply"]
    )

    if not outbound_check["is_publishable"]:
        logger.info(
            "게시 필터 거부 (%s): %s",
            outbound_check["reason"],
            outbound_check.get("warnings", []),
        )
        models.create_letter(
            user_id=user["id"],
            anonymized_text=anon_result["anonymized_text"],
            ai_reply=ai_result["reply"],
            language=ai_result["language"],
            is_crisis=False,
        )
        return

    # 11. DB에 편지 저장 (게시 가능 상태)
    letter = models.create_letter(
        user_id=user["id"],
        anonymized_text=anon_result["anonymized_text"],
        ai_reply=ai_result["reply"],
        language=ai_result["language"],
        is_crisis=False,
    )

    logger.info("편지 생성 완료: %s", letter["letter_id"])

    # 12. JSON 생성 + GitHub push (주기적으로 배치 실행 가능)
    try:
        letter_publisher.write_letters_json()
        logger.info("letters.json 업데이트 완료")
    except Exception as e:
        logger.error("letters.json 생성 실패: %s", e)
        alerter.alert_error("letter_publisher", str(e))


def run() -> None:
    """deadletter 서비스를 시작한다."""
    logger.info("=" * 50)
    logger.info("deadletter 서비스 시작")
    logger.info("=" * 50)

    # DB 초기화
    models.init_db()
    logger.info("DB 초기화 완료: %s", config.DB_PATH)

    # 상태 체크
    from monitoring.health_check import run_health_check

    report = run_health_check()
    if report["overall"] == "error":
        logger.error("시스템 상태 에러 — 시작 전 점검 필요")
        alerter.alert_health_report(report)
        return

    # iMessage 모니터링 시작
    logger.info("iMessage 모니터링 시작 (interval: %ds)", config.POLLING_INTERVAL)
    message_watcher.watch_messages(callback=process_message)


if __name__ == "__main__":
    run()
