"""deadletter tests — 위기 감지 모듈 테스트"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.crisis_detector import detect_crisis


class TestCrisisDetector:
    """위기 키워드 감지 테스트"""

    def test_korean_suicide_keyword(self):
        result = detect_crisis("죽고 싶어요")
        assert result["is_crisis"] is True
        assert "죽고 싶" in result["matched_keywords"]
        assert result["language"] == "ko"
        assert "1393" in result["crisis_response"]

    def test_korean_self_harm(self):
        result = detect_crisis("자해를 하고 싶어요")
        assert result["is_crisis"] is True
        assert "자해" in result["matched_keywords"]

    def test_english_suicide(self):
        result = detect_crisis("I want to kill myself")
        assert result["is_crisis"] is True
        assert "kill myself" in result["matched_keywords"]
        assert result["language"] == "en"
        assert "741741" in result["crisis_response"]

    def test_english_self_harm(self):
        result = detect_crisis("I've been thinking about self-harm")
        assert result["is_crisis"] is True

    def test_no_crisis_korean(self):
        result = detect_crisis("오늘 하루가 너무 피곤했어요")
        assert result["is_crisis"] is False
        assert len(result["matched_keywords"]) == 0
        assert result["crisis_response"] is None

    def test_no_crisis_english(self):
        result = detect_crisis("I had a bad day at work")
        assert result["is_crisis"] is False

    def test_korean_disappear(self):
        result = detect_crisis("사라지고 싶어")
        assert result["is_crisis"] is True
        assert "사라지고 싶" in result["matched_keywords"]

    def test_korean_no_reason_to_live(self):
        result = detect_crisis("살고 싶지 않아요")
        assert result["is_crisis"] is True

    def test_english_end_it_all(self):
        result = detect_crisis("I just want to end it all")
        assert result["is_crisis"] is True
        assert "end it all" in result["matched_keywords"]

    def test_english_better_off_dead(self):
        result = detect_crisis("Everyone would be better off dead without me")
        assert result["is_crisis"] is True

    def test_case_insensitive(self):
        result = detect_crisis("I want to KILL MYSELF")
        assert result["is_crisis"] is True

    def test_multiple_keywords(self):
        result = detect_crisis("자살하고 싶고 자해도 하고 싶어")
        assert result["is_crisis"] is True
        assert len(result["matched_keywords"]) >= 2
