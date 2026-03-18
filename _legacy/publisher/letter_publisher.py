"""deadletter publisher — 편지 JSON 생성

SQLite에서 게시 가능한 편지를 가져와 letters.json으로 변환한다.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

import config
from db import models

logger = logging.getLogger(__name__)


def build_letters_json() -> dict:
    """게시 가능한 편지를 JSON 구조로 변환한다.

    Returns:
        {"letters": [...], "meta": {...}} 형태의 dict
    """
    # 이미 게시된 편지
    published = models.get_published_letters(limit=1000)

    # 새로 게시할 편지
    new_letters = models.get_publishable_letters()

    all_letters = []

    # 기존 게시 편지 추가
    for letter in published:
        all_letters.append({
            "id": letter["letter_id"],
            "text": letter["anonymized_text"],
            "reply": letter["ai_reply"],
            "lang": letter["language"],
            "likes": letter["likes"],
            "created": letter["created_at"],
        })

    # 새 편지 게시 처리
    for letter in new_letters:
        all_letters.append({
            "id": letter["letter_id"],
            "text": letter["anonymized_text"],
            "reply": letter["ai_reply"],
            "lang": letter["language"],
            "likes": letter["likes"],
            "created": letter["created_at"],
        })
        models.mark_as_published(letter["letter_id"])
        logger.info("편지 게시: %s", letter["letter_id"])

    # 최신순 정렬
    all_letters.sort(key=lambda x: x["created"], reverse=True)

    return {
        "letters": all_letters,
        "meta": {
            "total": len(all_letters),
            "updated": datetime.utcnow().isoformat() + "Z",
        },
    }


def write_letters_json(output_dir: Path | None = None) -> Path:
    """letters.json 파일을 생성한다.

    Args:
        output_dir: 출력 디렉토리 (None이면 config 기본값 사용)

    Returns:
        생성된 JSON 파일 경로
    """
    if output_dir is None:
        output_dir = config.WEB_DATA_PATH

    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / config.LETTERS_JSON_FILENAME

    data = build_letters_json()

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    logger.info(
        "letters.json 생성 완료: %d개 편지 → %s",
        data["meta"]["total"],
        output_path,
    )

    return output_path
