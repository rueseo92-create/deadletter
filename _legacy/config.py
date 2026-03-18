"""deadletter — Configuration Management"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "db" / "deadletter.db"
WEB_DATA_PATH = BASE_DIR / "web" / "data"
LOG_DIR = BASE_DIR / "logs"

# Claude API
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
AI_MODEL: str = "claude-sonnet-4-20250514"
AI_MAX_TOKENS: int = 1024

# GitHub
GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")
GITHUB_REPO: str = os.getenv("GITHUB_REPO", "")

# iMessage
IMESSAGE_DB_PATH: str = os.getenv(
    "IMESSAGE_DB_PATH",
    os.path.expanduser("~/Library/Messages/chat.db"),
)

# Monitoring
DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

# Limits
MAX_DAILY_MESSAGES: int = int(os.getenv("MAX_DAILY_MESSAGES", "100"))
POLLING_INTERVAL: int = int(os.getenv("POLLING_INTERVAL", "3"))

# Logging
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

# Session
SESSION_TIMEOUT_MINUTES: int = 30
MAX_CONTEXT_MESSAGES: int = 10

# Anonymizer
ANONYMIZE_FAIL_ACTION: str = "queue"  # "queue" or "discard"

# Publisher
LETTERS_JSON_FILENAME: str = "letters.json"
LETTERS_PER_PAGE: int = 20

# Crisis resources
CRISIS_RESOURCES = {
    "ko": "자살예방상담전화 1393, 정신건강위기상담전화 1577-0199",
    "en": "Crisis Text Line: text HOME to 741741",
}
