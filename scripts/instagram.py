"""
인스타그램 자동 발행 — 하루 한 번 (GitHub Actions: .github/workflows/instagram.yml)

  1. 블로그 새 글 → 카드뉴스 3장(표지 · 핵심 3가지 · 상담 안내) + 캡션 → 캐러셀 게시 (하루 1개)
  2. social/reels/ 에 넣어 둔 영상 → 릴스 게시 (하루 1개, 파일 이름 순)
     같은 이름의 .txt 가 있으면 그 내용이 캡션, 없으면 기본 캡션

사용:
  python instagram.py daily              # 위 두 가지 (한도 안에서)
  python instagram.py daily --dry-run    # 카드만 만들고 게시하지 않음
  python instagram.py card <slug>        # 카드 이미지만 만들어 보기
  python instagram.py check              # 토큰·계정 확인

환경 변수 (GitHub Secrets):
  INSTAGRAM_ACCESS_TOKEN   인스타그램 로그인 방식(IGAA…)이나 페이스북 로그인 방식(EAA…) 토큰
  INSTAGRAM_USER_ID        인스타그램 프로페셔널 계정 ID
  GH_SECRET_WRITE_TOKEN    (선택) 토큰을 주기적으로 연장해 시크릿에 다시 저장할 GitHub 토큰

이미지는 저장소에 커밋한 뒤 공개 주소(raw.githubusercontent.com)로 넘기고,
릴스 영상은 인스타그램에 파일을 직접 올린다(재개 가능 업로드).
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import claude_client  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "content" / "posts"
CARD_DIR = ROOT / "social" / "ig"
REELS_DIR = ROOT / "social" / "reels"
HISTORY_FILE = Path(__file__).parent / "instagram_history.json"
FONT_DIR = Path(__file__).parent / ".cache" / "fonts"

SITE_URL = os.environ.get("BLOG_SITE_URL", "https://seroai.xyz")
REPO = os.environ.get("GITHUB_REPOSITORY", "rueseo92-create/deadletter")
TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "").strip()
USER_ID = os.environ.get("INSTAGRAM_USER_ID", "").strip()
API_VERSION = "v23.0"
KST = timezone(timedelta(hours=9))

CATEGORIES = {"ai-automation": "업무 자동화", "ai-side-hustle": "AI 마케팅", "ai-news": "AI 뉴스", "ai-tools": "AI 도구"}
DAILY_CAROUSELS = 1
DAILY_REELS = 1

DEFAULT_REEL_CAPTION = """세팅은 저희가, 사장님은 딸깍만.

AI 자동화 · 홈페이지 · AI 마케팅 대행
무료 상담은 프로필 링크(seroai.xyz)에서

#AI자동화 #업무자동화 #소상공인 #자영업자 #사장님 #AI마케팅 #딸깍"""


# ──────────────────────────────────────────────
# 그래프 API
# ──────────────────────────────────────────────
def _host() -> str:
    """인스타그램 로그인 토큰(IG…)은 graph.instagram.com, 페이스북 로그인 토큰은 graph.facebook.com"""
    override = os.environ.get("INSTAGRAM_API_HOST")
    if override:
        return override
    return "graph.instagram.com" if TOKEN.startswith("IG") else "graph.facebook.com"


def _api(method: str, path: str, params: dict | None = None) -> dict:
    params = dict(params or {})
    params["access_token"] = TOKEN
    url = f"https://{_host()}/{API_VERSION}/{path}"
    data = None
    if method == "GET":
        url += "?" + urllib.parse.urlencode(params)
    else:
        data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(url, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        # 토큰이 오류 메시지에 섞여 나오지 않게 지운다
        raise RuntimeError(f"{method} {path} → {e.code}: {body.replace(TOKEN, '***')[:500]}") from None


def _wait_ready(container_id: str, timeout: int = 600) -> None:
    """컨테이너 처리가 끝날 때까지 기다린다 (영상은 몇 분 걸릴 수 있음)"""
    start = time.time()
    while time.time() - start < timeout:
        st = _api("GET", container_id, {"fields": "status_code,status"})
        code = st.get("status_code")
        if code == "FINISHED":
            return
        if code in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"미디어 처리 실패: {st.get('status')}")
        time.sleep(8)
    raise RuntimeError("미디어 처리 시간 초과")


def _publish(container_id: str) -> str:
    _wait_ready(container_id)
    return _api("POST", f"{USER_ID}/media_publish", {"creation_id": container_id})["id"]


