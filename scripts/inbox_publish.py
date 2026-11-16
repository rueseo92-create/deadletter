"""
피클 → 클로드 인계함: inbox/ 에 쌓인 초안·아이디어를 집어 10인 검수 통과본으로 발행한다.

피클(또는 사람)이 inbox/ 폴더에 .md / .txt 파일을 커밋해 두면,
이 스크립트가 각 파일을 읽어 제목·메모·카테고리로 바꾸고 sero_blog 파이프라인으로 완성·발행한다.
발행에 성공하거나 검수에서 탈락하면 그 파일을 inbox/done/ 으로 옮긴다(중복 처리 방지).

inbox 파일 형식 (프런트매터는 선택):
---
title: 예약 문자 정리 자동화
category: ai-automation      # ai-automation | ai-side-hustle | ai-news | ai-tools (없으면 자동 추정)
---
여기부터는 메모. 무엇을 다뤄야 하는지, 꼭 넣을 숫자·출처 등을 자유롭게 적는다.
첫 줄에 '제목:' 또는 '# 제목' 만 있어도 된다.

사용:
  python inbox_publish.py            # inbox/ 전부 처리
  python inbox_publish.py --dry-run  # 발행 없이 생성만
  python inbox_publish.py --limit 2
"""

import argparse
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sero_blog  # noqa: E402
import keyword_research  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "inbox"
DONE = INBOX / "done"
VALID_CATS = set(sero_blog.CATEGORIES.keys())

# 메모 단어로 카테고리 추정 (프런트매터에 없을 때)
CAT_HINT = [
    ("ai-automation", ["자동화", "엑셀", "구글시트", "노션", "업무", "예약", "매크로", "스크립트"]),
    ("ai-side-hustle", ["마케팅", "홍보", "광고", "블로그", "인스타", "스레드", "플레이스", "쇼핑몰", "소상공인", "매출", "유입"]),
    ("ai-tools", ["챗gpt", "클로드", "제미나이", "퍼플렉시티", "도구", "앱", "요금제", "비교", "사용법"]),
    ("ai-news", ["출시", "발표", "업데이트", "뉴스", "논란", "오픈"]),
]


def guess_category(text: str) -> str:
    low = text.lower()
    best, score = "ai-tools", 0
    for cat, words in CAT_HINT:
        s = sum(1 for w in words if w in low)
        if s > score:
            best, score = cat, s
    return best


def parse(path: Path) -> dict | None:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return None
    meta, body = {}, raw
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip().lower()] = v.strip().strip('"').strip("'")
        body = m.group(2).strip()
    title = meta.get("title", "")
    if not title:  # 첫 줄을 제목으로
        first = body.splitlines()[0].strip() if body else path.stem
        title = re.sub(r"^#+\s*|^제목\s*[:：]\s*", "", first).strip()[:60] or path.stem
        if body.splitlines() and re.sub(r"^#+\s*|^제목\s*[:：]\s*", "", body.splitlines()[0].strip()).strip() == title:
            body = "\n".join(body.splitlines()[1:]).strip()
    cat = meta.get("category", "").strip()
    if cat not in VALID_CATS:
        cat = guess_category(title + " " + body)
    return {"title": title, "category": cat, "summary": body[:1500]}


def publish_one(item: dict, dry_run: bool) -> bool:
    plan = None
    try:  # 한국어면 키워드 계획을 붙여 품질을 높인다(실패해도 계속)
        plans = keyword_research.pick_plans(item["category"], 1)
        plan = plans[0] if plans else None
        if plan:
            plan["keyword"] = plan.get("keyword") or item["title"]
    except Exception as e:
        print(f"  [키워드] 생략: {e}")
    topic = sero_blog.TopicData(
        title=item["title"], category=item["category"], summary=item["summary"],
        source_name="피클 인계함", source_type="news", keyword_plan=plan, language="ko")
    post = sero_blog.generate_blog_post(topic)
    post.published = not dry_run
    post = sero_blog.run_seo_audit(post)
    fp = sero_blog.create_mdx_file(post)
    if fp and not dry_run:
        sero_blog.deploy(fp)
    return bool(fp)


def main():
    ap = argparse.ArgumentParser(description="피클 인계함 발행")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=3)
    a = ap.parse_args()

    INBOX.mkdir(exist_ok=True)
    DONE.mkdir(exist_ok=True)
    files = [p for p in sorted(INBOX.glob("*.md")) + sorted(INBOX.glob("*.txt"))
             if p.parent == INBOX and p.name.lower() != "readme.md"]
    if not files:
        print("인계함이 비어 있어요. inbox/ 에 초안 .md 를 넣으세요.")
        return 0

    print(f"인계함 {len(files)}개 중 최대 {a.limit}개 처리")
    ok = 0
    for path in files[: a.limit]:
        item = parse(path)
        if not item:
            path.rename(DONE / path.name)
            continue
        print(f"\n[{path.name}] {item['title']} ({item['category']})")
        try:
            done = publish_one(item, a.dry_run)
            print("  → 발행" if done and not a.dry_run else "  → 생성만(dry-run)" if done else "  → 검수 탈락, 발행 안 함")
            ok += bool(done)
        except Exception as e:
            print(f"  [오류] {e}")
            done = False
        if not a.dry_run:
            path.rename(DONE / path.name)  # 처리한 건 done 으로 (성공·실패 무관, 중복 방지)
    print(f"\n완료: {ok}/{min(len(files), a.limit)}편")
    return 0


if __name__ == "__main__":
    sys.exit(main())
