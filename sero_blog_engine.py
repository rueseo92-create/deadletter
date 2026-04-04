#!/usr/bin/env python3
"""
SERO Blog Engine - 고CPC 블로그 완전 자동화 루프
==================================================
키워드 선정 → SEO 콘텐츠 생성 → 내부링크 → MDX 발행 → Git 배포

사용법:
  python sero_blog_engine.py                    # 1개 글 자동 생성+발행
  python sero_blog_engine.py --batch 5          # 5개 글 배치 생성
  python sero_blog_engine.py --schedule         # 매일 자동 실행 (cron용)
  python sero_blog_engine.py --review           # 리뷰 모드 (발행 전 확인)
  python sero_blog_engine.py --rebuild-links    # 전체 내부링크 재구성

필요 패키지:
  pip install anthropic python-frontmatter python-slugify google-api-python-client
  
환경변수:
  ANTHROPIC_API_KEY     - Claude API 키
  BLOG_DIR              - 블로그 콘텐츠 디렉토리 (default: ./content/blog)
  AUTO_PUBLISH          - 자동 발행 여부 (true/false, default: false)
  GOOGLE_SHEETS_ID      - 키워드/로그 시트 ID (선택)
"""

import os
import sys
import json
import re
import random
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

try:
    import anthropic
except ImportError:
    print("❌ pip install anthropic")
    sys.exit(1)

try:
    import frontmatter
except ImportError:
    print("❌ pip install python-frontmatter")
    sys.exit(1)

try:
    from slugify import slugify
except ImportError:
    # fallback
    def slugify(text):
        return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


# ============================================================
# 1. 키워드 매트릭스 (고CPC 롱테일)
# ============================================================

