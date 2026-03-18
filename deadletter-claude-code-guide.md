# DEADLETTER — Claude Code Development Guide
## "send what you can't say"

> iMessage × AI Counseling × Anonymous Web Publishing
> 이 문서는 Claude Code에서 바로 개발을 시작할 수 있도록 작성된 실행 가이드입니다.

---

## 📁 프로젝트 구조

```
deadletter/
├── CLAUDE.md                    # Claude Code 프로젝트 인스트럭션
├── README.md                    # 프로젝트 소개
├── requirements.txt             # Python 의존성
├── .env.example                 # 환경변수 템플릿
├── config.py                    # 설정 관리
│
├── core/                        # 핵심 백엔드
│   ├── __init__.py
│   ├── message_watcher.py       # iMessage 수신 모니터링
│   ├── message_sender.py        # iMessage 발신 (AppleScript)
│   ├── ai_handler.py            # AI 상담 답변 생성
│   ├── anonymizer.py            # 개인정보 필터링 (2단계)
│   ├── session_manager.py       # 대화 세션 관리
│   └── crisis_detector.py       # 위기 감지 모듈
│
├── publisher/                   # 웹 퍼블리싱
│   ├── __init__.py
│   ├── letter_publisher.py      # 편지 JSON 생성
│   ├── github_pusher.py         # GitHub auto-push
│   └── og_generator.py          # OG 이미지 자동 생성
│
├── moderation/                  # 콘텐츠 모더레이션
│   ├── __init__.py
│   ├── inbound_filter.py        # 수신 콘텐츠 필터
│   └── outbound_filter.py       # 게시 전 최종 필터
│
├── db/                          # 데이터베이스
│   ├── __init__.py
│   ├── models.py                # SQLite 스키마 정의
│   ├── migrations.py            # DB 마이그레이션
│   └── deadletter.db            # (자동 생성됨)
│
├── monitoring/                  # 모니터링
│   ├── health_check.py          # 시스템 상태 체크
│   └── alerter.py               # Discord/Slack 알림
│
├── web/                         # 정적 웹사이트 (GitHub Pages)
│   ├── index.html               # 랜딩 페이지
│   ├── letters.html             # 편지 피드
│   ├── letter.html              # 개별 편지 상세
│   ├── about.html               # 서비스 소개
│   ├── css/
│   │   └── style.css            # 메인 스타일시트
│   ├── js/
│   │   ├── feed.js              # 편지 피드 로직
│   │   ├── letter.js            # 개별 편지 로직
│   │   └── likes.js             # 공감 기능
│   ├── data/
│   │   └── letters.json         # 편지 데이터 (자동 생성)
│   └── CNAME                    # 커스텀 도메인 설정
│
├── scripts/                     # 유틸리티 스크립트
│   ├── setup_mac.sh             # Mac Mini 초기 세팅
│   ├── install_deps.sh          # 의존성 설치
│   ├── run_all.sh               # 전체 서비스 시작
│   └── test_imessage.py         # iMessage 연동 테스트
│
├── tests/                       # 테스트
│   ├── test_anonymizer.py       # 익명화 테스트
│   ├── test_ai_handler.py       # AI 답변 테스트
│   ├── test_crisis_detector.py  # 위기 감지 테스트
│   └── test_publisher.py        # 퍼블리싱 테스트
│
└── docs/                        # 문서
    ├── ARCHITECTURE.md           # 아키텍처 상세
    ├── PRIVACY_POLICY.md         # 개인정보처리방침
    └── CONTENT_POLICY.md         # 콘텐츠 정책
```

---

## 🧠 CLAUDE.md (Claude Code 프로젝트 인스트럭션)

아래 내용을 `CLAUDE.md`에 그대로 붙여넣으세요. Claude Code가 프로젝트 컨텍스트를 이해하고 일관된 개발을 수행합니다.