def post_carousel(image_urls: list[str], caption: str) -> str:
    children = []
    for u in image_urls:
        c = _api("POST", f"{USER_ID}/media", {"image_url": u, "is_carousel_item": "true"})
        children.append(c["id"])
    for c in children:
        _wait_ready(c, 180)
    parent = _api("POST", f"{USER_ID}/media", {
        "media_type": "CAROUSEL", "children": ",".join(children), "caption": caption})
    return _publish(parent["id"])


def post_reel(video: Path, caption: str) -> str:
    """영상을 인스타그램에 직접 올린다 (공개 주소 필요 없음)"""
    c = _api("POST", f"{USER_ID}/media", {
        "media_type": "REELS", "upload_type": "resumable", "caption": caption, "share_to_feed": "true"})
    data = video.read_bytes()
    req = urllib.request.Request(
        f"https://rupload.facebook.com/ig-api-upload/{API_VERSION}/{c['id']}", data=data, method="POST",
        headers={"Authorization": f"OAuth {TOKEN}", "offset": "0", "file_size": str(len(data))})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"영상 업로드 실패 {e.code}: {e.read().decode('utf-8', 'replace')[:300]}") from None
    return _publish(c["id"])


def check() -> dict:
    fields = "id,username" if _host() == "graph.instagram.com" else "id,username,name"
    info = _api("GET", USER_ID or "me", {"fields": fields})
    print(f"  계정: @{info.get('username')} (ID {info.get('id')}) · API {_host()}")
    try:
        lim = _api("GET", f"{USER_ID}/content_publishing_limit", {"fields": "quota_usage,config"})
        print(f"  24시간 게시 사용량: {lim.get('data', [{}])[0]}")
    except RuntimeError as e:
        print(f"  (게시 한도 조회 불가: {e})")
    return info


def refresh_token() -> None:
    """인스타그램 로그인 토큰(60일)을 연장하고, 권한이 있으면 GitHub 시크릿에 다시 저장한다"""
    if _host() != "graph.instagram.com":
        return
    write_token = os.environ.get("GH_SECRET_WRITE_TOKEN", "").strip()
    try:
        url = "https://graph.instagram.com/refresh_access_token?" + urllib.parse.urlencode(
            {"grant_type": "ig_refresh_token", "access_token": TOKEN})
        with urllib.request.urlopen(url, timeout=30) as r:
            new = json.loads(r.read())
    except Exception as e:  # 연장 실패는 게시를 막지 않는다
        print(f"  [!] 토큰 연장 실패: {str(e).replace(TOKEN, '***')[:200]}")
        return
    days = int(new.get("expires_in", 0)) // 86400
    if not write_token:
        print(f"  토큰 연장됨(약 {days}일). 새 값을 저장할 권한(GH_SECRET_WRITE_TOKEN)이 없어 기존 토큰을 계속 씁니다.")
        return
    p = subprocess.run(["gh", "secret", "set", "INSTAGRAM_ACCESS_TOKEN", "--repo", REPO, "--body", new["access_token"]],
                       env={**os.environ, "GH_TOKEN": write_token}, capture_output=True, text=True)
    print("  토큰 연장 후 시크릿 갱신 완료" if p.returncode == 0 else f"  [!] 시크릿 갱신 실패: {p.stderr[:200]}")


# ──────────────────────────────────────────────
# 글 고르기 · 카드 문구
# ──────────────────────────────────────────────
def _frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)", text, re.S)
    if not m:
        return {}
    meta = {}
    for line in m.group(1).splitlines():
        mm = re.match(r'^(\w+):\s*(.*)$', line)
        if mm:
            meta[mm.group(1)] = mm.group(2).strip().strip('"').strip("'")
    meta["body"] = m.group(2)
    return meta


def pick_post(done: set[str]) -> dict | None:
    """아직 올리지 않은 최신 글 (파일 이름의 날짜 순, 현재 카테고리만)"""
    for f in sorted(POSTS_DIR.glob("*.mdx"), reverse=True):
        meta = _frontmatter(f)
        if f.stem in done or meta.get("category") not in CATEGORIES or meta.get("published") == "false":
            continue
        return {"slug": f.stem, "title": meta.get("title", ""), "description": meta.get("description", ""),
                "tldr": meta.get("tldr", ""), "category": meta["category"], "body": meta["body"][:6000],
                "url": f"{SITE_URL}/posts/{f.stem}"}
    return None


class Card(BaseModel):
    hook: str = Field(description="표지 문구. 28자 이내. 글의 핵심을 궁금하게 만드는 한 문장. 과장·보장 표현 금지")
    highlight: str = Field(description="hook 안에서 형광펜으로 칠할 2~8자 구절 (hook 에 그대로 들어 있어야 함)")
    points: list[str] = Field(description="본문에서 뽑은 핵심 3가지. 각 42자 이내, 구체적인 단계·기준·숫자 위주")
    caption: str = Field(description="인스타 캡션 (해시태그 포함)")


