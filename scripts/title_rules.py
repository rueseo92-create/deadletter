"""
title_rules.py - 제목 4단계 공식 검사 + 주의 표현·위험 분야 점검

제목 = 메인 키워드 + 세부 키워드 + 수식어
수식어는 실제 자료에 근거가 있고, 본문에서 설명할 수 있고, 과장이나 없는 경험이 아니어야 한다.

severity
  error: 그 제목·키워드는 쓰지 않는다
  warn:  쓸 수는 있지만 QC 로그에 남긴다
"""

import re
from datetime import datetime
from difflib import SequenceMatcher

TITLE_MAX = 50          # 넘으면 error (검색 결과에서 잘림)
TITLE_SOFT_MAX = 40     # 넘으면 warn
KEYWORD_FRONT = 20      # 세부 키워드가 이 글자 수 안에서 시작해야 함

# 없는 경험을 만든 표현 (AI 작성 글이므로 1인칭 체험 주장 금지)
FAKE_EXPERIENCE = [
    r"직접\s*(써|해|가|먹|받아|신청해|가입해)\s*(보니|봤)",
    r"내돈내산", r"(솔직|실제|리얼)\s*후기", r"\d+\s*(개월|주|일)\s*(써|사용해|해)\s*보니",
    r"제가\s*(직접|실제로)", r"(체험|사용)\s*해\s*본\s*결과",
]

# 과장·낚시 표현
HYPE_ERROR = [
    r"무조건", r"100\s*%", r"모르면\s*손해", r"충격", r"역대급", r"대박", r"기적",
    r"단\s*하루", r"이것만\s*하면", r"누구나\s*(승인|가능|합격)", r"무료\s*상담",
]
HYPE_WARN = [r"완벽", r"인생\s*맛집", r"최고의?", r"필독", r"꿀팁\s*대방출", r"끝판왕", r"1\s*위"]

# 위험 분야 (돈나나 위험 키워드표 기준). keyword/카테고리로 분야를 판정하고 표현을 점검한다.
RISK_FIELDS = {
    "health_claim": {
        "label": "건강·건강기능식품",
        "level": "yellow",
        "match": {"categories": ["health"],
                  "keywords": ["영양제", "건강기능식품", "유산균", "비타민", "다이어트", "탈모", "혈압",
                               "혈당", "통증", "질환", "증상"]},
        "error": [r"완치", r"치료\s*(효과|된다|됩니다|가능)", r"효과\s*(보장|100)", r"부작용\s*(없|0)",
                  r"\d+\s*(kg|키로)\s*(감량|빠)", r"약\s*없이\s*(낫|치료)", r"(질병|암)\s*예방\s*효과"],
        "guide": "식약처가 인정한 기능 범위 안에서만 쓰고, 치료·감량·예방 효과를 단정하지 말 것. "
                 "개인차가 있다는 점과 전문의 상담 권고를 넣을 것.",
    },
    "finance": {
        "label": "금융·대출",
        "level": "yellow",
        "match": {"categories": ["finance", "realestate"],
                  "keywords": ["대출", "금리", "적금", "예금", "투자", "수익", "주식", "ETF", "카드", "청약"]},
        "error": [r"(무조건|100\s*%|누구나)\s*승인", r"(수익|원금)\s*보장", r"확정\s*수익",
                  r"무직자\s*대출", r"(신용|등급)\s*무관"],
        "guide": "금리·수익·한도는 '최대', '조건 충족 시'처럼 조건과 함께 쓰고, 우대 조건·수수료·"
                 "중도해지 같은 중요 조건을 빠뜨리지 말 것. 수치는 기준일을 밝힐 것.",
    },
    "insurance": {
        "label": "보험",
        "level": "yellow",
        "match": {"categories": ["insurance"], "keywords": ["보험"]},
        "error": [r"무조건\s*(가입|보상|지급)", r"(보험금|보상)\s*100\s*%", r"심사\s*없이"],
        "guide": "보장 범위·면책·감액 기간 같은 제한 조건을 함께 쓰고, 상품별로 다를 수 있다고 밝힐 것.",
    },
    "medical": {
        "label": "의료·시술 후기",
        "level": "red",
        "match": {"categories": [], "keywords": ["성형", "병원 후기", "시술 후기", "전문의약품", "처방 없이",
                                                "운전연수", "반영구"]},
        "error": [r".*"],
        "guide": "의료법·약사법 등 공식 규제 분야라 자동 발행하지 않는다.",
    },
}


def _norm(s: str) -> str:
    return re.sub(r"\s+", "", (s or "").lower())


def _find(patterns: list[str], text: str) -> list[str]:
    return [m.group(0) for p in patterns for m in [re.search(p, text or "", re.IGNORECASE)] if m]


def risk_fields(keyword: str, category: str) -> list[str]:
    out = []
    for name, f in RISK_FIELDS.items():
        if category in f["match"]["categories"] or any(_norm(k) in _norm(keyword)
                                                       for k in f["match"]["keywords"]):
            out.append(name)
    return out


def keyword_risk(keyword: str, category: str) -> dict:
    """키워드 단계 판정. red 면 자동 발행 대상에서 뺀다."""
    fields = risk_fields(keyword, category)
    level = "green"
    if any(RISK_FIELDS[f]["level"] == "red" for f in fields):
        level = "red"
    elif fields:
        level = "yellow"
    year_bad = [y for y in re.findall(r"20\d\d", keyword) if int(y) != datetime.now().year]
    return {
        "level": "red" if year_bad else level,
        "fields": fields,
        "guides": [RISK_FIELDS[f]["guide"] for f in fields],
        "notes": [f"지난 연도 키워드({', '.join(year_bad)})"] if year_bad else [],
    }


