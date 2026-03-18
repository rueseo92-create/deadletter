"""deadletter tests — 퍼블리싱 모듈 테스트"""

import json
import pytest
import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from db import models


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    """테스트용 임시 DB를 설정한다."""
    config.DB_PATH = tmp_path / "test.db"
    models.init_db()
    yield
    if config.DB_PATH.exists():
        config.DB_PATH.unlink()


class TestLetterPublisher:
    """편지 퍼블리싱 테스트"""

    def test_build_empty_json(self):
        from publisher.letter_publisher import build_letters_json

        result = build_letters_json()
        assert result["letters"] == []
        assert result["meta"]["total"] == 0

    def test_build_with_letters(self):
        from publisher.letter_publisher import build_letters_json

        # 테스트 사용자 생성
        user = models.get_or_create_user("+10000000000")

        # 편지 생성
        models.create_letter(
            user_id=user["id"],
            anonymized_text="Test letter",
            ai_reply="Test reply",
            language="en",
        )

        result = build_letters_json()
        assert result["meta"]["total"] == 1
        assert result["letters"][0]["text"] == "Test letter"
        assert result["letters"][0]["reply"] == "Test reply"

    def test_crisis_letters_excluded(self):
        from publisher.letter_publisher import build_letters_json

        user = models.get_or_create_user("+10000000000")

        # 일반 편지
        models.create_letter(
            user_id=user["id"],
            anonymized_text="Normal letter",
            ai_reply="Normal reply",
            language="en",
            is_crisis=False,
        )

        # 위기 편지 (게시되면 안 됨)
        models.create_letter(
            user_id=user["id"],
            anonymized_text="Crisis letter",
            ai_reply="Crisis reply",
            language="en",
            is_crisis=True,
        )

        result = build_letters_json()
        assert result["meta"]["total"] == 1
        assert result["letters"][0]["text"] == "Normal letter"

    def test_write_letters_json(self, tmp_path):
        from publisher.letter_publisher import write_letters_json

        user = models.get_or_create_user("+10000000000")
        models.create_letter(
            user_id=user["id"],
            anonymized_text="Test",
            ai_reply="Reply",
            language="ko",
        )

        output = write_letters_json(output_dir=tmp_path)

        assert output.exists()
        with open(output) as f:
            data = json.load(f)
        assert data["meta"]["total"] == 1
        assert data["letters"][0]["lang"] == "ko"


class TestModels:
    """DB 모델 테스트"""

    def test_create_user(self):
        user = models.get_or_create_user("+11234567890")
        assert user["id"] is not None
        assert user["is_blocked"] == 0

    def test_user_dedup(self):
        user1 = models.get_or_create_user("+11234567890")
        user2 = models.get_or_create_user("+11234567890")
        assert user1["id"] == user2["id"]

    def test_phone_hash(self):
        h = models.hash_phone("+11234567890")
        assert len(h) == 64  # SHA-256
        assert "+" not in h

    def test_letter_id_format(self):
        user = models.get_or_create_user("+10000000000")
        letter = models.create_letter(
            user_id=user["id"],
            anonymized_text="test",
            ai_reply="reply",
        )
        assert letter["letter_id"].startswith("DL-")
        assert len(letter["letter_id"]) == 7  # DL-0001

    def test_increment_likes(self):
        user = models.get_or_create_user("+10000000000")
        letter = models.create_letter(
            user_id=user["id"],
            anonymized_text="test",
            ai_reply="reply",
        )
        new_likes = models.increment_likes(letter["letter_id"])
        assert new_likes == 1