CARD_PROMPT = """세로AI 딸깍스튜디오(AI 자동화 대행)의 인스타그램 카드뉴스를 만듭니다. 독자는 바쁜 소상공인·1인 사업자 사장님입니다.
아래 블로그 글에서 사실만 뽑아 카드 문구와 캡션을 만드세요.

규칙
- 글에 없는 숫자·사례·효과를 만들지 않는다. 매출·순위·노출을 보장하는 표현 금지
- 표지(hook)는 28자 이내, 질문형이나 '~하기 전 확인할 것'처럼 넘겨 보고 싶게
- points 는 정확히 3개, 각 42자 이내, 바로 따라 할 수 있는 내용
- caption: 첫 줄 후킹 → 핵심 2~3줄 → "전체 글은 프로필 링크(seroai.xyz)에서" → 빈 줄 → 해시태그 8~12개
  이모지는 2개 이하, 마크다운(**) 금지, 400자 이내

글 제목: {title}
요약: {description}
핵심 답변: {tldr}
카테고리: {category}
본문(앞부분):
{body}"""


def make_card_copy(post: dict) -> Card:
    r = claude_client.client().messages.parse(
        model=claude_client.MODEL, max_tokens=4000,
        messages=[{"role": "user", "content": CARD_PROMPT.format(**{**post, "category": CATEGORIES[post["category"]]})}],
        output_format=Card, output_config={"effort": "medium"})
    card = r.parsed_output
    card.points = [p.strip() for p in card.points][:3]
    if card.highlight not in card.hook:
        card.highlight = ""
    return card


# ──────────────────────────────────────────────
# 카드 이미지 (1080x1350, JPEG)
# ──────────────────────────────────────────────
PAPER, INK, HL, MUTE = (244, 239, 230), (20, 19, 18), (255, 223, 61), (122, 114, 104)
W, H = 1080, 1350
FONTS = {
    "black": "Pretendard-Black.otf", "bold": "Pretendard-Bold.otf", "medium": "Pretendard-Medium.otf",
}


def _font(kind: str, size: int):
    from PIL import ImageFont
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    path = FONT_DIR / FONTS[kind]
    if not path.exists():
        url = f"https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/{FONTS[kind]}"
        urllib.request.urlretrieve(url, path)
    return ImageFont.truetype(str(path), size)


def _wrap(draw, text: str, font, width: int) -> list[str]:
    """한글은 어절 단위로, 너무 긴 어절은 글자 단위로 줄바꿈"""
    lines, cur = [], ""
    for word in [w for w in text.split(" ") if w]:  # NBSP 로 묶은 구절은 한 덩어리로
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=font) <= width:
            cur = trial
            continue
        if cur:
            lines.append(cur)
        cur = word
        while draw.textlength(cur, font=font) > width:
            for i in range(len(cur), 0, -1):
                if draw.textlength(cur[:i], font=font) <= width:
                    lines.append(cur[:i]); cur = cur[i:]; break
    if cur:
        lines.append(cur)
    return lines


def _frame(draw, page: int, label: str, dark: bool = False):
    fg = PAPER if dark else INK
    draw.rectangle((64, 64, W - 64, 68), fill=fg)
    draw.text((64, 92), "세로AI 딸깍스튜디오", font=_font("bold", 30), fill=fg)
    f = _font("bold", 26)
    tw = draw.textlength(label, font=f)
    draw.rounded_rectangle((W - 64 - tw - 36, 84, W - 64, 132), radius=24, outline=fg, width=3)
    draw.text((W - 64 - tw - 18, 92), label, font=f, fill=fg)
    draw.rectangle((64, H - 96, W - 64, H - 93), fill=fg)
    draw.text((64, H - 80), "seroai.xyz", font=_font("medium", 26), fill=MUTE if not dark else (185, 177, 165))
    pg = f"{page} / 3"
    draw.text((W - 64 - draw.textlength(pg, font=_font("medium", 26)), H - 80), pg, font=_font("medium", 26),
              fill=MUTE if not dark else (185, 177, 165))