def contains_keyword(text: str, keyword: str) -> bool:
    """띄어쓰기를 무시하고 포함 여부, 또는 키워드의 모든 단어가 순서대로 들어 있는지."""
    if _norm(keyword) in _norm(text):
        return True
    pos, t = 0, _norm(text)
    for tok in keyword.split():
        i = t.find(_norm(tok), pos)
        if i < 0:
            return False
        pos = i + len(_norm(tok))
    return bool(keyword.split())


def check_title(title: str, keyword: str, category: str, content: str = "",
                serp_titles: list[str] = (), allow_experience: bool = False) -> list[dict]:
    """allow_experience: 실제 방문·사용 메모로 쓰는 글(네이버 블로그 반자동)은 경험 표현을 허용한다."""
    issues = []

    def add(sev, msg):
        issues.append({"severity": sev, "issue": msg})

    if keyword and not contains_keyword(title, keyword):
        add("error", f"세부 키워드 '{keyword}' 누락")
    elif keyword:
        first = _norm(keyword.split()[0])
        idx = _norm(title).find(first)
        if idx > KEYWORD_FRONT:
            add("warn", "키워드가 제목 뒤쪽에 있음")
    if len(title) > TITLE_MAX:
        add("error", f"제목 {len(title)}자 (최대 {TITLE_MAX})")
    elif len(title) > TITLE_SOFT_MAX:
        add("warn", f"제목 {len(title)}자 (권장 {TITLE_SOFT_MAX} 이하)")

    for y in re.findall(r"20\d\d", title):
        if int(y) != datetime.now().year:
            add("error", f"지난 연도 {y}")
    if content:
        body = _norm(content)
        for num in set(re.findall(r"\d+(?:[.,]\d+)?", re.sub(r"20\d\d", "", title))):
            if _norm(num) not in body:
                add("error", f"본문에 없는 숫자 '{num}'")

    for hit in ([] if allow_experience else _find(FAKE_EXPERIENCE, title)):
        add("error", f"없는 경험 표현 '{hit}'")
    for hit in _find(HYPE_ERROR, title):
        add("error", f"과장 표현 '{hit}'")
    for hit in _find(HYPE_WARN, title):
        add("warn", f"과장 우려 '{hit}'")
    for f in risk_fields(keyword or title, category):
        for hit in _find(RISK_FIELDS[f]["error"], title):
            add("error", f"{RISK_FIELDS[f]['label']} 주의 표현 '{hit}'")

    for s in serp_titles:
        if SequenceMatcher(None, _norm(title), _norm(s)).ratio() >= 0.8:
            add("error", f"상위 글 제목과 거의 같음: {s[:30]}")
            break
    return issues


FALLBACK_MODIFIER = {
    "info": "조건과 방법 한눈에 정리",
    "compare": "비교하고 고르는 기준",
    "review": "후기에서 많이 나온 장단점",
    "problem": "원인별 해결 방법",
    "visit": "메뉴와 가격, 다녀온 후기",
}


def choose_title(candidates: list[str], keyword: str, category: str, content: str,
                 serp_titles: list[str] = (), intent: str = "info",
                 allow_experience: bool = False) -> tuple[str, list[dict], list[tuple[str, list]]]:
    """오류 없는 첫 후보를 고른다. 모두 오류면 키워드 보정 → 기본 수식어 제목 순으로 대체한다."""
    seen, checked = set(), []
    for t in candidates:
        t = (t or "").strip().strip('"')
        if not t or t in seen:
            continue
        seen.add(t)
        iss = check_title(t, keyword, category, content, serp_titles, allow_experience)
        checked.append((t, iss))
        if not any(i["severity"] == "error" for i in iss):
            return t, iss, checked
    # 1차 보정: 오류가 가장 적은 후보에 키워드만 빠졌다면 앞에 붙인다
    if checked:
        best, _ = min(checked, key=lambda x: sum(i["severity"] == "error" for i in x[1]))
        if keyword and not contains_keyword(best, keyword):
            fixed = f"{keyword}, {best}"
            iss = check_title(fixed, keyword, category, content, serp_titles, allow_experience)
            if not any(i["severity"] == "error" for i in iss):
                return fixed, iss, checked
    # 2차 보정: 과장 없는 기본 수식어
    fallback = f"{keyword} {FALLBACK_MODIFIER.get(intent, '핵심 정리')}"
    iss = check_title(fallback, keyword, category, content, serp_titles, allow_experience)
    iss.append({"severity": "warn", "issue": "후보 모두 탈락 - 기본 수식어 제목 사용"})
    return fallback, iss, checked


def check_content(content: str, keyword: str, category: str) -> list[dict]:
    """본문의 없는 경험·과장·위험 분야 표현 점검."""
    issues = []
    for hit in _find(FAKE_EXPERIENCE, content):
        issues.append({"severity": "warn", "issue": f"본문 체험 주장 '{hit}'"})
    for hit in _find(HYPE_ERROR, content):
        issues.append({"severity": "warn", "issue": f"본문 과장 표현 '{hit}'"})
    for f in risk_fields(keyword, category):
        rule = RISK_FIELDS[f]
        if rule["level"] == "red":
            issues.append({"severity": "error", "issue": f"{rule['label']} 분야 - 자동 발행 금지"})
            continue
        for hit in _find(rule["error"], content):
            issues.append({"severity": "warn", "issue": f"본문 {rule['label']} 주의 표현 '{hit}'"})
    if keyword and not contains_keyword(content[:300], keyword):
        issues.append({"severity": "warn", "issue": "세부 키워드가 도입부(300자)에 없음"})
    return issues
