"""deadletter — iMessage 연동 테스트 스크립트

macOS에서 iMessage DB 접근과 발신 기능을 테스트한다.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import config


def test_db_access():
    """iMessage DB 읽기 테스트"""
    print("=" * 40)
    print("1. iMessage DB 접근 테스트")
    print("=" * 40)

    try:
        from core.message_watcher import get_imessage_connection

        conn = get_imessage_connection()
        row = conn.execute("SELECT COUNT(*) as cnt FROM message").fetchone()
        print(f"  [OK] 접근 성공 — 총 {row['cnt']}건 메시지")
        conn.close()
    except Exception as e:
        print(f"  [FAIL] 접근 실패: {e}")
        print("  → Full Disk Access 권한을 확인하세요")


def test_recent_messages():
    """최근 메시지 조회 테스트"""
    print("\n" + "=" * 40)
    print("2. 최근 메시지 조회 테스트")
    print("=" * 40)

    try:
        from core.message_watcher import get_imessage_connection

        conn = get_imessage_connection()
        rows = conn.execute(
            """SELECT m.ROWID, m.text, h.id as sender
            FROM message m
            LEFT JOIN handle h ON m.handle_id = h.ROWID
            WHERE m.is_from_me = 0 AND m.text IS NOT NULL
            ORDER BY m.date DESC LIMIT 3"""
        ).fetchall()

        if rows:
            for row in rows:
                sender = row["sender"] or "unknown"
                text = (row["text"] or "")[:50]
                print(f"  ROWID={row['ROWID']}, sender={sender[:20]}, text={text}...")
        else:
            print("  수신 메시지 없음")

        conn.close()
    except Exception as e:
        print(f"  [FAIL] {e}")


def test_send_capability():
    """AppleScript 발신 가능 여부 테스트 (실제 발송하지 않음)"""
    print("\n" + "=" * 40)
    print("3. iMessage 발신 기능 테스트")
    print("=" * 40)

    import subprocess

    try:
        result = subprocess.run(
            ["osascript", "-e", 'tell application "Messages" to get name'],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            print(f"  [OK] Messages 앱 접근 가능: {result.stdout.strip()}")
        else:
            print(f"  [FAIL] Messages 앱 접근 실패: {result.stderr.strip()}")
    except FileNotFoundError:
        print("  [SKIP] osascript를 찾을 수 없음 (macOS가 아닌 환경)")
    except Exception as e:
        print(f"  [FAIL] {e}")


if __name__ == "__main__":
    print("deadletter — iMessage 연동 테스트\n")
    test_db_access()
    test_recent_messages()
    test_send_capability()
    print("\n테스트 완료")
