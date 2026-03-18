#!/bin/bash
# deadletter — Mac Mini 초기 세팅 스크립트
# macOS에서 실행: bash scripts/setup_mac.sh

set -e

echo "=================================="
echo "  deadletter — Mac Mini Setup"
echo "=================================="

# 1. Homebrew 확인
if ! command -v brew &> /dev/null; then
    echo "[!] Homebrew가 설치되어 있지 않습니다."
    echo "    /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi
echo "[OK] Homebrew 확인"

# 2. Python 3.11+ 확인
PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
REQUIRED="3.11"
if [ "$(printf '%s\n' "$REQUIRED" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED" ]; then
    echo "[!] Python 3.11+ 필요 (현재: $PYTHON_VERSION)"
    echo "    brew install python@3.11"
    exit 1
fi
echo "[OK] Python $PYTHON_VERSION"

# 3. Git 확인
if ! command -v git &> /dev/null; then
    echo "[!] Git이 설치되어 있지 않습니다."
    echo "    brew install git"
    exit 1
fi
echo "[OK] Git 확인"

# 4. Full Disk Access 안내
echo ""
echo "[주의] Full Disk Access 권한이 필요합니다!"
echo "  System Settings > Privacy & Security > Full Disk Access"
echo "  Terminal.app (또는 사용 중인 터미널) 추가 필요"
echo ""

# 5. iMessage chat.db 접근 테스트
CHAT_DB="$HOME/Library/Messages/chat.db"
if [ -f "$CHAT_DB" ]; then
    if sqlite3 "file:$CHAT_DB?mode=ro" "SELECT COUNT(*) FROM message;" &> /dev/null; then
        echo "[OK] iMessage DB 접근 가능"
    else
        echo "[!] iMessage DB 접근 불가 — Full Disk Access 권한 확인 필요"
    fi
else
    echo "[!] iMessage DB 파일 없음: $CHAT_DB"
fi

# 6. Python 의존성 설치
echo ""
echo "Python 의존성 설치 중..."
pip3 install -r requirements.txt
echo "[OK] 의존성 설치 완료"

# 7. .env 파일 생성
if [ ! -f .env ]; then
    cp .env.example .env
    echo "[OK] .env 파일 생성 (API 키를 입력하세요)"
else
    echo "[OK] .env 파일 이미 존재"
fi

# 8. DB 초기화
python3 -c "from db.models import init_db; init_db()"
echo "[OK] DB 초기화 완료"

# 9. 로그 디렉토리
mkdir -p logs
echo "[OK] logs/ 디렉토리 생성"

echo ""
echo "=================================="
echo "  Setup 완료!"
echo "=================================="
echo ""
echo "다음 단계:"
echo "  1. .env 파일에 ANTHROPIC_API_KEY를 입력하세요"
echo "  2. python3 main.py 로 서비스를 시작하세요"
echo ""
