"""방문 메모에 맞는 키워드 고르기.

맛집은 경쟁이 센 분야라 '동네 맛집' 같은 큰 키워드 대신 동네 + 메뉴 + 상황처럼 좁힌다.
메모에 근거가 없는 단어(가 보지 않은 조건)가 들어간 키워드는 고르지 않는다.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import keyword_research as kr  # noqa: E402

GENERIC = {"맛집", "추천", "후기", "근처", "메뉴", "가격", "가볼만한곳", "가볼만한", "맛집추천", "내돈내산",
           "리뷰", "위치", "주차", "웨이팅", "예약", "영업시간"}
SITUATIONS = ["데이트", "회식", "단체", "모임", "가족", "아이", "혼밥", "혼술", "룸", "가성비", "뷰", "애견",
              "주차", "웨이팅", "점심", "저녁", "포장", "배달", "2차", "술집", "브런치", "생일", "기념일"]


def menus(facts: dict) -> list[str]:
    raw = facts.get("메뉴와 가격", "")
    out = []
    for part in re.split(r"[,/·\n]", raw):
        name = re.sub(r"\d[\d,]*\s*(원|만원|천원)?|\(.*?\)", "", part).strip(" -:")
        if 1 < len(name) <= 12:
            out.append(name)
    return out


def _grounded(kw: str, facts: dict, memo_text: str) -> bool:
    area, store = facts.get("동네", ""), facts.get("가게", "")
    for tok in kw.split():
        if tok in GENERIC or (area and tok in area) or (store and (tok in store or store in tok)):
            continue
        if kr._nkey(tok) not in kr._nkey(memo_text):
            return False
    return True


def pick(facts: dict) -> dict:
    area, store = facts.get("동네", "").strip(), facts.get("가게", "").strip()
    memo_text = " ".join(facts.values())
    ms = menus(facts)
    situ = [s for s in SITUATIONS if s in memo_text]
    seeds = [s for s in [f"{area} 맛집" if area else "", *(f"{area} {m}" for m in ms[:2] if area), store,
                         f"{area} {store}" if area and store else ""] if s]

    found = {}
    for seed in seeds:
        for engine, fn in (("naver", kr.naver_autocomplete), ("google", kr.google_autocomplete)):
            for rank, kw in enumerate(fn(seed), 1):
                if area and area not in kw and store not in kw:
                    continue
                c = found.setdefault(kr._nkey(kw), {"keyword": kw, "score": 0.0})
                c["score"] += (11 - min(rank, 10)) / 10
    # 메모로 직접 만든 조합도 후보 (동네 + 메뉴, 동네 + 상황 + 맛집)
    for m in ms[:3]:
        found.setdefault(kr._nkey(f"{area} {m}"), {"keyword": f"{area} {m}", "score": 0.5})
    for s in situ[:3]:
        found.setdefault(kr._nkey(f"{area} {s} 맛집"), {"keyword": f"{area} {s} 맛집", "score": 0.4})

    cands = []
    for c in found.values():
        if not _grounded(c["keyword"], facts, memo_text) or kr._nkey(c["keyword"]) == kr._nkey(f"{area} 맛집"):
            continue
        toks = c["keyword"].split()
        c["score"] += 0.6 * sum(1 for m in ms if any(m in t or t in m for t in toks))  # 실제 먹은 메뉴
        c["score"] += 0.4 * sum(1 for s in situ if s in c["keyword"])                  # 실제 상황
        cands.append(c)
    store_known = bool(store and kr.naver_autocomplete(store))
    main = f"{area} {store}".strip() if store_known else (f"{area} 맛집" if area else store)
    # 세부 키워드는 메인(가게명)과 겹치지 않는 '동네 + 메뉴/상황' 쪽으로
    cands = [c for c in cands if kr._nkey(c["keyword"]) not in kr._nkey(main)
             and kr._nkey(c["keyword"]) != kr._nkey(store)]
    cands.sort(key=lambda c: -c["score"])

    sub = cands[0]["keyword"] if cands else (f"{area} {ms[0]}" if area and ms else f"{area} {store}".strip())
    serp = kr.naver_search("blog", f"{area} {store}".strip() or sub, 10)
    return {
        "main": main,
        "keyword": sub,
        "extra": [c["keyword"] for c in cands[1:8]],
        "serp_titles": [i["title"] for i in serp["items"]],
        "docs": serp["total"],
        "menus": ms,
        "situations": situ,
    }
