"""deadletter core — iMessage 발신 (AppleScript)

AppleScript를 통해 iMessage를 발송한다.
macOS에서만 동작하며, 발신 간격 최소 2초를 유지한다.
"""

import subprocess
import time
import logging
from datetime import date

import config
from db import models

logger = logging.getLogger(__name__)

# 일일 발송 추적
_daily_count: int = 0
_daily_date: date = date.today()


def _escape_applescript(text: str) -> str:
    """AppleScript 문자열 내 특수 문자를 이스케이프한다."""
    return text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")


def _reset_daily_count_if_needed() -> None:
    """날짜가 바뀌면 일일 카운트를 초기화한다."""
    global _daily_count, _daily_date
    today = date.today()
    if today != _daily_date:
        _daily_count = 0
        _daily_date = today


def send_imessage(phone: str, message: str) -> bool:
    """iMessage로 메시지를 발신한다.

    Args:
        phone: 수신자 전화번호
        message: 발송할 메시지 텍스트

    Returns:
        발송 성공 여부
    """
    _reset_daily_count_if_needed()

    if _daily_count >= config.MAX_DAILY_MESSAGES:
        logger.warning("일일 발송 한도 초과: %d/%d", _daily_count, config.MAX_DAILY_MESSAGES)
        return False

    escaped_message = _escape_applescript(message)
    escaped_phone = _escape_applescript(phone)

    script = f'''
    tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant "{escaped_phone}" of targetService
        send "{escaped_message}" to targetBuddy
    end tell
    '''

    max_retries = 3
    for attempt in range(1, max_retries + 1):
        try:
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode == 0:
                global _daily_count
                _daily_count += 1
                logger.info(
                    "메시지 발송 성공 (시도 %d/%d, 일일 %d건)",
                    attempt, max_retries, _daily_count,
                )
                # 스팸 방지: 최소 2초 대기
                time.sleep(2)
                return True

            logger.warning(
                "AppleScript 실행 실패 (시도 %d/%d): %s",
                attempt, max_retries, result.stderr.strip(),
            )

        except subprocess.TimeoutExpired:
            logger.warning("AppleScript 타임아웃 (시도 %d/%d)", attempt, max_retries)
        except Exception as e:
            logger.error("발송 에러 (시도 %d/%d): %s", attempt, max_retries, e)

        # Exponential backoff
        if attempt < max_retries:
            wait = 2 ** attempt
            logger.info("%d초 후 재시도", wait)
            time.sleep(wait)

    logger.error("메시지 발송 최종 실패: %s", phone)
    return False


def send_long_message(phone: str, message: str, max_length: int = 500) -> bool:
    """긴 메시지를 분할하여 발송한다.

    Args:
        phone: 수신자 전화번호
        message: 발송할 메시지 텍스트
        max_length: 분할 기준 글자 수

    Returns:
        모든 분할 메시지 발송 성공 여부
    """
    if len(message) <= max_length:
        return send_imessage(phone, message)

    # 문장 단위로 분할
    sentences = message.replace(". ", ".\n").split("\n")
    chunks: list[str] = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence) + 1 > max_length and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk = f"{current_chunk} {sentence}" if current_chunk else sentence

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    all_sent = True
    for chunk in chunks:
        if not send_imessage(phone, chunk):
            all_sent = False
            break

    return all_sent
