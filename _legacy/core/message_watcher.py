"""deadletter core — iMessage 수신 모니터링

macOS Messages DB (chat.db)를 polling하여 새 메시지를 감지한다.
Full Disk Access 권한 필수.
"""

import sqlite3
import time
import logging
from typing import Optional

import config

logger = logging.getLogger(__name__)


def decode_attributed_body(blob: bytes) -> str:
    """macOS Ventura 이상에서 attributedBody 컬럼을 디코딩한다.

    Args:
        blob: attributedBody 바이너리 데이터

    Returns:
        디코딩된 텍스트 문자열
    """
    try:
        parts = blob.split(b"NSString")
        if len(parts) < 2:
            return ""
        text = parts[1]
        text = text[5:]  # Skip encoding bytes
        length = int.from_bytes(text[:1], "little")
        return text[1 : 1 + length].decode("utf-8", errors="replace")
    except (IndexError, ValueError) as e:
        logger.warning("attributedBody 디코딩 실패: %s", e)
        return ""


def get_imessage_connection() -> sqlite3.Connection:
    """iMessage chat.db에 읽기 전용 연결을 반환한다.

    Returns:
        sqlite3.Connection (읽기 전용)
    """
    db_path = config.IMESSAGE_DB_PATH
    uri = f"file:{db_path}?mode=ro"
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def fetch_new_messages(last_rowid: int) -> list[dict]:
    """마지막 처리한 ROWID 이후의 새 메시지를 조회한다.

    Args:
        last_rowid: 마지막으로 처리한 메시지 ROWID

    Returns:
        새 메시지 목록 (dict 리스트)
    """
    conn = get_imessage_connection()
    try:
        rows = conn.execute(
            """
            SELECT
                m.ROWID, m.text, m.attributedBody, m.date,
                m.is_from_me, h.id as sender_id
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.ROWID > :last_rowid
              AND m.is_from_me = 0
            ORDER BY m.date ASC
            """,
            {"last_rowid": last_rowid},
        ).fetchall()

        messages = []
        for row in rows:
            row_dict = dict(row)
            text = row_dict.get("text") or ""

            # macOS Ventura+: text가 없으면 attributedBody에서 추출
            if not text and row_dict.get("attributedBody"):
                text = decode_attributed_body(row_dict["attributedBody"])

            if text.strip():
                messages.append(
                    {
                        "rowid": row_dict["ROWID"],
                        "text": text.strip(),
                        "sender_id": row_dict["sender_id"],
                        "date": row_dict["date"],
                    }
                )

        return messages
    except sqlite3.OperationalError as e:
        logger.error("chat.db 쿼리 실패: %s", e)
        return []
    finally:
        conn.close()


def get_last_rowid() -> int:
    """chat.db의 마지막 ROWID를 반환한다."""
    conn = get_imessage_connection()
    try:
        row = conn.execute("SELECT MAX(ROWID) as max_id FROM message").fetchone()
        return row["max_id"] or 0
    finally:
        conn.close()


def watch_messages(
    callback,
    last_rowid: Optional[int] = None,
    poll_interval: Optional[int] = None,
) -> None:
    """새 메시지를 지속적으로 모니터링하고 콜백을 호출한다.

    Args:
        callback: 새 메시지가 감지되면 호출되는 함수 (message dict를 인자로 받음)
        last_rowid: 시작 ROWID (None이면 현재 마지막부터 시작)
        poll_interval: 폴링 간격 초 (None이면 config 사용)
    """
    if poll_interval is None:
        poll_interval = config.POLLING_INTERVAL

    if last_rowid is None:
        last_rowid = get_last_rowid()
        logger.info("마지막 ROWID %d부터 모니터링 시작", last_rowid)

    logger.info(
        "iMessage 모니터링 시작 (polling interval: %ds)", poll_interval
    )

    while True:
        try:
            messages = fetch_new_messages(last_rowid)

            for msg in messages:
                logger.info(
                    "새 메시지 수신: ROWID=%d, sender=%s",
                    msg["rowid"],
                    msg["sender_id"],
                )
                try:
                    callback(msg)
                except Exception as e:
                    logger.error("메시지 처리 실패 (ROWID=%d): %s", msg["rowid"], e)

                last_rowid = msg["rowid"]

            time.sleep(poll_interval)

        except KeyboardInterrupt:
            logger.info("모니터링 중단 (사용자 요청)")
            break
        except Exception as e:
            logger.error("폴링 에러: %s — 5초 후 재시도", e)
            time.sleep(5)
