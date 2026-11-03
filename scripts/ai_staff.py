"""
AI 직원 루프 — 세로AI 딸깍스튜디오의 스레드(Threads) 계정을 AI 직원이 운영한다.

  owner    사장(텔레그램)이 보낸 지시를 읽어 기억한다. 사장 채팅방에서 온 메시지만 받는다.
  diary    실제 기록(발행·검수 탈락·배포·인스타 게시·문의 수)으로 'AI 직원 일지'를 스레드에 쓴다. 하루 최대 3개
  replies  내 스레드 글에 달린 댓글에 답한다. 결제·환불·개인 상담은 답하지 않고 사장에게 넘긴다
  report   오늘 한 일을 사장 텔레그램으로 보고한다

  python ai_staff.py tick            # owner → replies (30분마다)
  python ai_staff.py diary           # 일지 1개 (하루 몇 번)
  python ai_staff.py report          # 하루 보고
  --dry-run 을 붙이면 게시하지 않고 출력만

원칙: AI라는 걸 숨기지 않는다. 기록에 없는 숫자·성과·후기를 만들지 않는다. 매출·순위를 보장하지 않는다.
비밀번호·결제·개인정보는 다루지 않는다. 같은 문장을 반복해 올리지 않는다.

환경 변수 (GitHub Secrets)
  THREADS_ACCESS_TOKEN, THREADS_USER_ID    스레드 API (threads_basic, threads_content_publish,
                                           threads_read_replies, threads_manage_replies)
  TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID     사장 연락용 봇 (사장 채팅방 ID만 지시로 인정)
  ANTHROPIC_API_KEY
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
STATE = Path(__file__).parent / "ai_staff_state.json"
KST = timezone(timedelta(hours=9))
TH_TOKEN = os.environ.get("THREADS_ACCESS_TOKEN", "").strip()
TH_USER = os.environ.get("THREADS_USER_ID", "").strip()
TG_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
TG_CHAT = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
DIARY_PER_DAY = 3
REPLIES_PER_RUN = 8

PERSONA = """너는 '세로AI 딸깍스튜디오'의 AI 직원이다. 사장님은 사람이고, 너는 AI라는 걸 숨기지 않는다.
딸깍스튜디오는 본업이 바쁜 사장님 대신 AI 자동화·홈페이지·AI 마케팅을 세팅해 주는 1인 대행사이고,
너는 그 회사의 블로그 자동 발행, 인스타 카드뉴스·릴스, 스레드를 실제로 돌리고 있다. 사이트는 seroai.xyz.
말투: 짧고 솔직한 반말 일기체(일지) / 댓글은 존댓말. 자랑보다 실패·배운 점·숫자를 담백하게.
금지: 기록에 없는 숫자·성과·매출·고객 후기 만들기, 수익·순위 보장, 다른 사람 비방, 정치·사건 이야기,
본문에 링크 넣기(링크는 필요하면 '프로필 링크'라고만), 같은 문장 반복, 해시태그 3개 초과."""


# ──────────────────────────────────────────────
# 상태
# ──────────────────────────────────────────────
def load_state() -> dict:
    if STATE.exists():
        return json.loads(STATE.read_text(encoding="utf-8"))
    return {"owner_notes": [], "tg_offset": 0, "diary": [], "replied": [], "escalated": [], "log": []}


def save_state(s: dict) -> None:
    s["owner_notes"] = s["owner_notes"][-30:]
    s["diary"] = s["diary"][-60:]
    s["replied"] = s["replied"][-500:]
    s["escalated"] = s["escalated"][-200:]
    s["log"] = s["log"][-300:]
    STATE.write_text(json.dumps(s, ensure_ascii=False, indent=1), encoding="utf-8")


def today() -> str:
    return datetime.now(KST).strftime("%Y-%m-%d")


# ──────────────────────────────────────────────
# 텔레그램 (사장 채널)
# ──────────────────────────────────────────────
def tg(method: str, params: dict | None = None) -> dict:
    if not TG_TOKEN:
        return {}
    data = urllib.parse.urlencode(params or {}).encode()
    try:
        with urllib.request.urlopen(f"https://api.telegram.org/bot{TG_TOKEN}/{method}", data=data, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  [텔레그램] {method} 실패: {str(e).replace(TG_TOKEN, '***')[:160]}")
        return {}


def tell_owner(text: str, dry: bool = False) -> None:
    print(f"  → 사장 보고: {text[:120]}")
    if not dry and TG_CHAT:
        tg("sendMessage", {"chat_id": TG_CHAT, "text": text[:3900]})


def read_owner(s: dict) -> list[str]:
    """사장 채팅방에서 온 새 메시지만 지시로 저장한다 (다른 사람이 봇에 보낸 건 무시)"""
    res = tg("getUpdates", {"offset": s.get("tg_offset", 0), "timeout": 0})
    new = []
    for u in res.get("result", []):
        s["tg_offset"] = u["update_id"] + 1
        msg = u.get("message") or {}
        if str(msg.get("chat", {}).get("id")) != TG_CHAT or not msg.get("text"):
            continue
        text = msg["text"].strip()
        if text.startswith("/"):
            continue
        s["owner_notes"].append({"at": datetime.now(KST).isoformat(timespec="minutes"), "text": text[:500]})
        new.append(text)
    return new


def owner_block(s: dict) -> str:
    notes = s.get("owner_notes", [])[-8:]
    if not notes:
        return "(사장님 지시 없음)"
    return "\n".join(f"- [{n['at']}] {n['text']}" for n in notes)


# ──────────────────────────────────────────────
# 스레드 API
# ──────────────────────────────────────────────
def th(method: str, path: str, params: dict | None = None) -> dict:
    params = dict(params or {})
    params["access_token"] = TH_TOKEN
    url = f"https://graph.threads.net/v1.0/{path}"
    data = None
    if method == "GET":
        url += "?" + urllib.parse.urlencode(params)
    else:
        data = urllib.parse.urlencode(params).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, method=method), timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Threads {path} {e.code}: {e.read().decode('utf-8', 'replace').replace(TH_TOKEN, '***')[:300]}") from None


def th_post(text: str, reply_to: str | None = None) -> str:
    params = {"media_type": "TEXT", "text": text}
    if reply_to:
        params["reply_to_id"] = reply_to
    c = th("POST", f"{TH_USER}/threads", params)
    time.sleep(5)
    return th("POST", f"{TH_USER}/threads_publish", {"creation_id": c["id"]})["id"]


# ──────────────────────────────────────────────
# 실제 기록 모으기 (일지 재료)
# ──────────────────────────────────────────────
def facts(hours: int = 24) -> dict:
    since = datetime.now(KST) - timedelta(hours=hours)
    f = {"window_hours": hours}
    # 블로그 발행·탈락 (파이프라인 로그)
    pub, rej, reasons = [], 0, []
    for p in sorted((Path(__file__).parent / "pipeline_log").glob("*.jsonl"))[-2:]:
        for line in p.read_text(encoding="utf-8").splitlines():
            try:
                e = json.loads(line)
                if datetime.fromisoformat(e["ts"]) < since:
                    continue
            except Exception:
                continue
            res, d = str(e.get("result", "")), e.get("detail") or {}
            if e.get("step") == "S9":  # 발행 단계: 통과·파일만 = 발행, 탈락 = 검수에서 떨어짐
                if res in ("통과", "파일만") and d.get("slug"):
                    pub.append(d["slug"])
                elif res == "탈락":
                    rej += 1
                    if d.get("reason"):
                        reasons.append(str(d["reason"])[:80])
    f["blog_published_titles"] = pub[:6]
    f["blog_rejected_posts"] = rej
    f["reject_reasons"] = reasons[:3]
    # 새 글 커밋 수 (로그가 비었을 때 보조)
    out = subprocess.run(["git", "log", f"--since={hours} hours ago", "--format=%s"], cwd=ROOT,
                         capture_output=True, text=True).stdout.splitlines()
    f["auto_publish_commits"] = sum(1 for x in out if x.startswith("feat: 자동 발행"))
    f["site_changes"] = [x for x in out if not x.startswith(("feat: 자동 발행", "chore:", "Merge"))][:5]
    # 인스타
    ig = Path(__file__).parent / "instagram_history.json"
    if ig.exists():
        h = json.loads(ig.read_text(encoding="utf-8"))
        f["instagram_today"] = [e for e in h.get("log", []) if e.get("date") == today()]
    # 스레드 반응 (내 최근 글)
    if TH_TOKEN and TH_USER:
        try:
            posts = th("GET", f"{TH_USER}/threads", {"fields": "id,text,timestamp", "limit": 5}).get("data", [])
            stats = []
            for p in posts[:5]:
                try:
                    ins = th("GET", f"{p['id']}/insights", {"metric": "views,likes,replies,reposts"}).get("data", [])
                    stats.append({"text": (p.get("text") or "")[:40],
                                  **{m["name"]: (m.get("values") or [{}])[0].get("value") for m in ins}})
                except RuntimeError:
                    pass
            f["threads_recent"] = stats
        except RuntimeError as e:
            f["threads_error"] = str(e)[:120]
    return f


# ──────────────────────────────────────────────
# 일지
# ──────────────────────────────────────────────
class Diary(BaseModel):
    text: str = Field(description="스레드 본문. 450자 이내, 첫 줄이 후킹. 기록에 있는 숫자만")
    used_facts: list[str] = Field(description="본문에 쓴 숫자·사실이 facts 의 어느 항목에서 왔는지")


DIARY_PROMPT = """{persona}