KEYWORD_MATRIX = [
    # Phase 1: 경쟁 낮음, 애드센스 승인용
    {"keyword": "종합소득세 신고 방법 프리랜서 2026", "cat": "금융", "cpc": 4500, "phase": 1, "diff": "low"},
    {"keyword": "개인사업자 절세 방법 총정리", "cat": "금융", "cpc": 5000, "phase": 1, "diff": "low"},
    {"keyword": "적금 금리 비교 은행별 추천 2026", "cat": "금융", "cpc": 3000, "phase": 1, "diff": "low"},
    {"keyword": "주식 ETF 초보 시작하는 방법", "cat": "금융", "cpc": 3500, "phase": 1, "diff": "low"},
    {"keyword": "전세사기 예방 체크리스트 2026", "cat": "금융", "cpc": 3000, "phase": 1, "diff": "low"},
    {"keyword": "건강검진 항목 추천 20대 30대", "cat": "건강", "cpc": 2500, "phase": 1, "diff": "low"},
    {"keyword": "영양제 추천 조합 2026 총정리", "cat": "건강", "cpc": 3000, "phase": 1, "diff": "low"},
    {"keyword": "다이어트 식단 추천 일주일 메뉴", "cat": "건강", "cpc": 2000, "phase": 1, "diff": "low"},
    {"keyword": "수면 질 높이는 방법 불면증 해결", "cat": "건강", "cpc": 2000, "phase": 1, "diff": "low"},
    {"keyword": "셀프 인테리어 비용 아끼는 법", "cat": "인테리어", "cpc": 3000, "phase": 1, "diff": "low"},
    {"keyword": "원룸 인테리어 꿀팁 저예산 2026", "cat": "인테리어", "cpc": 2500, "phase": 1, "diff": "low"},
    {"keyword": "블로그 수익화 방법 초보 가이드", "cat": "IT", "cpc": 2000, "phase": 1, "diff": "low"},
    {"keyword": "재택부업 추천 월 100만원 현실적 방법", "cat": "IT", "cpc": 2500, "phase": 1, "diff": "low"},
    {"keyword": "노코드 앱 만들기 추천 툴 비교", "cat": "IT", "cpc": 2000, "phase": 1, "diff": "low"},
    {"keyword": "AI 도구 추천 업무 생산성 2026", "cat": "IT", "cpc": 2000, "phase": 1, "diff": "low"},

    # Phase 2: 중간 난이도, 트래픽 확보
    {"keyword": "신용카드 추천 비교 2026 혜택 총정리", "cat": "금융", "cpc": 4000, "phase": 2, "diff": "mid"},
    {"keyword": "비상금 대출 조건 한도 비교 2026", "cat": "금융", "cpc": 6000, "phase": 2, "diff": "mid"},
    {"keyword": "2026 청년 전세대출 조건 신청방법", "cat": "금융", "cpc": 5000, "phase": 2, "diff": "mid"},
    {"keyword": "치아보험 비교 추천 가입조건 2026", "cat": "보험", "cpc": 8000, "phase": 2, "diff": "mid"},
    {"keyword": "실비보험 전환 방법 장단점 비교", "cat": "보험", "cpc": 7000, "phase": 2, "diff": "mid"},
    {"keyword": "교통사고 합의금 계산 방법 2026", "cat": "보험", "cpc": 6000, "phase": 2, "diff": "mid"},
    {"keyword": "임플란트 비용 가격 비교 2026", "cat": "건강", "cpc": 5000, "phase": 2, "diff": "mid"},
    {"keyword": "탈모 치료 방법 비용 병원 추천", "cat": "건강", "cpc": 4000, "phase": 2, "diff": "mid"},
    {"keyword": "VPN 추천 비교 속도 가격 2026", "cat": "IT", "cpc": 3500, "phase": 2, "diff": "mid"},
    {"keyword": "클라우드 호스팅 비교 추천 2026", "cat": "IT", "cpc": 4000, "phase": 2, "diff": "mid"},
    {"keyword": "아파트 리모델링 비용 견적 2026", "cat": "인테리어", "cpc": 5000, "phase": 2, "diff": "mid"},
    {"keyword": "주방 리모델링 비용 업체 비교", "cat": "인테리어", "cpc": 6000, "phase": 2, "diff": "mid"},

    # Phase 3: 고경쟁 고CPC, 수익 극대화
    {"keyword": "자동차보험 다이렉트 비교 할인 2026", "cat": "보험", "cpc": 10000, "phase": 3, "diff": "high"},
    {"keyword": "암보험 가입 나이 보장범위 비교", "cat": "보험", "cpc": 8000, "phase": 3, "diff": "high"},
    {"keyword": "연말정산 환급 많이 받는 법 2026", "cat": "금융", "cpc": 3000, "phase": 3, "diff": "high"},
]


# ============================================================
# 2. SEO 시스템 프롬프트
# ============================================================

SYSTEM_PROMPT = """당신은 구글 애드센스 고수익 블로그 전문 작가입니다.
독자에게 진짜 도움이 되는 고품질 정보성 글을 작성합니다.

## 필수 규칙

### 타이틀
- 핵심 키워드를 제목 맨 앞에 배치
- 60자(한글 30자) 이내
- 행동 유도형: 비교, 추천, 방법, 총정리, 조건, TOP5

### 메타 디스크립션
- 155자 이내, 키워드 자연 포함, 액션 유도

### 헤딩 구조
- H1: 1개만 (핵심 키워드)
- H2: 5~7개 (키워드 변형)
- H3: 세부항목

### 콘텐츠
- 최소 3,000자 이상 (한글)
- 비교표 최소 1개 (가격/조건/장단점)
- "제가 직접 비교해봤는데요" 같은 경험담 형식
- 금융/보험은 공식 출처 인용 (금융위, 건보공단 등)
- FAQ 섹션 2~3개 (구글 강조 스니펫 노리기)
- 글 마지막: CTA + 관련 글 유도

### 금지
- "광고 클릭" 유도 문구 절대 금지
- 의학적/법률적 확정 표현 금지 ("~를 추천드려요" 사용)
- 500자 미만 짧은 글 금지

### 내부 링크
- 본문 중간에 [내부링크: 관련키워드] 2~3개 표시

## 출력: 순수 MDX만 출력 (설명 없이)

---
title: "[키워드] [매력적 제목] | DeadLetter"
description: "[155자 메타 디스크립션]"
date: "YYYY-MM-DD"
keywords: ["키워드1", "키워드2", "키워드3"]
category: "[카테고리]"
image: "/images/blog/placeholder.webp"
---

# [H1 제목]

[본문 3,000자+]
"""


