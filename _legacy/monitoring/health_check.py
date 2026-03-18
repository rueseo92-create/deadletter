"""deadletter monitoring — 시스템 상태 체크

주요 컴포넌트의 상태를 확인하고 리포트한다.
"""

import os
import sqlite3
import logging
from datetime import datetime
from pathlib import Path

import config

logger = logging.getLogger(__name__)


def check_imessage_db() -> dict:
    """iMessage DB 접근 가능 여부를 확인한다."""
    db_path = config.IMESSAGE_DB_PATH
    try:
        if not os.path.exists(db_path):
            return {"status": "error", "message": f"DB 파일 없음: {db_path}"}

        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        row = conn.execute("SELECT COUNT(*) FROM message").fetchone()
        conn.close()

        return {
            "status": "ok",
            "message": f"접근 가능 (메시지 {row[0]}건)",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def check_deadletter_db() -> dict:
    """deadletter DB 상태를 확인한다."""
    try:
        if not config.DB_PATH.exists():
            return {"status": "warning", "message": "DB 미생성 (초기화 필요)"}

        conn = sqlite3.connect(str(config.DB_PATH))
        users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        letters = conn.execute("SELECT COUNT(*) FROM letters").fetchone()[0]
        published = conn.execute(
            "SELECT COUNT(*) FROM letters WHERE is_published = 1"
        ).fetchone()[0]
        conn.close()

        return {
            "status": "ok",
            "message": f"사용자 {users}명, 편지 {letters}건 (게시 {published}건)",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def check_api_key() -> dict:
    """Anthropic API 키 설정 여부를 확인한다."""
    key = config.ANTHROPIC_API_KEY
    if not key:
        return {"status": "error", "message": "ANTHROPIC_API_KEY 미설정"}
    if not key.startswith("sk-ant-"):
        return {"status": "warning", "message": "API 키 형식 의심"}
    return {"status": "ok", "message": f"설정됨 (***{key[-4:]})"}


def check_github_config() -> dict:
    """GitHub 설정을 확인한다."""
    token = config.GITHUB_TOKEN
    repo = config.GITHUB_REPO

    if not token:
        return {"status": "warning", "message": "GITHUB_TOKEN 미설정"}
    if not repo:
        return {"status": "warning", "message": "GITHUB_REPO 미설정"}

    return {"status": "ok", "message": f"repo: {repo}"}


def run_health_check() -> dict:
    """전체 시스템 상태를 확인한다.

    Returns:
        {
            "timestamp": str,
            "overall": "ok" | "warning" | "error",
            "checks": {
                "imessage_db": {...},
                "deadletter_db": {...},
                "api_key": {...},
                "github": {...},
            }
        }
    """
    checks = {
        "imessage_db": check_imessage_db(),
        "deadletter_db": check_deadletter_db(),
        "api_key": check_api_key(),
        "github": check_github_config(),
    }

    # 전체 상태 결정
    statuses = [c["status"] for c in checks.values()]
    if "error" in statuses:
        overall = "error"
    elif "warning" in statuses:
        overall = "warning"
    else:
        overall = "ok"

    report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "overall": overall,
        "checks": checks,
    }

    logger.info("상태 체크 완료: %s", overall)
    for name, check in checks.items():
        log_fn = logger.error if check["status"] == "error" else logger.info
        log_fn("  [%s] %s: %s", check["status"].upper(), name, check["message"])

    return report