오늘 기록(이것만 사실로 쓸 수 있다):
{facts}

사장님 최근 지시:
{owner}

최근에 내가 쓴 일지 (반복 금지):
{recent}

AI 직원 일지 하나를 써라.
- 형식 예: '오늘 블로그 글 N편 중 M편이 검수에서 떨어졌다. 이유는…' 처럼 실제 일과 배운 점 1개
- 판매·홍보는 3번에 1번만, 그것도 마지막 한 줄로만 ('자동화가 필요하면 프로필 링크')
- 기록에 없는 건 쓰지 말고, 쓸 게 적으면 짧게"""


def diary(dry: bool = False) -> None:
    s = load_state()
    if sum(1 for d in s["diary"] if d["date"] == today()) >= DIARY_PER_DAY:
        print("오늘 일지 한도 도달")
        return
    f = facts()
    recent = "\n".join(f"- {d['text'][:80]}" for d in s["diary"][-6:]) or "(없음)"
    r = claude_client.client().messages.parse(
        model=claude_client.MODEL, max_tokens=3000, output_format=Diary, output_config={"effort": "medium"},
        messages=[{"role": "user", "content": DIARY_PROMPT.format(
            persona=PERSONA, facts=json.dumps(f, ensure_ascii=False, indent=1), owner=owner_block(s), recent=recent)}])
    d = r.parsed_output
    text = re.sub(r"https?://\S+", "", d.text).strip()[:480]
    print(f"[일지]\n{text}\n  근거: {d.used_facts}")
    if dry or not (TH_TOKEN and TH_USER):
        if not dry:
            print("  (스레드 토큰이 없어 게시하지 않음)")
        return
    pid = th_post(text)
    s["diary"].append({"date": today(), "id": pid, "text": text})
    s["log"].append({"at": datetime.now(KST).isoformat(timespec="minutes"), "kind": "diary", "id": pid})
    save_state(s)
    print(f"  [OK] 게시 {pid}")


# ──────────────────────────────────────────────
# 댓글
# ──────────────────────────────────────────────
class Reply(BaseModel):
    action: str = Field(description="reply | skip | owner (결제·환불·가격 협상·개인 상담·불만·법적 문제·판단이 어려우면 owner)")
    text: str = Field(description="답글 (action=reply 일 때). 200자 이내 존댓말. AI 직원임을 숨기지 않음")
    note: str = Field(description="owner 일 때 사장님께 전할 한 줄 요약")


REPLY_PROMPT = """{persona}

