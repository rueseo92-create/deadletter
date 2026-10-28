"""원고 생성: 메모(사실) + 사진 + 내 말투 + 키워드 → 제목 후보·본문·태그.

메모와 사진에 없는 사실(가격, 메뉴, 맛 평가, 영업시간 등)은 쓰지 않는다.
"""
import json
import re
import sys
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from . import keywords, llm, memo, photos, style

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import title_rules  # noqa: E402

SYSTEM = """너는 이 네이버 블로그 주인이 직접 다녀온 곳의 글을 대신 정리해 주는 편집자다.
주인이 준 메모와 사진에 있는 사실만 쓴다. 이 글은 주인의 실제 경험이다.

반드시 지킬 것:
- 메모·사진에 없는 가격, 메뉴, 맛 평가, 영업시간, 위치 정보를 지어내지 않는다. 모르면 쓰지 않는다.
- 사진에 보이는 것은 '보이는 그대로'만 묘사한다 (예: 튀김옷이 두껍게 보임). 맛은 메모에 있을 때만.
- 주인의 말투 규칙과 예시 문단을 따른다. 짧은 줄과 줄바꿈 습관까지 맞춘다.
- 세부 키워드는 제목 앞부분과 본문 첫 두 줄 안에 자연스럽게 넣는다. 메인 키워드는 도입부에 한 번.
- 추가 키워드는 메모 내용과 맞는 것만 본문에 자연스럽게 쓴다. 억지로 반복하지 않는다.
- 사진은 촬영 순서대로 번호가 붙어 있다. 글 흐름에 맞게 사진 블록을 배치하고, 가능하면 모든 사진을 한 번씩 쓴다.
- 제목: 메인/세부 키워드 + 수식어. 수식어는 메모에 있는 구체적인 특징(실제 먹은 메뉴, 실제 상황, 실제 장단점)으로 만든다.
  과장("무조건", "역대급", "인생 맛집"), 본문에 없는 숫자, 상위 글 제목 베끼기 금지. 후보 3개는 서로 다른 수식어로.
- unverified 에는 본문 중 메모·사진으로 확인되지 않는 문장이 있다면 그대로 적는다. 없으면 빈 배열."""


class Block(BaseModel):
    kind: Literal["text", "photo"]
    text: str = Field(default="", description="kind=text 일 때 본문. 줄바꿈 포함")
    photo: int = Field(default=0, description="kind=photo 일 때 사진 번호(1부터)")


class Draft(BaseModel):
    title: str
    title_candidates: list[str]
    blocks: list[Block]
    place_info: list[str] = Field(description="메모에 있는 가게 정보만 '항목: 값' 형식")
    tags: list[str]
    photo_notes: list[str] = Field(description="사진별로 보이는 것 한 줄씩, 사진 순서대로")
    unverified: list[str]


def _body_text(d: Draft) -> str:
    return "\n".join(b.text if b.kind == "text" else f"[사진 {b.photo}]" for b in d.blocks)


def _price_issues(body: str, memo_text: str) -> list[dict]:
    """본문 가격·숫자 중 메모에 없는 것."""
    memo_nums = {re.sub(r"[,\s]", "", n) for n in re.findall(r"\d[\d,]*", memo_text)}
    out = []
    for m in re.finditer(r"(\d[\d,]*)\s*(원|만원|천원|분|시)", body):
        if re.sub(r"[,\s]", "", m.group(1)) not in memo_nums:
            out.append({"severity": "error", "issue": f"메모에 없는 숫자 '{m.group(0)}'"})
    return out


