# 쿠팡 파트너스 블로그 (Next.js)

SEO 최적화 + 쿠팡 파트너스 자동 연동 블로그 보일러플레이트

## 🚀 시작하기

```bash
npm install
npm run dev
```

## 📁 프로젝트 구조

```
coupang-blog/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # 루트 레이아웃 (SEO 메타, 헤더/푸터)
│   ├── page.tsx            # 홈페이지
│   ├── globals.css         # 전역 스타일
│   └── posts/[slug]/       # 포스트 상세 페이지
├── components/
│   ├── PostCard.tsx         # 포스트 카드
│   └── CoupangProductCard.tsx  # 쿠팡 상품 카드 (★ 핵심)
├── content/
│   └── posts/              # MDX 포스트 파일들
├── lib/
│   ├── config.ts           # 사이트 설정 (★ 니치 정하면 여기만 수정)
│   └── posts.ts            # 포스트 관리 라이브러리
├── scripts/
│   └── new-post.mjs        # 포스트 자동 생성 스크립트
└── public/                 # 정적 파일
```

## ✏️ 글 작성하기

### 수동 작성
```bash
npm run new-post -- --title "목 마사지기 추천 TOP 5" --category comparison
```

### AI 자동 생성 (Claude API)
```bash
ANTHROPIC_API_KEY=sk-ant-... npm run new-post -- --title "공기청정기 비교" --ai
```

### MDX 포맷
```yaml
---
title: "제목"
description: "설명 (SEO용)"
date: "2026-03-26"
category: "review"          # review | comparison | guide | deal
tags: ["태그1", "태그2"]
published: true             # false면 비공개
coupangLinks:               # 쿠팡 상품 카드 자동 생성
  - name: "상품명"
    price: 39900
    link: "https://link.coupang.com/..."
    rating: 4.5
    pros: ["장점1", "장점2"]
    cons: ["단점1"]
---
```

## 🔍 SEO 기능

- ✅ 메타 태그 자동 생성 (title, description, OG)
- ✅ JSON-LD 구조화 데이터 (Article + Product)
- ✅ sitemap.xml 자동 생성
- ✅ robots.txt 자동 생성
- ✅ RSS feed
- ✅ canonical URL
- ✅ Google Analytics 연동

## 🛒 쿠팡 파트너스 연동

1. `lib/config.ts`에서 `coupang.partnerId` 설정
2. MDX frontmatter에 `coupangLinks` 추가
3. 자동으로 상품 카드 + 구조화 데이터 생성
4. 대가성 고지 문구 자동 삽입 (법적 필수)

## 🚀 배포 (Vercel 무료)

```bash
npx vercel
```

또는 GitHub에 push하면 자동 배포.

## 🔄 sero-brain 연동

sero-reels.py에서 WP REST API 대신 이 블로그에 직접 MDX 파일을 
생성하는 방식으로 자동화 가능:

```python
# sero-blog.py (추가 예정)
# Claude API로 글 생성 → MDX 파일 생성 → git push → Vercel 자동 배포
```

## ⚙️ 니치 변경하기

`lib/config.ts` 파일 하나만 수정하면 됨:
- `name`: 사이트 이름
- `description`: 설명
- `categories`: 카테고리 목록
- `nav`: 네비게이션

## 🔑 키워드 발굴 → 검색 의도 → 제목 (자동 발행)

`scripts/daily_publish.py` 는 고정 토픽 대신 아래 순서로 글감을 고릅니다.

1. **키워드 발굴** (`scripts/keyword_research.py`): 카테고리별 메인 키워드 → 네이버·구글 자동완성과
   네이버 검색광고 연관 키워드로 세부 키워드 확장 → 검색량 대비 블로그 문서가 적은 키워드 선택.
   이미 쓴 키워드는 `content/posts` 의 `keyword` 필드로 걸러냅니다. 조회 결과는 `scripts/keyword_cache.json` 에 7일 캐시.
2. **검색 의도 분류** (`scripts/search_intent.py`): 정보·비교·후기 종합·문제 해결 중 하나로 나누고, 의도별 글 구조를 프롬프트에 넣습니다.
3. **제목 4단계 공식 + 주의 표현 점검** (`scripts/title_rules.py`): 메인 + 세부 키워드 + 근거 있는 수식어.
   없는 경험("직접 써보니"), 과장("무조건", "100%"), 본문에 없는 숫자, 상위 글 베끼기, 지난 연도는 탈락시키고,
   건강·금융·보험 분야는 효과 단정·조건 누락 표현을 점검합니다. 의료·시술·의약품 키워드는 자동 발행하지 않습니다.

```bash
cd scripts
python keyword_research.py --category finance -n 3 --show-block   # 키워드 플랜 미리보기 (글 생성 없음)
```

선택 환경변수 (없으면 자동완성 신호만으로 동작, GitHub Secrets 에 같은 이름으로 등록):

| 변수 | 용도 | 발급 |
|---|---|---|
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | 블로그 문서 수, 상위 글 제목, 지식iN 질문, 뉴스 | developers.naver.com → 검색 API |
| `NAVER_AD_API_KEY`, `NAVER_AD_SECRET`, `NAVER_AD_CUSTOMER_ID` | 월간 검색량, 연관 키워드 | searchad.naver.com → 도구 → API 사용 관리 |