내 글: {post}
댓글 (@{user}): {comment}

사장님 최근 지시:
{owner}

이 댓글에 어떻게 할지 정해라.
- 질문·공감·의견에는 짧게 답한다. 모르는 건 모른다고, 사장님께 확인하겠다고
- 결제·환불·가격 협상·개인 상담 요청·불만·법적 문제는 답하지 말고 owner
- 스팸·광고·욕설은 skip
- 상대 개인정보를 묻지 않는다. 링크를 달지 않는다"""


def replies(s: dict, dry: bool = False) -> int:
    if not (TH_TOKEN and TH_USER):
        print("  (스레드 토큰 없음: 댓글 건너뜀)")
        return 0
    done = set(s["replied"]) | set(s["escalated"])
    posts = th("GET", f"{TH_USER}/threads", {"fields": "id,text", "limit": 10}).get("data", [])
    n = 0
    for p in posts:
        try:
            items = th("GET", f"{p['id']}/replies", {"fields": "id,text,username,timestamp", "reverse": "false"}).get("data", [])
        except RuntimeError as e:
            print(f"  [!] 댓글 읽기 실패: {e}")
            continue
        for c in items:
            if n >= REPLIES_PER_RUN or c["id"] in done or not c.get("text"):
                continue
            if c.get("username") and c["username"] == s.get("my_username"):
                continue
            r = claude_client.client().messages.parse(
                model=claude_client.MODEL, max_tokens=1500, output_format=Reply, output_config={"effort": "low"},
                messages=[{"role": "user", "content": REPLY_PROMPT.format(
                    persona=PERSONA, post=(p.get("text") or "")[:300], user=c.get("username", "?"),
                    comment=c["text"][:500], owner=owner_block(s))}])
            dec = r.parsed_output
            print(f"  @{c.get('username')}: {c['text'][:60]!r} → {dec.action}")
            if dec.action == "reply" and dec.text.strip():
                text = re.sub(r"https?://\S+", "", dec.text).strip()[:300]
                if not dry:
                    th_post(text, reply_to=c["id"])
                    time.sleep(3)
                s["replied"].append(c["id"])
                n += 1
            elif dec.action == "owner":
                tell_owner(f"[댓글 확인 필요] @{c.get('username')}: {c['text'][:200]}\n→ {dec.note}", dry)
                s["escalated"].append(c["id"])
            else:
                s["replied"].append(c["id"])
    return n


# ──────────────────────────────────────────────
# 실행
# ──────────────────────────────────────────────
def tick(dry: bool = False) -> None:
    s = load_state()
    if TH_TOKEN and TH_USER and not s.get("my_username"):
        try:
            s["my_username"] = th("GET", "me", {"fields": "username"}).get("username")
        except RuntimeError:
            pass
    new = read_owner(s)
    if new:
        print(f"사장님 지시 {len(new)}개 받음")
        tell_owner(f"지시 받았어요 ({len(new)}개). 다음 일지·댓글부터 반영할게요.", dry)
    n = replies(s, dry)
    print(f"답글 {n}개")
    if not dry:
        save_state(s)


def report(dry: bool = False) -> None:
    s, f = load_state(), facts()
    lines = [f"[AI 직원 하루 보고 {today()}]",
             f"블로그: 발행 {len(f['blog_published_titles']) or f['auto_publish_commits']}편, 검수 탈락 {f['blog_rejected_posts']}편",
             f"인스타: {len(f.get('instagram_today', []))}건",
             f"스레드 일지: {sum(1 for d in s['diary'] if d['date'] == today())}개, 답글 누적 {len(s['replied'])}개",
             f"확인 필요 댓글: {sum(1 for e in s['escalated'])}건 (텔레그램으로 보냄)",
             "", "지시는 이 채팅방에 그냥 적어 주세요. 다음 실행 때 읽어요."]
    tell_owner("\n".join(lines), dry)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "tick"
    dry = "--dry-run" in sys.argv
    if cmd == "facts":
        print(json.dumps(facts(), ensure_ascii=False, indent=1))
    else:
        {"tick": tick, "diary": diary, "report": report}[cmd](dry)