def make(cfg: dict, folder: Path, out_root: Path) -> dict:
    memo_path = folder / "memo.txt"
    if not memo_path.exists():
        raise SystemExit(f"{folder} 에 memo.txt 가 없습니다. inbox/_template 을 복사해서 쓰세요.")
    facts = memo.parse(memo_path)
    lack = memo.missing(facts)
    if lack:
        raise SystemExit(f"메모에 꼭 필요한 항목이 비었습니다: {', '.join(lack)}")
    style_md, examples = style.load()
    if not style_md:
        print("  ! 말투 규칙이 없습니다. 먼저 `python -m naver_blog learn-style` 을 실행하면 내 말투로 써집니다.")

    pics = photos.collect(folder, cfg["max_photos"])
    kw = keywords.pick(facts)
    out_dir = out_root / folder.name
    exported = photos.export(pics, out_dir / "photos", kw["keyword"], cfg["photo_long_edge"], cfg["photo_quality"])
    sponsor = memo.sponsored(facts)
    memo_text = "\n".join(f"{k}: {v}" for k, v in facts.items() if v)

    content = []
    for i, p in enumerate(exported, 1):
        content += [{"type": "text", "text": f"[사진 {i}]"}, photos.vision_block(p)]
    content.append({"type": "text", "text": (
        f"[주인 메모 - 유일한 사실 출처]\n{memo_text}\n\n"
        f"[키워드]\n메인: {kw['main']}\n세부: {kw['keyword']}\n추가(맞는 것만): {', '.join(kw['extra'])}\n\n"
        f"[현재 상위 글 제목 - 베끼지 말 것]\n" + "\n".join(f"- {t}" for t in kw["serp_titles"][:8]) + "\n\n"
        f"[주인 말투 규칙]\n{style_md or '(없음 - 편한 반말체, 짧은 줄)'}\n\n"
        f"[주인이 실제로 쓴 글 예시]\n{examples or '(없음)'}\n\n"
        f"본문 분량은 공백 제외 {cfg['body_chars'][0]}~{cfg['body_chars'][1]}자. 태그는 {cfg['tags_max']}개 이하."
    )})
    d = llm.parse(cfg["model"], SYSTEM, content, Draft, effort="high")

    body = _body_text(d)
    title, t_issues, checked = title_rules.choose_title(
        [d.title, *d.title_candidates], kw["keyword"], "", body + "\n" + memo_text,
        kw["serp_titles"], intent="visit", allow_experience=True)
    # 선택된 제목 이후 후보까지 모두 검사 (미리보기에 통과 후보를 전부 보여 주기 위해)
    seen = {t for t, _ in checked}
    for t in [d.title, *d.title_candidates]:
        if t and t not in seen:
            seen.add(t)
            checked.append((t, title_rules.check_title(t, kw["keyword"], "", body + "\n" + memo_text,
                                                       kw["serp_titles"], allow_experience=True)))
    issues = t_issues + _price_issues(body, memo_text)
    issues += [{"severity": "warn", "issue": f"메모로 확인 안 되는 문장: {u}"} for u in d.unverified]
    if not title_rules.contains_keyword(body[:200], kw["keyword"]):
        issues.append({"severity": "warn", "issue": "세부 키워드가 본문 첫 부분에 없음"})
    used = {b.photo for b in d.blocks if b.kind == "photo"}
    unused = [i for i in range(1, len(exported) + 1) if i not in used]
    if unused:
        issues.append({"severity": "warn", "issue": f"본문에 안 쓴 사진: {unused}"})

    disclosure = (f"이 글은 {sponsor}을(를) 제공받아 작성했습니다. (경제적 이해관계 표시)" if sponsor else "")
    result = {
        "folder": folder.name,
        "title": title,
        # 규칙 검사를 통과한 후보만 보여 준다
        "title_options": list(dict.fromkeys([title] + [t for t, iss in checked
                                                       if not any(i["severity"] == "error" for i in iss)])),
        "title_rejected": [{"title": t, "why": [i["issue"] for i in iss if i["severity"] == "error"]}
                           for t, iss in checked if any(i["severity"] == "error" for i in iss)],
        "keywords": kw,
        "disclosure": disclosure,
        "blocks": [b.model_dump() for b in d.blocks],
        "place_info": d.place_info,
        "tags": list(dict.fromkeys(t.lstrip("#") for t in d.tags))[: cfg["tags_max"]],
        "photos": [p.name for p in exported],
        "photo_notes": d.photo_notes,
        "issues": issues,
        "facts": facts,
    }
    (out_dir / "draft.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result