```markdown
# CLAUDE.md — deadletter Project Instructions

## Project Overview
deadletter는 iMessage 기반 익명 AI 상담 + 웹 게시 서비스입니다.
사용자가 iMessage로 고민을 보내면 AI가 상담 답변을 해주고,
익명화된 고민+답변이 웹사이트에 게시됩니다.

## Tech Stack
- Runtime: Python 3.11+ on macOS (Mac Mini)
- iMessage: SQLite chat.db polling + AppleScript sending
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- DB: SQLite (local)
- Web: Static HTML/CSS/JS on GitHub Pages
- Deploy: Git auto-push via cron

## Architecture
1. message_watcher.py → chat.db를 3초 간격 polling
2. 새 메시지 감지 → ai_handler.py로 전달
3. AI가 답변 생성 → message_sender.py로 iMessage 발신
4. anonymizer.py가 2단계 개인정보 필터링
5. letter_publisher.py가 JSON 생성 → GitHub push

## Key Design Decisions
- 전화번호는 절대 원문 저장하지 않음 (SHA-256 해시만 저장)
- 개인정보 필터링은 Regex + AI 2단계로 수행
- 위기 감지 시 전문 상담 연결 정보 자동 제공
- 원본 메시지는 익명화 처리 후 즉시 삭제
- 웹사이트는 100% 정적 파일 (서버 비용 0원)

## Coding Conventions
- Language: Python (backend), Vanilla JS (frontend)
- 한국어 주석 사용 가능
- Type hints 필수
- docstring은 Google style
- 에러 처리: 모든 외부 API 호출에 try/except + retry
- 로깅: Python logging 모듈, INFO 이상

## File Naming
- Python: snake_case.py
- JS: camelCase.js
- HTML/CSS: kebab-case

## Environment Variables (.env)
- ANTHROPIC_API_KEY: Claude API 키
- GITHUB_TOKEN: GitHub Personal Access Token
- GITHUB_REPO: username/deadletter-web
- IMESSAGE_DB_PATH: ~/Library/Messages/chat.db
- DISCORD_WEBHOOK_URL: 모니터링 알림용
- MAX_DAILY_MESSAGES: 일일 발송 제한 (기본 100)
- POLLING_INTERVAL: chat.db 폴링 간격 초 (기본 3)

## Important Warnings
- chat.db는 반드시 읽기 전용(mode=ro)으로 열어야 함
- AppleScript 발신 간격 최소 2초 (스팸 방지)
- 개인정보 필터링 실패 시 게시하지 않고 큐에 보관
- crisis 감지된 편지는 절대 웹에 게시하지 않음

## Testing
- pytest 사용
- 익명화 테스트는 실제 개인정보 패턴으로 충분히 테스트
- AI 답변 테스트는 mock 사용 (API 비용 절약)
```

---

## 📄 주요 파일별 구현 명세

### 1. core/message_watcher.py

**역할**: macOS Messages DB를 polling하여 새 메시지 감지

**핵심 로직**:
- `~/Library/Messages/chat.db`를 SQLite read-only로 연결
- 마지막 처리한 message ROWID를 추적
- 3초 간격으로 새 메시지 쿼리
- macOS Ventura+ 에서는 `attributedBody` 컬럼 디코딩 필요

**SQL 쿼리**:
```sql
SELECT
  m.ROWID, m.text, m.attributedBody, m.date,
  m.is_from_me, h.id as sender_id
FROM message m
LEFT JOIN handle h ON m.handle_id = h.ROWID
WHERE m.ROWID > :last_rowid
  AND m.is_from_me = 0
ORDER BY m.date ASC
```

**디코딩 함수** (Ventura+):
```python
def decode_attributed_body(blob: bytes) -> str:
    """macOS Ventura 이상에서 attributedBody 컬럼 디코딩"""
    text = blob.split(b"NSString")[1]
    text = text[5:]  # Skip encoding bytes
    length = int.from_bytes(text[:1], "little")
    return text[1:1+length].decode("utf-8", errors="replace")
```

**주의사항**:
- WAL 모드로 열기: `sqlite3.connect('file:...?mode=ro', uri=True)`
- Full Disk Access 권한 필수
- 폴링 실패 시 5초 대기 후 재시도

---

### 2. core/message_sender.py

**역할**: AppleScript를 통해 iMessage 발신

**핵심 로직**:
```python
import subprocess

def send_imessage(phone: str, message: str) -> bool:
    """iMessage로 메시지 발신"""
    script = f'''
    tell application "Messages"
        set targetService to 1st account whose service type = iMessage
        set targetBuddy to participant "{phone}" of targetService
        send "{message}" to targetBuddy
    end tell
    '''
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True, text=True, timeout=30
    )
    return result.returncode == 0
```

**주의사항**:
- 메시지 내 따옴표 이스케이프 처리 필수
- 발신 간격 최소 2초
- 실패 시 최대 3회 재시도 (exponential backoff)
- 일일 발송량 모니터링

---

### 3. core/ai_handler.py

**역할**: Claude API를 호출하여 상담 답변 생성