def render_cards(post: dict, card: Card) -> list[Path]:
    from PIL import Image, ImageDraw
    CARD_DIR.mkdir(parents=True, exist_ok=True)
    label = CATEGORIES[post["category"]]
    out = []

    # 1. 표지
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    _frame(d, 1, label)
    size = 128 if len(card.hook) <= 14 else 112 if len(card.hook) <= 20 else 100
    f = _font("black", size)
    hl = card.highlight.replace(" ", "\u00a0")
    hook = card.hook.replace(card.highlight, hl) if hl else card.hook
    lines = _wrap(d, hook, f, W - 160)
    y = 560 - len(lines) * int(size * 1.2) // 2
    for ln in lines:
        if hl and hl in ln:  # 형광펜
            pre = ln[: ln.index(hl)]
            x0 = 80 + d.textlength(pre, font=f); x1 = x0 + d.textlength(hl, font=f)
            d.rectangle((x0 - 8, y + size * .55, x1 + 8, y + size * 1.02), fill=HL)
        d.text((80, y), ln, font=f, fill=INK)
        y += int(size * 1.2)
    d.text((80, H - 230), "넘겨서 핵심만 보기  →", font=_font("bold", 36), fill=INK)
    out.append(im)

    # 2. 핵심 3가지
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    _frame(d, 2, label)
    d.text((80, 200), "핵심만 3가지", font=_font("black", 76), fill=INK)
    y = 360
    for i, pt in enumerate(card.points, 1):
        fb = _font("bold", 42)
        lines = _wrap(d, pt, fb, W - 160 - 210)
        h = max(190, 70 + len(lines) * 58)
        d.rounded_rectangle((80 + 12, y + 12, W - 80 + 12, y + h + 12), radius=30, fill=INK)
        d.rounded_rectangle((80, y, W - 80, y + h), radius=30, fill=(255, 255, 255), outline=INK, width=6)
        d.text((116, y + 40), f"0{i}", font=_font("black", 64), fill=INK)
        ty = y + (h - len(lines) * 58) // 2
        for ln in lines:
            d.text((240, ty), ln, font=fb, fill=INK); ty += 58
        y += h + 46
    out.append(im)

    # 3. 상담 안내
    im = Image.new("RGB", (W, H), INK); d = ImageDraw.Draw(im)
    _frame(d, 3, label, dark=True)
    f = _font("black", 96)
    d.text((80, 360), "세팅은 저희가.", font=f, fill=PAPER)
    x0 = 80 + d.textlength("사장님은 ", font=f); x1 = x0 + d.textlength("딸깍만.", font=f)
    d.rectangle((x0 - 10, 490, x1 + 10, 600), fill=HL)
    d.text((80, 485), "사장님은 ", font=f, fill=PAPER); d.text((x0, 485), "딸깍만.", font=f, fill=INK)
    fm = _font("medium", 38)
    for k, ln in enumerate(["전체 글은 프로필 링크에서 볼 수 있어요.", "자동화 · 홈페이지 · AI 마케팅 세팅이 필요하면", "무료 상담으로 시작하세요."]):
        d.text((80, 700 + k * 62), ln, font=fm, fill=(214, 207, 196))
    d.rounded_rectangle((80, 940, 80 + 560, 1040), radius=24, fill=HL)
    d.text((118, 962), "무료 상담  seroai.xyz", font=_font("black", 44), fill=INK)
    out.append(im)

    paths = []
    for i, im in enumerate(out, 1):
        p = CARD_DIR / f"{post['slug']}-{i}.jpg"
        im.save(p, "JPEG", quality=90, optimize=True)
        paths.append(p)
    return paths


# ──────────────────────────────────────────────
# 공개 주소 만들기 (저장소에 커밋 → raw 주소)
# ──────────────────────────────────────────────
def _git(*args) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True)


def publish_files(paths: list[Path], message: str) -> list[str]:
    if os.environ.get("GITHUB_ACTIONS") == "true":
        _git("config", "user.name", "github-actions[bot]")
        _git("config", "user.email", "github-actions[bot]@users.noreply.github.com")
        _git("add", "-f", *[str(p) for p in paths])
        _git("commit", "-m", message)
        for _ in range(3):
            _git("pull", "--rebase", "origin", "main")
            if _git("push", "origin", "HEAD:main").returncode == 0:
                break
            time.sleep(5)
    urls = [f"https://raw.githubusercontent.com/{REPO}/main/{p.relative_to(ROOT).as_posix()}" for p in paths]
    # raw 주소가 열릴 때까지 잠깐 기다린다
    for u in urls:
        for _ in range(20):
            try:
                with urllib.request.urlopen(urllib.request.Request(u, method="HEAD"), timeout=20) as r:
                    if r.status == 200:
                        break
            except Exception:
                pass
            time.sleep(6)
    return urls


# ──────────────────────────────────────────────
# 하루 실행
# ──────────────────────────────────────────────
def load_history() -> dict:
    if HISTORY_FILE.exists():
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    return {"carousels": [], "reels": [], "log": []}