# ============================================================
# 3. 메인 엔진 클래스
# ============================================================

class SeroBlogEngine:
    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", "")
        )
        self.blog_dir = Path(os.environ.get("BLOG_DIR", "./content/blog"))
        self.blog_dir.mkdir(parents=True, exist_ok=True)
        self.log_file = Path("./sero_blog_log.json")
        self.log = self._load_log()
        self.auto_publish = os.environ.get("AUTO_PUBLISH", "false").lower() == "true"

    def _load_log(self) -> dict:
        if self.log_file.exists():
            return json.loads(self.log_file.read_text())
        return {"published": [], "queue": [], "stats": {"total": 0, "today": 0}}

    def _save_log(self):
        self.log_file.write_text(json.dumps(self.log, ensure_ascii=False, indent=2))

    # ----------------------------------------------------------
    # Step 1: 키워드 선택 (아직 안 쓴 것 중 우선순위 높은 것)
    # ----------------------------------------------------------
    def pick_keyword(self, phase: Optional[int] = None) -> dict:
        """발행 안 한 키워드 중 Phase 순서대로 선택"""
        published_kws = {p["keyword"] for p in self.log["published"]}

        candidates = [
            kw for kw in KEYWORD_MATRIX
            if kw["keyword"] not in published_kws
            and (phase is None or kw["phase"] == phase)
        ]

        if not candidates:
            print("⚠️ 모든 키워드 소진! 새 키워드 추가 필요")
            return None

        # Phase 1 → 2 → 3 순서, 같은 Phase 내에서는 CPC 높은 것 우선
        candidates.sort(key=lambda x: (x["phase"], -x["cpc"]))
        selected = candidates[0]
        print(f"🎯 키워드 선택: [{selected['cat']}] {selected['keyword']} (CPC ₩{selected['cpc']})")
        return selected

    # ----------------------------------------------------------
    # Step 2: Claude API로 SEO 콘텐츠 생성
    # ----------------------------------------------------------
    def generate_content(self, keyword_data: dict) -> str:
        """Claude API로 3,000자+ SEO 최적화 글 생성"""
        kw = keyword_data["keyword"]
        cat = keyword_data["cat"]
        today = datetime.now().strftime("%Y-%m-%d")

        user_prompt = f"""다음 키워드로 고품질 SEO 블로그 글을 작성해주세요.

키워드: {kw}
카테고리: {cat}
작성일: {today}

규칙:
1. 제목에 핵심 키워드를 맨 앞에
2. 비교표 1개 이상 포함
3. FAQ 2~3개 포함
4. 3,000자 이상
5. [내부링크: 관련키워드] 2개 포함
6. MDX frontmatter 포함해서 출력

순수 MDX만 출력하세요. 다른 설명 없이."""

        print(f"📝 콘텐츠 생성 중... ({kw})")

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=8000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}]
        )

        content = message.content[0].text

        # MDX 코드블록 래퍼 제거
        content = re.sub(r'^```mdx?\n?', '', content)
        content = re.sub(r'\n?```$', '', content)

        # 글자 수 체크
        text_only = re.sub(r'[#\-|*>\[\]()]', '', content)
        char_count = len(text_only.replace(' ', '').replace('\n', ''))
        print(f"📊 생성 완료: {char_count}자")

        if char_count < 2500:
            print("⚠️ 글자 수 부족, 보강 요청 중...")
            content = self._extend_content(content, kw)

        return content

    def _extend_content(self, content: str, keyword: str) -> str:
        """글자 수 부족 시 보강"""
        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{
                "role": "user",
                "content": f"""아래 블로그 글이 3,000자 미만입니다.
각 H2 섹션의 내용을 더 자세하게 보강해주세요.
비교표나 FAQ가 부족하면 추가해주세요.
키워드: {keyword}

기존 글:
{content}

보강된 전체 MDX를 출력하세요."""
            }]
        )
        result = message.content[0].text
        result = re.sub(r'^```mdx?\n?', '', result)
        result = re.sub(r'\n?```$', '', result)
        return result

    # ----------------------------------------------------------
    # Step 3: 내부 링크 처리
    # ----------------------------------------------------------
    def process_internal_links(self, content: str) -> str:
        """[내부링크: 키워드] 플레이스홀더를 실제 링크로 교체"""
        existing_posts = list(self.blog_dir.glob("*.mdx")) + list(self.blog_dir.glob("*.md"))

        if not existing_posts:
            # 기존 글이 없으면 플레이스홀더 제거
            content = re.sub(r'\[내부링크:\s*.+?\]', '', content)
            return content

        # 기존 글 메타데이터 로드
        posts_meta = []
        for p in existing_posts:
            try:
                post = frontmatter.load(str(p))
                posts_meta.append({
                    "title": post.metadata.get("title", ""),
                    "slug": p.stem,
                    "keywords": post.metadata.get("keywords", []),
                    "category": post.metadata.get("category", ""),
                })
            except Exception:
                continue

        # 플레이스홀더 교체
        pattern = r'\[내부링크:\s*(.+?)\]'
        matches = list(re.finditer(pattern, content))

        for match in matches:
            search_term = match.group(1)
            # 가장 관련 있는 글 찾기
            best_match = None
            best_score = 0
            for pm in posts_meta:
                score = 0
                if search_term in pm["title"]:
                    score += 3
                for kw in pm.get("keywords", []):
                    if search_term in kw or kw in search_term:
                        score += 2
                if score > best_score:
                    best_score = score
                    best_match = pm

            if best_match and best_score > 0:
                link = f'👉 **함께 읽기**: [{best_match["title"]}](/blog/{best_match["slug"]})'
            else:
                link = ""  # 매칭 안 되면 제거

            content = content.replace(match.group(0), link, 1)

        return content

    # ----------------------------------------------------------
    # Step 4: MDX 파일 저장
    # ----------------------------------------------------------
    def save_mdx(self, content: str, keyword_data: dict) -> Path:
        """MDX 파일로 저장"""
        # 슬러그 생성
        slug_base = keyword_data["keyword"][:40]
        slug = slugify(slug_base, lowercase=True)
        if not slug:
            slug = f"post-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        filename = f"{slug}.mdx"
        filepath = self.blog_dir / filename

        # 중복 방지
        counter = 1
        while filepath.exists():
            filepath = self.blog_dir / f"{slug}-{counter}.mdx"
            counter += 1

        filepath.write_text(content, encoding="utf-8")
        print(f"💾 저장: {filepath}")
        return filepath

    # ----------------------------------------------------------
    # Step 5: Git 커밋 & 배포
    # ----------------------------------------------------------
    def git_deploy(self, filepath: Path, keyword: str):
        """Git 커밋 + 푸시 → Vercel 자동 배포"""
        try:
            subprocess.run(["git", "add", str(filepath)], check=True, capture_output=True)
            subprocess.run(
                ["git", "commit", "-m", f"feat(blog): {keyword[:50]}"],
                check=True, capture_output=True
            )
            subprocess.run(["git", "push"], check=True, capture_output=True)
            print("🚀 Git 배포 완료 → Vercel 자동 빌드 시작")
            return True
        except subprocess.CalledProcessError as e:
            print(f"⚠️ Git 오류: {e}")
            return False

    # ----------------------------------------------------------
    # Step 6: 로그 기록
    # ----------------------------------------------------------
    def log_publish(self, keyword_data: dict, filepath: Path):
        """발행 로그 기록"""
        entry = {
            "keyword": keyword_data["keyword"],
            "category": keyword_data["cat"],
            "cpc": keyword_data["cpc"],
            "phase": keyword_data["phase"],
            "file": str(filepath),
            "published_at": datetime.now().isoformat(),
        }
        self.log["published"].append(entry)
        self.log["stats"]["total"] += 1
        self._save_log()

    # ----------------------------------------------------------
    # 역링크: 기존 글에 새 글 링크 추가
    # ----------------------------------------------------------
    def add_backlinks(self, new_filepath: Path, keyword_data: dict):
        """기존 관련 글에 새 글 역링크 삽입"""
        try:
            new_post = frontmatter.load(str(new_filepath))
            new_title = new_post.metadata.get("title", "")
            new_slug = new_filepath.stem
            new_keywords = set(new_post.metadata.get("keywords", []))
            new_cat = new_post.metadata.get("category", "")
        except Exception:
            return

        existing = list(self.blog_dir.glob("*.mdx")) + list(self.blog_dir.glob("*.md"))
        backlink_count = 0

        for p in existing:
            if p == new_filepath:
                continue
            try:
                post = frontmatter.load(str(p))
                # 이미 링크 있으면 스킵
                if f"/blog/{new_slug}" in post.content:
                    continue

                post_keywords = set(post.metadata.get("keywords", []))
                post_cat = post.metadata.get("category", "")

                # 관련성 점수
                score = len(new_keywords & post_keywords) * 3
                if new_cat and new_cat == post_cat:
                    score += 2

                if score >= 2:
                    # 60% 위치에 삽입
                    lines = post.content.split("\n")
                    insert_at = int(len(lines) * 0.6)
                    link_block = f"\n> 📌 **추천 글**: [{new_title}](/blog/{new_slug})\n"
                    lines.insert(insert_at, link_block)
                    post.content = "\n".join(lines)

                    with open(str(p), "w", encoding="utf-8") as f:
                        f.write(frontmatter.dumps(post))

                    backlink_count += 1
                    if backlink_count >= 3:
                        break

            except Exception:
                continue

        if backlink_count > 0:
            print(f"🔗 역링크 {backlink_count}개 삽입")

    # ----------------------------------------------------------
    # 메인 루프: 1개 글 전체 파이프라인
    # ----------------------------------------------------------
    def run_single(self, phase: Optional[int] = None, review: bool = False):
        """1개 글 자동 생성 → 발행 전체 파이프라인"""
        print("\n" + "=" * 50)
        print("🔄 SERO Blog Engine - 자동화 루프 시작")
        print("=" * 50)

        # Step 1: 키워드 선택
        kw_data = self.pick_keyword(phase)
        if not kw_data:
            return False

        # Step 2: 콘텐츠 생성
        content = self.generate_content(kw_data)

        # Step 3: 내부 링크 처리
        content = self.process_internal_links(content)

        # Step 4: 저장
        filepath = self.save_mdx(content, kw_data)

        # 리뷰 모드면 여기서 멈춤
        if review:
            print(f"\n👀 리뷰 모드: {filepath}")
            print("수정 후 다음 명령으로 발행:")
            print(f"  python sero_blog_engine.py --publish {filepath}")
            return True

        # Step 5: 역링크
        self.add_backlinks(filepath, kw_data)

        # Step 6: Git 배포
        if self.auto_publish:
            self.git_deploy(filepath, kw_data["keyword"])

        # Step 7: 로그
        self.log_publish(kw_data, filepath)

        print(f"\n✅ 완료! [{kw_data['cat']}] {kw_data['keyword']}")
        print(f"📊 누적: {self.log['stats']['total']}개 발행")
        return True

    def run_batch(self, count: int = 5, phase: Optional[int] = None, 
                  review: bool = False, delay_minutes: int = 0):
        """배치 모드: 여러 글 연속 생성"""
        print(f"\n🔁 배치 모드: {count}개 글 생성")

        success = 0
        for i in range(count):
            print(f"\n--- [{i+1}/{count}] ---")
            result = self.run_single(phase=phase, review=review)
            if result:
                success += 1
            else:
                print("⚠️ 키워드 소진, 중단")
                break

            # 배치 간 대기 (API 레이트 리밋 방지)
            if i < count - 1 and delay_minutes > 0:
                import time
                print(f"⏳ {delay_minutes}분 대기...")
                time.sleep(delay_minutes * 60)

        print(f"\n🏁 배치 완료: {success}/{count}개 성공")

    def show_status(self):
        """현재 상태 출력"""
        published = len(self.log["published"])
        total_kw = len(KEYWORD_MATRIX)
        remaining = total_kw - published

        print(f"\n📊 SERO Blog Engine 현황")
        print(f"{'─' * 40}")
        print(f"발행 완료:  {published}개")
        print(f"남은 키워드: {remaining}개")
        print(f"총 키워드:  {total_kw}개")

        if self.log["published"]:
            last = self.log["published"][-1]
            print(f"최근 발행:  {last['keyword']}")
            print(f"최근 시간:  {last['published_at'][:16]}")

        # Phase별 현황
        for phase in [1, 2, 3]:
            total_p = len([k for k in KEYWORD_MATRIX if k["phase"] == phase])
            done_p = len([p for p in self.log["published"] 
                         if any(k["keyword"] == p["keyword"] and k["phase"] == phase 
                               for k in KEYWORD_MATRIX)])
            print(f"Phase {phase}:    {done_p}/{total_p}")