**시스템 프롬프트**:
```
You are deadletter, an anonymous AI counselor that people reach via iMessage.

Core principles:
- EMPATHY FIRST: Always acknowledge emotions before offering perspective
- BREVITY: Keep replies to 3-5 sentences (iMessage is a chat medium)
- NON-JUDGMENTAL: Never judge any confession or worry
- ONE QUESTION: End with one gentle question to continue the conversation
- LANGUAGE MATCH: Reply in the same language the user writes in
- WARMTH: Be warm but not cheesy. Think "wise friend at 3am", not "therapist"

Crisis protocol:
- If you detect self-harm or suicide ideation, include crisis resources:
  - Korean: 자살예방상담전화 1393, 정신건강위기상담전화 1577-0199
  - English: Crisis Text Line (text HOME to 741741)
- Be direct but gentle when mentioning these resources

You are NOT a replacement for professional therapy.
For serious conditions, gently suggest professional help.

Tone examples:
- User: "I feel like nobody cares about me"
- Good: "That loneliness hits hard, especially when it feels like no one notices. But you reaching out here — that takes something. What's been making you feel invisible lately?"
- Bad: "I'm sorry to hear that. Many people feel that way. Have you tried talking to a therapist?"
```

**컨텍스트 관리**:
- 세션별 최근 10개 메시지를 컨텍스트로 전달
- 첫 메시지에는 웰컴 멘트 자동 추가
- 토큰 사용량 로깅

---

### 4. core/anonymizer.py

**역할**: 2단계 개인정보 필터링

**Stage 1 — Regex Patterns**:
```python
PATTERNS = {
    "phone_kr": r"01[016789]-?\d{3,4}-?\d{4}",
    "phone_intl": r"\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}",
    "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "ssn_kr": r"\d{6}[-\s]?\d{7}",
    "address_kr": r"(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[시도]?\s*\S+[시군구]\s*\S+[읍면동로길]",
    "card_number": r"\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}",
}
```

**Stage 2 — AI Filter Prompt**:
```
Analyze the following text and identify ANY personal information that could identify a specific person. Replace each identified item with [REDACTED].

Look for:
- Personal names (Korean or English)
- Company names that could identify the person
- School names
- Specific location names (building names, apartment names)
- Social media handles or usernames
- Any other contextually identifying information

IMPORTANT: Only redact information that could identify a specific individual.
Generic references like "my company" or "my school" should be kept.

Return ONLY the anonymized text, nothing else.
```

---

### 5. publisher/letter_publisher.py

**역할**: 익명화된 편지를 JSON으로 변환하여 GitHub Pages용 데이터 생성

**JSON 스키마**:
```json
{
  "letters": [
    {
      "id": "DL-0042",
      "text": "익명화된 고민 텍스트",
      "reply": "AI 상담 답변",
      "lang": "ko",
      "likes": 0,
      "created": "2026-03-18T03:24:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "updated": "2026-03-18T12:00:00Z"
  }
}
```

**GitHub Push 로직**:
```python
import subprocess

def push_to_github(json_path: str, repo_path: str):
    """생성된 JSON을 GitHub에 push"""
    commands = [
        f"cd {repo_path}",
        f"cp {json_path} web/data/letters.json",
        "git add -A",
        'git commit -m "update letters [automated]"',
        "git push origin main"
    ]
    subprocess.run(" && ".join(commands), shell=True, check=True)
```

---

### 6. db/models.py

**역할**: SQLite 스키마 정의 및 CRUD 함수

```python
import sqlite3
from datetime import datetime

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
"""
```

---

### 7. web/js/feed.js

**역할**: 편지 피드 렌더링 + 무한 스크롤 + 공감 기능

**핵심 로직**:
```javascript
// letters.json을 fetch하여 피드 렌더링
async function loadLetters() {
  const res = await fetch('/data/letters.json');
  const data = await res.json();
  renderLetters(data.letters);
}

function renderLetters(letters) {
  const feed = document.getElementById('feed');
  letters.forEach((letter, i) => {
    // 5개마다 광고 슬롯 삽입
    if (i > 0 && i % 5 === 0) {
      feed.appendChild(createAdSlot());
    }
    feed.appendChild(createLetterCard(letter));
  });
}

function createLetterCard(letter) {
  const article = document.createElement('article');
  article.className = 'letter';
  article.innerHTML = `
    <div class="letter-meta">
      <span class="letter-id">${letter.id}</span>
      <span class="letter-time">${timeAgo(letter.created)}</span>
    </div>
    <div class="letter-body">"${letter.text}"</div>
    <div class="letter-reply">
      <div class="letter-reply-label">deadletter replied</div>
      <p>${letter.reply}</p>
    </div>
    <div class="letter-stats">
      <span class="letter-stat" onclick="toggleLike('${letter.id}')">♡ ${letter.likes}</span>
      <span class="letter-stat" onclick="shareLetter('${letter.id}')">↗ share</span>
    </div>
  `;
  return article;
}
```