def save_history(h: dict) -> None:
    h["log"] = h.get("log", [])[-200:]
    HISTORY_FILE.write_text(json.dumps(h, ensure_ascii=False, indent=2), encoding="utf-8")


def _today_count(h: dict, kind: str) -> int:
    today = datetime.now(KST).strftime("%Y-%m-%d")
    return sum(1 for e in h.get("log", []) if e.get("kind") == kind and e.get("date") == today and e.get("ok"))


def daily(dry_run: bool = False) -> int:
    if not dry_run and (not TOKEN or not USER_ID):
        print("[!] INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID 가 없어 건너뜁니다.")
        return 0
    h = load_history()
    today = datetime.now(KST).strftime("%Y-%m-%d")
    failures = 0
    if not dry_run:
        check()
        if datetime.now(KST).weekday() == 0:  # 월요일마다 토큰 연장
            refresh_token()

    # 1) 블로그 카드뉴스
    if _today_count(h, "carousel") < DAILY_CAROUSELS:
        post = pick_post(set(h.get("carousels", [])))
        if post:
            print(f"\n[카드뉴스] {post['title']}")
            try:
                card = make_card_copy(post)
                paths = render_cards(post, card)
                print(f"  카드 {len(paths)}장: {', '.join(p.name for p in paths)}")
                print(f"  캡션:\n{card.caption}")
                if not dry_run:
                    urls = publish_files(paths, f"chore: 인스타 카드뉴스 이미지 {post['slug']}")
                    media_id = post_carousel(urls, card.caption)
                    print(f"  [OK] 게시 완료 (media {media_id})")
                    h.setdefault("carousels", []).append(post["slug"])
                    h["log"].append({"date": today, "kind": "carousel", "slug": post["slug"], "ok": True, "id": media_id})
            except Exception as e:
                failures += 1
                print(f"  [!] 카드뉴스 실패: {e}")
                h["log"].append({"date": today, "kind": "carousel", "slug": post["slug"], "ok": False, "error": str(e)[:300]})
        else:
            print("\n[카드뉴스] 새로 올릴 글이 없습니다.")

    # 2) 릴스 대기열
    if _today_count(h, "reel") < DAILY_REELS and REELS_DIR.exists():
        done = set(h.get("reels", []))
        queue = [p for p in sorted(REELS_DIR.glob("*.mp4")) if p.name not in done]
        if queue:
            video = queue[0]
            cap_file = video.with_suffix(".txt")
            caption = cap_file.read_text(encoding="utf-8").strip() if cap_file.exists() else DEFAULT_REEL_CAPTION
            print(f"\n[릴스] {video.name} ({video.stat().st_size // 1024 // 1024}MB) · 대기 {len(queue)}개")
            if not dry_run:
                try:
                    media_id = post_reel(video, caption)
                    print(f"  [OK] 게시 완료 (media {media_id})")
                    h.setdefault("reels", []).append(video.name)
                    h["log"].append({"date": today, "kind": "reel", "file": video.name, "ok": True, "id": media_id})
                except Exception as e:
                    failures += 1
                    print(f"  [!] 릴스 실패: {e}")
                    h["log"].append({"date": today, "kind": "reel", "file": video.name, "ok": False, "error": str(e)[:300]})
        else:
            print("\n[릴스] 대기열이 비어 있습니다 (social/reels/ 에 .mp4 를 넣으세요).")

    if not dry_run:
        save_history(h)
    return failures


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="인스타그램 자동 발행")
    sub = ap.add_subparsers(dest="cmd", required=True)
    d = sub.add_parser("daily"); d.add_argument("--dry-run", action="store_true")
    c = sub.add_parser("card"); c.add_argument("slug")
    sub.add_parser("check")
    a = ap.parse_args()
    if a.cmd == "daily":
        sys.exit(1 if daily(a.dry_run) else 0)
    elif a.cmd == "check":
        check()
    else:
        f = POSTS_DIR / f"{a.slug}.mdx"
        meta = _frontmatter(f)
        post = {"slug": f.stem, "title": meta.get("title", ""), "description": meta.get("description", ""),
                "tldr": meta.get("tldr", ""), "category": meta.get("category", "ai-tools"), "body": meta.get("body", "")[:6000],
                "url": f"{SITE_URL}/posts/{f.stem}"}
        card = make_card_copy(post) if os.environ.get("ANTHROPIC_API_KEY") else Card(
            hook=post["title"][:28], highlight="", points=["(미리보기) 핵심 1", "(미리보기) 핵심 2", "(미리보기) 핵심 3"], caption="")
        for p in render_cards(post, card):
            print(p)
