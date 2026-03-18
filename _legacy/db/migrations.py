"""deadletter DB — 마이그레이션 관리

스키마 버전을 추적하고 마이그레이션을 적용한다.
"""

import sqlite3
import logging
from datetime import datetime

import config
from db.models import get_connection

logger = logging.getLogger(__name__)

MIGRATIONS = [
    {
        "version": 1,
        "description": "초기 스키마 생성",
        "sql": """
        -- models.py의 SCHEMA로 처리됨 (init_db)
        SELECT 1;
        """,
    },
    {
        "version": 2,
        "description": "편지 카테고리 추가",
        "sql": """
        ALTER TABLE letters ADD COLUMN category TEXT DEFAULT 'general';
        """,
    },
    {
        "version": 3,
        "description": "사용자 마지막 활동 추적",
        "sql": """
        ALTER TABLE users ADD COLUMN last_active_at DATETIME;
        """,
    },
]


def get_current_version(conn: sqlite3.Connection) -> int:
    """현재 DB 스키마 버전을 반환한다."""
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                description TEXT
            )
        """)
        row = conn.execute("SELECT MAX(version) FROM schema_version").fetchone()
        return row[0] or 0
    except Exception:
        return 0


def apply_migrations() -> int:
    """미적용 마이그레이션을 순서대로 적용한다.

    Returns:
        적용된 마이그레이션 수
    """
    conn = get_connection()
    current = get_current_version(conn)
    applied = 0

    for migration in MIGRATIONS:
        if migration["version"] <= current:
            continue

        try:
            conn.executescript(migration["sql"])
            conn.execute(
                "INSERT INTO schema_version (version, description) VALUES (?, ?)",
                (migration["version"], migration["description"]),
            )
            conn.commit()
            applied += 1
            logger.info(
                "마이그레이션 v%d 적용: %s",
                migration["version"],
                migration["description"],
            )
        except Exception as e:
            logger.error(
                "마이그레이션 v%d 실패: %s", migration["version"], e
            )
            conn.rollback()
            break

    conn.close()
    return applied


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    count = apply_migrations()
    print(f"마이그레이션 {count}개 적용 완료")