---

## 🚀 Claude Code 실행 명령어 가이드

Claude Code에서 아래 순서대로 명령하면 됩니다:

### Step 1: 프로젝트 초기화
```
프로젝트 구조를 위 명세대로 생성해줘.
CLAUDE.md, requirements.txt, .env.example, config.py를 먼저 만들어줘.
```

### Step 2: 핵심 백엔드 구현
```
core/ 디렉토리의 모든 모듈을 구현해줘.
message_watcher.py부터 시작해서 전체 메시지 처리 파이프라인을 완성해줘.
위 명세의 코드와 주의사항을 모두 반영해줘.
```

### Step 3: 개인정보 필터링
```
anonymizer.py를 구현해줘.
Stage 1 (Regex)과 Stage 2 (AI) 2단계 파이프라인으로.
한국어 개인정보 패턴을 꼼꼼하게 처리해줘.
테스트 케이스도 같이 만들어줘.
```

### Step 4: 웹사이트 구현
```
web/ 디렉토리의 정적 웹사이트를 구현해줘.
이전에 만든 deadletter.html 프로토타입의 디자인을 기반으로,
letters.json을 읽어서 피드를 렌더링하는 기능을 추가해줘.
개별 편지 페이지(/letter/DL-XXXX)도 만들어줘.
```

### Step 5: 퍼블리싱 파이프라인
```
publisher/ 디렉토리를 구현해줘.
SQLite에서 게시 가능한 편지를 가져와서 JSON으로 만들고
GitHub에 자동 push하는 파이프라인을 완성해줘.
```

### Step 6: 테스트
```
tests/ 디렉토리의 모든 테스트를 작성하고 실행해줘.
특히 anonymizer 테스트는 다양한 한국어 개인정보 패턴으로 충분히 테스트해줘.
```

### Step 7: 배포 스크립트
```
scripts/ 디렉토리의 Mac Mini 세팅 스크립트와
서비스 시작/중지 스크립트를 만들어줘.
launchd plist 파일도 생성해줘.
```

---

## 🛠 고도화를 위한 Skills & 도구 추천

### Phase 1: MVP 고도화

#### 1. n8n 워크플로우 자동화
- **용도**: 메시지 처리 파이프라인을 비주얼 워크플로우로 관리
- **장점**: Python 스크립트 대신 GUI로 흐름 제어, 에러 핸들링 용이
- **적용**: iMessage 수신 → AI 처리 → 익명화 → 게시 전체 흐름
- **참고**: Blooio API + n8n 조합으로 iMessage 봇 구축 가능 (Mac Mini 없이도)

#### 2. Blooio (iMessage REST API)
- **용도**: Mac Mini 없이 iMessage 자동화
- **장점**: REST API로 iMessage 송수신, 타이핑 인디케이터 지원
- **비용**: 유료 (월 구독)
- **적용**: Mac Mini가 불안정하거나 스케일업 시 대안

#### 3. Cloudflare Pages (GitHub Pages 대안)
- **용도**: 더 빠른 CDN + Analytics + 엣지 함수
- **장점**: 무료 플랜으로 충분, Workers로 서버리스 함수 추가 가능
- **적용**: 좋아요 API, 실시간 편지 수 카운터 등 동적 기능

### Phase 2: 성장 단계

#### 4. Supabase (DB 업그레이드)
- **용도**: SQLite → PostgreSQL + 실시간 기능 + Auth
- **장점**: 무료 플랜 충분, 실시간 구독으로 새 편지 알림, REST API 자동 생성
- **적용**: 좋아요 실시간 반영, 편지 피드 실시간 업데이트, 향후 사용자 계정 시스템

#### 5. Vercel (웹 프론트엔드 업그레이드)
- **용도**: Next.js 기반 SSR/SSG 전환
- **장점**: ISR로 편지 페이지 자동 갱신, OG 이미지 동적 생성 (Edge Function)
- **적용**: SEO 최적화, 소셜 공유 미리보기 고도화

#### 6. Resend / Postmark (이메일 알림)
- **용도**: 사용자에게 "당신의 편지가 게시되었습니다" 알림 (옵트인)
- **장점**: 간단한 API, 무료 티어 충분
- **적용**: 편지 게시 알림, 주간 인기 편지 다이제스트

