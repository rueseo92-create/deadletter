"""deadletter tests — AI 핸들러 테스트

Mock을 사용하여 AI 답변 생성 로직을 테스트한다.
"""

import pytest
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.ai_handler import detect_language, get_welcome_message, generate_reply


class TestDetectLanguage:
    """언어 감지 테스트"""

    def test_korean_text(self):
        assert detect_language("오늘 너무 힘들었어요") == "ko"

    def test_english_text(self):
        assert detect_language("I feel so tired today") == "en"

    def test_mixed_mostly_korean(self):
        assert detect_language("오늘 meeting에서 너무 스트레스 받았어") == "ko"

    def test_mixed_mostly_english(self):
        assert detect_language("Had a rough day at work") == "en"

    def test_empty_text(self):
        assert detect_language("") == "en"


class TestGetWelcomeMessage:
    """웰컴 메시지 테스트"""

    def test_korean_welcome(self):
        msg = get_welcome_message("ko")
        assert "deadletter" in msg
        assert "반갑습니다" in msg or "마음" in msg

    def test_english_welcome(self):
        msg = get_welcome_message("en")
        assert "deadletter" in msg
        assert "Welcome" in msg or "listen" in msg


class TestGenerateReply:
    """AI 답변 생성 테스트 (Mock)"""

    @patch("core.ai_handler._get_client")
    def test_generate_reply_success(self, mock_get_client):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="That sounds really tough. What happened?")]
        mock_response.usage.input_tokens = 100
        mock_response.usage.output_tokens = 50
        mock_client.messages.create.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = generate_reply("I'm feeling lost")

        assert "reply" in result
        assert result["language"] == "en"
        assert result["tokens_used"] == 150
        assert isinstance(result["is_crisis"], bool)

    @patch("core.ai_handler._get_client")
    def test_generate_reply_with_history(self, mock_get_client):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="I understand.")]
        mock_response.usage.input_tokens = 200
        mock_response.usage.output_tokens = 30
        mock_client.messages.create.return_value = mock_response
        mock_get_client.return_value = mock_client

        history = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ]
        result = generate_reply("I need help", history)

        # messages에 history가 포함되었는지 확인
        call_args = mock_client.messages.create.call_args
        messages = call_args.kwargs["messages"]
        assert len(messages) == 3  # 2 history + 1 new

    @patch("core.ai_handler._get_client")
    def test_generate_reply_api_failure(self, mock_get_client):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_get_client.return_value = mock_client

        result = generate_reply("Help me")

        assert result["reply"]  # 폴백 메시지가 있어야 함
        assert result["tokens_used"] == 0
        assert result["is_crisis"] is False

    @patch("core.ai_handler._get_client")
    def test_crisis_detection_in_reply(self, mock_get_client):
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="Please call 1393 for help.")]
        mock_response.usage.input_tokens = 100
        mock_response.usage.output_tokens = 50
        mock_client.messages.create.return_value = mock_response
        mock_get_client.return_value = mock_client

        result = generate_reply("죽고 싶어요")

        assert result["is_crisis"] is True
