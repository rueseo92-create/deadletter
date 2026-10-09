"""③ 대본 생성 (2·4강).

구조: 결말(후킹) → 설명 → 과정 → 개인 의견 (+ 구독자 1,000명 전까지 CTA).
줄마다 효과음 태그와 배경 태그를 붙여 렌더 단계가 그대로 쓰게 한다.
"""
import json
import re
from typing import Literal

from pydantic import BaseModel, Field

from . import db, ideas, learn, llm, research

SYSTEM = """너는 한국어 쇼츠 '썰' 채널의 대본 작가다.

규칙:
- 반드시 '결말(후킹) → 설명 → 과정 → 개인 의견' 순서. 첫 줄은 결과나 가장 센 순간을 먼저 던진다.
- 한 줄은 자막 한 화면 분량(공백 포함 8~22자)으로 끊는다. 말하듯 자연스럽게.
- 실존 인물·기업·학교·지역의 실명, 연락처, 특정 가능한 정보를 넣지 않는다.
- 사실인 것처럼 단정하는 뉴스·의학·법률 주장 금지. 이건 '썰'이다.
- 입력 소재의 문장을 그대로 옮기지 말고 새로 쓴다.
- 혐오·성적·폭력 묘사, 특정 집단 비하 금지.
- risk_notes 에는 사람이 검수할 때 확인해야 할 점(실존 인물로 오해될 여지, 민감 소재 등)을 적는다. 없으면 빈 배열."""


# 흔한 성 + 이름 1~2자 + 호칭. 오탐이 있어도 사람 검수용 경고일 뿐이다.
NAME_PATTERN = (r"(?<![가-힣])(김|이|박|최|정|강|조|윤|장|임|한|오|서|신|권|황|안|송|류|전|홍)"
                r"[가-힣]{1,2}\s?(씨|님|선배|부장|과장|대리|팀장)")


class Line(BaseModel):
    section: Literal["hook", "explain", "process", "opinion", "cta"]
    text: str
    sfx: str = Field(description="효과음 태그")
    bg: str = Field(description="배경 영상 태그")


class Script(BaseModel):
    title: str = Field(description="유튜브 제목, 40자 이내, 해시태그 없이")
    frame_title: str = Field(description="화면 상단 고정 제목, 2줄 이내, 줄바꿈은 \\n")
    hook_type: str = Field(description="후킹 유형, 짧은 영문 snake_case")
    lines: list[Line]
    description: str
    tags: list[str]
    risk_notes: list[str]


def _check(cfg: dict, s: Script) -> list[str]:
    flags = list(s.risk_notes)
    total = sum(len(l.text) for l in s.lines if l.section != "cta")
    sc = cfg["script"]
    if not sc["min_chars"] <= total <= sc["max_chars"]:
        flags.append(f"길이 {total}자 (권장 {sc['min_chars']}~{sc['max_chars']})")
    if s.lines and s.lines[0].section != "hook":
        flags.append("첫 줄이 hook 이 아님")
    body = " ".join(l.text for l in s.lines)
    for t in sc["banned_terms"]:
        if t in body:
            flags.append(f"금지어 포함: {t}")
    if re.search(r"\d{2,3}-\d{3,4}-\d{4}", body):
        flags.append("전화번호 형태 포함")
    if re.search(NAME_PATTERN, body):
        flags.append("이름+호칭 패턴 - 가명인지 확인")
    for l in s.lines:
        if l.sfx not in cfg["sfx_tags"]:
            l.sfx = "none"
        if l.bg not in cfg["bg_tags"]:
            l.bg = cfg["bg_tags"][0]
    return flags


def write(cfg: dict, idea) -> int:
    sc = cfg["script"]
    cta = f"마지막 줄은 section=cta 로 '{sc['cta_line']}' 를 자연스럽게." if sc.get("use_cta") else "CTA 줄은 넣지 않는다."
    hooks = learn.top_weights("hook_type")
    hook_txt = ", ".join(f"{k}({v:.2f})" for k, v in hooks[:5]) or "데이터 없음 - 자유롭게"
    prompt = (
        f"채널: {cfg['channel_name']} / 니치: {cfg['niche']}\n"
        f"소재 제목: {idea['title']}\n소재 요지: {idea['summary']}\n카테고리: {idea['category'] or '미정'}\n\n"
        f"형식 인사이트:\n{research.load_insights() or '(없음)'}\n\n"
        f"성과 좋은 후킹 유형(점수 높을수록 우선, 가끔 새 유형도 시도): {hook_txt}\n"
        f"본문(CTA 제외) 총 {sc['min_chars']}~{sc['max_chars']}자. {cta}\n"
        f"효과음 태그는 {cfg['sfx_tags']} 중에서, 배경 태그는 {cfg['bg_tags']} 중에서 고른다. "
        "효과음은 반전·강조 지점 2~4곳에만, 나머지는 none."
    )
    s = llm.parse(sc["model"], SYSTEM, prompt, Script, effort="high")
    flags = _check(cfg, s)
    tags = list(dict.fromkeys(cfg["upload"]["default_tags"] + s.tags))[:15]
    with db.connect() as c:
        cur = c.execute(
            """INSERT INTO videos (idea_id, status, title, description, tags, category, hook_type,
                                   script_json, flags, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (idea["id"], "scripted", s.title[:95], s.description,
             json.dumps(tags, ensure_ascii=False), idea["category"], s.hook_type,
             s.model_dump_json(), json.dumps(flags, ensure_ascii=False), db.now(), db.now()))
        c.execute("UPDATE ideas SET status='used' WHERE id=?", (idea["id"],))
        return cur.lastrowid


def run(cfg: dict, count: int) -> list[int]:
    out = []
    for idea in ideas.next_ideas(cfg, count):
        try:
            out.append(write(cfg, idea))
        except RuntimeError as e:
            print(f"  ! 소재 {idea['id']} 대본 실패: {e}")
            with db.connect() as c:
                c.execute("UPDATE ideas SET status='skipped' WHERE id=?", (idea["id"],))
    return out


def load(row) -> Script:
    return Script.model_validate_json(row["script_json"])