#### 7. Sentry (에러 모니터링)
- **용도**: Python 백엔드 + 웹 프론트엔드 에러 추적
- **장점**: 무료 플랜 10K 이벤트/월
- **적용**: AI API 에러, 익명화 실패, 웹사이트 JS 에러 추적

### Phase 3: 수익화 & 확장

#### 8. Stripe / Toss Payments (결제)
- **용도**: 프리미엄 기능 결제
- **장점**: 간편 연동, 한국 결제 지원 (Toss)
- **적용**: 프리미엄 AI 상담 (더 긴 대화), 편지 부스트 (먼저 노출), 광고 제거

#### 9. Mixpanel / PostHog (애널리틱스)
- **용도**: 사용자 행동 분석
- **장점**: PostHog 오픈소스/무료, 퍼널 분석
- **적용**: 편지 작성 전환율, 재방문율, 인기 편지 패턴 분석

#### 10. OpenAI Whisper (음성 메시지)
- **용도**: 음성 메시지 → 텍스트 변환
- **장점**: 한국어 인식 우수
- **적용**: iMessage 음성 메시지 수신 시 텍스트로 변환하여 처리

#### 11. Puppeteer / Playwright (OG 이미지)
- **용도**: 편지별 소셜 공유용 이미지 자동 생성
- **장점**: HTML 템플릿으로 디자인 통제 가능
- **적용**: 편지가 SNS에서 공유될 때 미려한 카드 이미지 생성

#### 12. 카카오톡 채널 확장
- **용도**: iMessage 외 한국 사용자 채널 추가
- **장점**: 한국 시장 커버리지 극대화
- **적용**: 동일한 AI 상담 엔진을 카카오톡 채널봇에 연결

### Phase 4: 콘텐츠 & 브랜딩

#### 13. Instagram 자동화 (기존 GrowKit 노하우 활용)
- **용도**: 인기 편지를 Instagram 카드뉴스로 자동 변환
- **장점**: 기존 Canvas 카드뉴스 생성기 + Google Sheets 워크플로우 재활용
- **적용**: 일일 Top 3 편지 → 카드뉴스 → Instagram 자동 게시

#### 14. 뉴스레터 (Substack / Beehiiv)
- **용도**: 주간 인기 편지 큐레이션
- **장점**: 구독자 기반 형성, 추가 광고 수익
- **적용**: "이번 주의 deadletter" 주간 뉴스레터

#### 15. TikTok / Reels 콘텐츠
- **용도**: 편지 낭독 + 시각화 숏폼 콘텐츠
- **장점**: 바이럴 가능성 높음
- **적용**: AI TTS로 편지 낭독 + 미니멀 비주얼 → 숏폼 자동 생성

---

## ⚡ 빠른 시작 우선순위

| 순서 | 작업 | 예상 시간 | 중요도 |
|------|------|-----------|--------|
| 1 | 프로젝트 구조 + CLAUDE.md | 30분 | ★★★★★ |
| 2 | message_watcher.py (iMessage 수신) | 2시간 | ★★★★★ |
| 3 | message_sender.py (iMessage 발신) | 1시간 | ★★★★★ |
| 4 | ai_handler.py (AI 상담) | 2시간 | ★★★★★ |
| 5 | anonymizer.py (개인정보 필터링) | 3시간 | ★★★★★ |
| 6 | 전체 파이프라인 연결 + 테스트 | 2시간 | ★★★★★ |
| 7 | 웹사이트 (GitHub Pages) | 3시간 | ★★★★☆ |
| 8 | publisher + GitHub push | 2시간 | ★★★★☆ |
| 9 | 모니터링 + 알림 | 1시간 | ★★★☆☆ |
| 10 | 콘텐츠 모더레이션 고도화 | 2시간 | ★★★☆☆ |

**총 예상 개발 시간: ~18시간 (Claude Code 활용 시)**

---

## 💡 Claude Code 팁

1. **한번에 하나씩**: 파일 하나씩 구현하고 테스트하는 게 품질이 좋습니다
2. **CLAUDE.md 업데이트**: 새로운 결정사항이 생기면 CLAUDE.md에 반영하세요
3. **테스트 먼저**: anonymizer 같은 핵심 모듈은 TDD로 접근하세요
4. **Mock 활용**: AI API, iMessage 발신 등은 mock으로 테스트하면 비용 절약
5. **Git 커밋 단위**: 기능 단위로 커밋하면 Claude Code가 컨텍스트를 더 잘 파악합니다
