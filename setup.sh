#!/bin/bash
# ============================================================
# SERO Blog Engine - 원클릭 설치 & 자동화 설정
# ============================================================
# 사용법: chmod +x setup.sh && ./setup.sh

set -e

echo "🚀 SERO Blog Engine 설치 시작..."

# 1. Python 패키지 설치
echo "📦 패키지 설치 중..."
pip install anthropic python-frontmatter python-slugify --break-system-packages 2>/dev/null || \
pip install anthropic python-frontmatter python-slugify

# 2. 디렉토리 구조 생성
echo "📁 디렉토리 생성..."
mkdir -p content/blog
mkdir -p public/images/blog

# 3. 환경변수 설정 (.env)
if [ ! -f .env ]; then
    echo "⚙️ .env 파일 생성..."
    cat > .env << 'EOF'
# SERO Blog Engine 환경변수
ANTHROPIC_API_KEY=sk-ant-your-key-here
BLOG_DIR=./content/blog
AUTO_PUBLISH=false

# true로 바꾸면 git push까지 자동
# AUTO_PUBLISH=true
EOF
    echo "⚠️  .env 파일에 ANTHROPIC_API_KEY를 입력하세요!"
fi

# 4. robots.txt 생성
if [ ! -f public/robots.txt ]; then
    echo "🤖 robots.txt 생성..."
    cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://deadletter.vercel.app/sitemap.xml
EOF
fi

# 5. 정적 페이지 템플릿 (About, Privacy, Terms)
echo "📄 정적 페이지 생성..."

mkdir -p content/pages

cat > content/pages/about.mdx << 'EOF'
---
title: "About | DeadLetter"
description: "DeadLetter 블로그 소개 - 금융, 건강, IT 실용 정보를 제공합니다."
---

# About DeadLetter

DeadLetter는 복잡한 정보를 쉽게 정리해드리는 실용 정보 블로그입니다.

금융, 건강, IT, 인테리어 등 일상에서 꼭 필요한 정보를 비교 분석하여 제공합니다.

## 운영 원칙

- 직접 조사하고 비교한 정보만 제공합니다
- 공식 출처를 인용하여 정확성을 높입니다
- 독자분들의 실질적인 의사결정에 도움이 되는 글을 씁니다

## 연락처

문의사항이 있으시면 이메일로 연락주세요.
EOF

cat > content/pages/privacy.mdx << 'EOF'
---
title: "개인정보처리방침 | DeadLetter"
description: "DeadLetter 개인정보처리방침"
---

# 개인정보처리방침

DeadLetter(이하 "사이트")는 이용자의 개인정보를 중요시하며, 개인정보보호법을 준수합니다.

## 수집하는 개인정보

본 사이트는 Google Analytics를 통해 익명화된 방문 통계를 수집합니다.
- 방문 페이지, 체류 시간, 유입 경로 (익명)
- IP 주소는 익명화 처리됩니다

## 광고

본 사이트는 Google AdSense를 통해 광고를 게재합니다.
Google은 쿠키를 사용하여 관련성 높은 광고를 표시할 수 있습니다.

## 쿠키

본 사이트는 사용자 경험 개선을 위해 쿠키를 사용합니다.
브라우저 설정에서 쿠키를 비활성화할 수 있습니다.

## 문의

개인정보 관련 문의사항은 이메일로 연락주세요.

최종 수정일: 2026-04-04
EOF

cat > content/pages/terms.mdx << 'EOF'
---
title: "이용약관 | DeadLetter"
description: "DeadLetter 이용약관"
---

# 이용약관

## 서비스 이용

DeadLetter에서 제공하는 정보는 참고용이며, 최종 의사결정은 이용자 본인의 책임입니다.
금융, 건강, 법률 관련 정보는 전문가 상담을 권장합니다.

## 저작권

본 사이트의 모든 콘텐츠는 저작권법에 의해 보호됩니다.
무단 복제, 배포를 금합니다.

## 면책조항

본 사이트의 정보는 정확성을 위해 노력하지만, 
오류나 누락이 있을 수 있으며 이로 인한 손해에 대해 책임지지 않습니다.

최종 수정일: 2026-04-04
EOF

echo ""
echo "✅ 설치 완료!"
echo ""
echo "📋 다음 단계:"
echo "  1. .env 파일에 ANTHROPIC_API_KEY 입력"
echo "  2. python sero_blog_engine.py --run --review  # 첫 글 생성 (리뷰 모드)"
echo "  3. 생성된 글 확인 후 수정"
echo "  4. python sero_blog_engine.py --batch 15 --phase 1 --review  # Phase 1 전체"
echo ""
echo "🔄 자동 실행 (cron 설정):"
echo "  # 매일 오전 9시 자동 1개 글 발행"
echo '  0 9 * * * cd /path/to/blog && source .env && python sero_blog_engine.py --schedule'
echo ""
echo "  # 매주 월/수/금 오전 10시 (주 3개)"
echo '  0 10 * * 1,3,5 cd /path/to/blog && source .env && python sero_blog_engine.py --schedule'
