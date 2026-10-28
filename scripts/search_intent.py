"""
search_intent.py - 검색 의도 분류 + 의도별 글 구조

키워드 자체와 함께 검색되는 키워드, 상위 글 제목, 독자 질문에 나오는 패턴을 세어
정보(info) / 비교(compare) / 후기 종합(review) / 문제 해결(problem) 중 하나로 분류한다.
API 호출 없이 규칙으로만 판단한다.
"""

import re

INTENT_PATTERNS = {
    "compare": ["비교", "vs", "차이", "추천", "순위", "top", "고르는", "고르기", "장단점",
                "어디가", "뭐가", "종류", "가성비", "높은", "싼", "저렴한", "좋은"],
    "info": ["방법", "하는법", "하는 법", "신청", "조건", "계산", "기간", "서류", "절차",
             "총정리", "정리", "기준", "대상", "자격", "뜻", "준비", "한도", "세율", "일정",
             "언제", "얼마", "가입", "필요"],
    "review": ["후기", "내돈내산", "사용기", "써보니", "솔직", "리뷰", "경험담", "실사용"],
    "problem": ["안될때", "안 될때", "안돼", "오류", "해결", "거절", "부족", "연체", "통증",
                "원인", "왜", "손해", "실수", "주의", "사기", "피해", "취소", "환불", "해지",
                "분쟁", "부작용", "증상", "대처"],
}

INTENT_GUIDE = {
    "info": {
        "label": "정보·방법",
        "reader": "조건·절차·기준을 정확히 알고 바로 따라 하고 싶다",
        "outline": [
            "도입 바로 아래에 한 줄 결론(> 핵심 답변)",
            "대상·조건·기준을 표로 정리",
            "단계별 절차(순서 있는 목록)",
            "자주 하는 실수와 주의점",
            "FAQ",
        ],
    },
    "compare": {
        "label": "비교·선택",
        "reader": "여러 선택지 중 내 상황에 맞는 것을 고르고 싶다",
        "outline": [
            "비교 기준을 먼저 제시하고 한 줄 결론",
            "선택지별 비교표(기준을 열로)",
            "기준별 상세 비교",
            "상황별 추천(이런 사람은 A, 저런 사람은 B)",
            "고르기 전 체크리스트 + FAQ",
        ],
    },
    "review": {
        "label": "후기 종합",
        "reader": "실제로 써 본 사람들의 장단점을 빨리 알고 싶다",
        "outline": [
            "공개된 후기·자료에서 반복되는 장점과 단점을 요약(1인칭 체험담 금지)",
            "장단점 표",
            "어떤 사람에게 맞고 어떤 사람에게 안 맞는지",
            "구매·가입 전 확인할 점",
            "FAQ",
        ],
    },
    "problem": {
        "label": "문제 해결",
        "reader": "지금 겪는 문제의 원인을 찾고 해결하고 싶다",
        "outline": [
            "증상·상황 정리와 한 줄 결론",
            "원인별 해결 방법(원인마다 H3)",
            "해결이 안 될 때 대안·문의처",
            "재발 방지·예방",
            "FAQ",
        ],
    },
}


def _norm(s: str) -> str:
    return re.sub(r"\s+", "", s.lower())


def _hits(text: str, words: list[str]) -> int:
    t = _norm(text)
    return sum(1 for w in words if _norm(w) in t)


def classify(keyword: str, related: list[str] = (), serp_titles: list[str] = (),
             questions: list[str] = ()) -> dict:
    """의도와 근거 신호를 돌려준다. 키워드 자체 신호에 가중치 3, 주변 신호는 1(의도별 최대 5)."""
    scores = {}
    signals = {}
    for intent, words in INTENT_PATTERNS.items():
        own = _hits(keyword, words) * 3
        around = sum(_hits(x, words) for x in [*related, *serp_titles, *questions])
        scores[intent] = own + min(around, 5)
        signals[intent] = [w for w in words if _norm(w) in _norm(keyword)]
    best = max(scores, key=lambda k: (scores[k], k == "info"))
    if scores[best] == 0:
        best = "info"
    total = sum(scores.values()) or 1
    return {
        "intent": best,
        "confidence": round(scores[best] / total, 2),
        "scores": scores,
        "signals": signals[best],
    }


def outline_text(intent: str) -> str:
    g = INTENT_GUIDE.get(intent, INTENT_GUIDE["info"])
    steps = "\n".join(f"   {i}. {s}" for i, s in enumerate(g["outline"], 1))
    return f"검색 의도: {g['label']} - 독자는 '{g['reader']}'\n   권장 구조:\n{steps}"