# ============================================================
# CLI
# ============================================================

def main():
    engine = SeroBlogEngine()

    if len(sys.argv) < 2:
        engine.show_status()
        print(f"\n사용법:")
        print(f"  python {sys.argv[0]}                     # 상태 확인")
        print(f"  python {sys.argv[0]} --run               # 1개 글 자동 생성+발행")
        print(f"  python {sys.argv[0]} --run --review      # 1개 글 생성 (리뷰 후 발행)")
        print(f"  python {sys.argv[0]} --batch 5            # 5개 글 배치 생성")
        print(f"  python {sys.argv[0]} --batch 5 --review   # 5개 글 배치 (리뷰 모드)")
        print(f"  python {sys.argv[0]} --phase 1            # Phase 1 키워드만")
        print(f"  python {sys.argv[0]} --schedule           # cron용 (1개 자동 발행)")
        return

    args = sys.argv[1:]
    review = "--review" in args
    phase = None

    if "--phase" in args:
        idx = args.index("--phase")
        if idx + 1 < len(args):
            phase = int(args[idx + 1])

    if "--run" in args:
        engine.run_single(phase=phase, review=review)

    elif "--batch" in args:
        idx = args.index("--batch")
        count = int(args[idx + 1]) if idx + 1 < len(args) else 5
        engine.run_batch(count=count, phase=phase, review=review)

    elif "--schedule" in args:
        # cron용: 자동 발행 모드
        engine.auto_publish = True
        engine.run_single(phase=phase)

    elif "--status" in args:
        engine.show_status()

    elif "--rebuild-links" in args:
        print("🔄 전체 내부링크 재구성...")
        # 간단한 재구성 로직
        posts = list(engine.blog_dir.glob("*.mdx"))
        for p in posts:
            engine.add_backlinks(p, {"keyword": p.stem})
        print(f"✅ {len(posts)}개 글 내부링크 재구성 완료")


if __name__ == "__main__":
    main()
