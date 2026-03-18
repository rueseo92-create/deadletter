"""deadletter tests — 익명화 모듈 테스트

다양한 한국어/영어 개인정보 패턴이 올바르게 치환되는지 테스트한다.
"""

import pytest
import sys
from pathlib import Path

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.anonymizer import stage1_regex_filter, REPLACEMENT


class TestStage1RegexFilter:
    """Stage 1 Regex 기반 필터링 테스트"""

    def test_korean_phone_with_dashes(self):
        text = "제 번호는 010-1234-5678이에요"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert "010-1234-5678" not in result
        assert count == 1

    def test_korean_phone_without_dashes(self):
        text = "전화해줘 01098765432"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert "01098765432" not in result

    def test_international_phone(self):
        text = "Call me at +1-555-123-4567"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert "+1-555-123-4567" not in result

    def test_email(self):
        text = "내 이메일은 john.doe@gmail.com입니다"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert "john.doe@gmail.com" not in result
        assert count == 1

    def test_korean_ssn(self):
        text = "주민번호 900101-1234567은 비밀이에요"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert "900101-1234567" not in result

    def test_korean_ssn_no_dash(self):
        text = "9001011234567 이거 내 주민번호"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result

    def test_korean_address(self):
        text = "서울시 강남구 테헤란로에 살아요"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert count >= 1

    def test_credit_card(self):
        text = "카드번호 1234-5678-9012-3456 입력하세요"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result
        assert "1234-5678-9012-3456" not in result

    def test_credit_card_no_dashes(self):
        text = "카드 1234567890123456"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result

    def test_multiple_patterns(self):
        text = "010-1234-5678로 연락주세요. 이메일은 test@example.com"
        result, count = stage1_regex_filter(text)
        assert count == 2
        assert "010-1234-5678" not in result
        assert "test@example.com" not in result

    def test_no_pii(self):
        text = "오늘 날씨가 좋아서 기분이 좋아요"
        result, count = stage1_regex_filter(text)
        assert count == 0
        assert result == text

    def test_various_korean_phone_prefixes(self):
        prefixes = ["010", "011", "016", "017", "018", "019"]
        for prefix in prefixes:
            text = f"번호: {prefix}-1234-5678"
            result, count = stage1_regex_filter(text)
            assert REPLACEMENT in result, f"Failed for prefix {prefix}"

    def test_preserves_surrounding_text(self):
        text = "안녕하세요, 제 번호는 010-1234-5678이고 잘 부탁해요"
        result, count = stage1_regex_filter(text)
        assert "안녕하세요" in result
        assert "잘 부탁해요" in result
        assert "010-1234-5678" not in result

    def test_busan_address(self):
        text = "부산시 해운대구 우동에서 만나요"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result

    def test_gyeonggi_address(self):
        text = "경기도 성남시 분당구 판교로"
        result, count = stage1_regex_filter(text)
        assert REPLACEMENT in result


class TestAnonymizeIntegration:
    """전체 익명화 파이프라인 통합 테스트 (AI 제외)"""

    def test_anonymize_skip_ai(self):
        from core.anonymizer import anonymize

        text = "010-9999-8888로 전화주세요. 이메일은 secret@mail.com"
        result = anonymize(text, skip_ai=True)

        assert result["stage1_replacements"] == 2
        assert result["stage2_success"] is True
        assert result["is_safe"] is True
        assert "010-9999-8888" not in result["anonymized_text"]
        assert "secret@mail.com" not in result["anonymized_text"]

    def test_anonymize_clean_text(self):
        from core.anonymizer import anonymize

        text = "오늘 하루가 너무 힘들었어요"
        result = anonymize(text, skip_ai=True)

        assert result["stage1_replacements"] == 0
        assert result["anonymized_text"] == text
        assert result["is_safe"] is True
