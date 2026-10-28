"""memo.txt 파싱: '키: 값' 줄 + 자유 메모."""
import re
from pathlib import Path

FIELDS = ["가게", "동네", "주소", "방문일", "누구와", "메뉴와 가격", "웨이팅", "주차",
          "좋았던 점", "아쉬운 점", "재방문", "협찬"]


def parse(path: Path) -> dict:
    facts, free = {}, []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("#"):
            continue
        m = re.match(r"\s*([^:：]{1,12})\s*[:：]\s*(.*)$", line)
        if m and m.group(1).strip() in FIELDS:
            if m.group(2).strip():
                facts[m.group(1).strip()] = m.group(2).strip()
        elif line.strip():
            free.append(line.strip())
    facts["자유 메모"] = "\n".join(free)
    return facts


def sponsored(facts: dict) -> str:
    """협찬이면 무엇을 받았는지, 아니면 빈 문자열."""
    v = facts.get("협찬", "").strip()
    if not v or v in ("아니오", "아니요", "no", "X", "x", "없음"):
        return ""
    return v


def missing(facts: dict) -> list[str]:
    need = ["가게", "동네", "메뉴와 가격"]
    return [k for k in need if not facts.get(k)]
