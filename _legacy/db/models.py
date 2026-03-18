"""deadletter DB — SQLite schema definition and CRUD operations"""

import sqlite3
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_hash TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT 0,
    message_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    letter_id TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    anonymized_text TEXT,
    ai_reply TEXT,
    language TEXT DEFAULT 'en',
    likes INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT 0,
    is_crisis BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    context TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_letters_published ON letters(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);
"""


def get_connection() -> sqlite3.Connection:
    """DB 연결을 반환한다."""
    config.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(config.DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    """DB 스키마를 초기화한다."""
    conn = get_connection()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()


def hash_phone(phone: str) -> str:
    """전화번호를 SHA-256으로 해싱한다. 원문은 절대 저장하지 않는다."""
    return hashlib.sha256(phone.strip().encode("utf-8")).hexdigest()


# ── User CRUD ──


def get_or_create_user(phone: str) -> dict:
    """전화번호 해시로 사용자를 조회하거나 새로 생성한다."""
    phone_h = hash_phone(phone)
    conn = get_connection()
    cursor = conn.cursor()

    row = cursor.execute(
        "SELECT * FROM users WHERE phone_hash = ?", (phone_h,)
    ).fetchone()

    if row:
        user = dict(row)
        conn.close()
        return user

    cursor.execute(
        "INSERT INTO users (phone_hash) VALUES (?)", (phone_h,)
    )
    conn.commit()
    user_id = cursor.lastrowid
    row = cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row)


def is_user_blocked(phone: str) -> bool:
    """사용자가 차단 상태인지 확인한다."""
    phone_h = hash_phone(phone)
    conn = get_connection()
    row = conn.execute(
        "SELECT is_blocked FROM users WHERE phone_hash = ?", (phone_h,)
    ).fetchone()
    conn.close()
    if row is None:
        return False
    return bool(row["is_blocked"])


def increment_message_count(user_id: int) -> None:
    """사용자의 메시지 카운트를 증가시킨다."""
    conn = get_connection()
    conn.execute(
        "UPDATE users SET message_count = message_count + 1 WHERE id = ?",
        (user_id,),
    )
    conn.commit()
    conn.close()


# ── Letter CRUD ──


def generate_letter_id(conn: sqlite3.Connection) -> str:
    """새 편지 ID를 생성한다. (DL-XXXX 형식)"""
    row = conn.execute("SELECT COUNT(*) as cnt FROM letters").fetchone()
    next_num = row["cnt"] + 1
    return f"DL-{next_num:04d}"


def create_letter(
    user_id: int,
    anonymized_text: str,
    ai_reply: str,
    language: str = "en",
    is_crisis: bool = False,
) -> dict:
    """새 편지를 생성한다."""
    conn = get_connection()
    letter_id = generate_letter_id(conn)

    conn.execute(
        """INSERT INTO letters (letter_id, user_id, anonymized_text, ai_reply, language, is_crisis)
        VALUES (?, ?, ?, ?, ?, ?)""",
        (letter_id, user_id, anonymized_text, ai_reply, language, int(is_crisis)),
    )
    conn.commit()
    row = conn.execute(
        "SELECT * FROM letters WHERE letter_id = ?", (letter_id,)
    ).fetchone()
    conn.close()
    return dict(row)


def get_publishable_letters() -> list[dict]:
    """게시 가능한 편지 목록을 반환한다. (위기 편지 제외, 미게시 상태)"""
    conn = get_connection()
    rows = conn.execute(
        """SELECT * FROM letters
        WHERE is_crisis = 0 AND is_published = 0
        ORDER BY created_at ASC"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_published_letters(limit: int = 100, offset: int = 0) -> list[dict]:
    """게시된 편지 목록을 반환한다."""
    conn = get_connection()
    rows = conn.execute(
        """SELECT * FROM letters
        WHERE is_published = 1
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?""",
        (limit, offset),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def mark_as_published(letter_id: str) -> None:
    """편지를 게시 완료 상태로 변경한다."""
    conn = get_connection()
    conn.execute(
        "UPDATE letters SET is_published = 1 WHERE letter_id = ?", (letter_id,)
    )
    conn.commit()
    conn.close()


def increment_likes(letter_id: str) -> int:
    """편지의 좋아요 수를 증가시키고 새 값을 반환한다."""
    conn = get_connection()
    conn.execute(
        "UPDATE letters SET likes = likes + 1 WHERE letter_id = ?", (letter_id,)
    )
    conn.commit()
    row = conn.execute(
        "SELECT likes FROM letters WHERE letter_id = ?", (letter_id,)
    ).fetchone()
    conn.close()
    return row["likes"] if row else 0


# ── Session CRUD ──


def get_active_session(user_id: int) -> Optional[dict]:
    """사용자의 활성 세션을 반환한다."""
    conn = get_connection()
    row = conn.execute(
        """SELECT * FROM sessions
        WHERE user_id = ? AND is_active = 1
        ORDER BY last_activity DESC LIMIT 1""",
        (user_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_session(user_id: int) -> dict:
    """새 세션을 생성한다."""
    conn = get_connection()
    conn.execute(
        "INSERT INTO sessions (user_id, context) VALUES (?, ?)",
        (user_id, json.dumps([])),
    )
    conn.commit()
    session_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return dict(row)


def update_session_context(session_id: int, context: list[dict]) -> None:
    """세션의 대화 컨텍스트를 업데이트한다."""
    conn = get_connection()
    conn.execute(
        """UPDATE sessions SET context = ?, last_activity = ?
        WHERE id = ?""",
        (json.dumps(context, ensure_ascii=False), datetime.utcnow().isoformat(), session_id),
    )
    conn.commit()
    conn.close()


def deactivate_stale_sessions(timeout_minutes: int = 30) -> int:
    """타임아웃된 세션을 비활성화한다."""
    conn = get_connection()
    cursor = conn.execute(
        """UPDATE sessions SET is_active = 0
        WHERE is_active = 1
        AND julianday('now') - julianday(last_activity) > ? / 1440.0""",
        (timeout_minutes,),
    )
    conn.commit()
    count = cursor.rowcount
    conn.close()
    return count
