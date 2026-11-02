"""
pipeline_log.py - 블로그 자동 발행 단계별 기록 (틈워크 파일럿 운영기록용)

글 1편 = 작업 1건. 단계마다 JSONL 한 줄을 scripts/pipeline_log/YYYY-MM.jsonl 에 남긴다.
  - 단계ID(S1~S9)는 sero-hq docs/teumwork 의 단계표와 같다.
  - 모델·프롬프트 버전(프롬프트 해시)을 함께 적어, 버전이 바뀌면 검수 통계를 새로 쌓을 수 있게 한다.
  - 탈락·오류도 남긴다. 기록 실패는 발행을 막지 않는다.

요약 보기:
  python pipeline_log.py              # 이번 달 단계별 통과율
  python pipeline_log.py --csv 2026-11 > steps.csv   # 운영기록 시트 [작업_단계]에 붙일 CSV
"""

import csv
import hashlib
import json
import sys
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path

LOG_DIR = Path(__file__).parent / "pipeline_log"
KST = timezone(timedelta(hours=9))
WORK_TYPE = "AI 블로그 자동 발행"

STEPS = {  # 단계ID: (단계명, 단계유형, 위험등급)
    "S1": ("주제·키워드 선정", "게이트(자동점검)", "하"),
    "S2": ("웹 조사", "AI", "상"),
    "S3": ("각도 설계·실험", "AI", "중"),
    "S4": ("본문 작성", "AI", "상"),
    "S5": ("형식·제목 점검", "게이트(자동점검)", "중"),
    "S6": ("슬롭 킬러 심사", "게이트(자동점검)", "상"),
    "S7": ("고쳐 쓰기", "AI", "상"),
    "S8": ("SEO 감사", "게이트(자동점검)", "하"),
    "S9": ("발행", "게이트(자동점검)", "하"),
}

_lock = threading.Lock()
_task = {"id": None, "seq": 0}


def now() -> datetime:
    return datetime.now(KST)


def prompt_version(text: str) -> str:
    """프롬프트 내용이 바뀌면 값이 바뀌는 짧은 버전 키"""
    return "h" + hashlib.sha1((text or "").encode("utf-8")).hexdigest()[:8]


def _write(row: dict):
    try:
        with _lock:
            LOG_DIR.mkdir(exist_ok=True)
            path = LOG_DIR / f"{now():%Y-%m}.jsonl"
            with path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
    except Exception as e:  # 기록 실패로 발행을 멈추지 않는다
        print(f"  [단계기록] 쓰기 실패: {e}")


def start(topic: str, category: str, slot: str = "") -> str:
    _task["seq"] += 1
    _task["id"] = f"B{now():%y%m%d-%H%M}-{_task['seq']}"
    step("S1", "통과", detail={"topic": topic, "category": category, "slot": slot})
    return _task["id"]


def step(step_id: str, result: str, model: str = "", prompt: str = "", sub: str = "",
         round_no: int = 0, detail: dict | None = None):
    """result: 통과 / 탈락 / 수정 / 실패 / 기록 (점수만 남기는 단계)"""
    if not _task["id"]:
        return
    name, kind, risk = STEPS.get(step_id, (step_id, "", ""))
    _write({
        "ts": now().isoformat(timespec="seconds"), "task": _task["id"], "work_type": WORK_TYPE,
        "step": step_id, "step_name": name + (f"/{sub}" if sub else ""), "kind": kind, "risk": risk,
        "model": model, "prompt_ver": prompt_version(prompt) if prompt else "",
        "round": round_no, "result": result, "detail": detail or {},
    })


def finish(result: str, slug: str = "", reason: str = ""):
    step("S9", result, detail={"slug": slug, "reason": reason[:300]})
    _task["id"] = None


# ──────────────────────────────────────────────
# 요약·내보내기
# ──────────────────────────────────────────────
def load(month: str) -> list[dict]:
    path = LOG_DIR / f"{month}.jsonl"
    if not path.exists():
        return []
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def summary(rows: list[dict]):
    stats: dict[str, dict] = {}
    for r in rows:
        s = stats.setdefault(r["step_name"], {"n": 0, "pass": 0})
        s["n"] += 1
        s["pass"] += r["result"] in ("통과", "발행", "기록", "수정")
    tasks = {r["task"] for r in rows}
    published = sum(1 for r in rows if r["step"] == "S9" and r["result"] == "발행")
    print(f"작업 {len(tasks)}건, 발행 {published}건")
    for name, s in sorted(stats.items()):
        print(f"  {name:<24} {s['pass']}/{s['n']} 통과")


def to_csv(rows: list[dict], out=sys.stdout):
    """운영기록 시트 [작업_단계] 열 순서 (자동 계산 열은 비워 둔다)"""
    w = csv.writer(out)
    w.writerow(["작업ID", "고객(가명)", "작업유형(키트)", "단계ID", "단계명", "단계유형", "위험등급",
                "AI 모델", "모델 버전(모델 ID에 포함)", "프롬프트 버전", "상태", "시작", "메모"])
    for r in rows:
        sid = f"{r['task']}-{r['step']}" + (f"-{r['detail'].get('reviewer')}" if r["detail"].get("reviewer") else "") \
            + (f"-r{r['round']}" if r["round"] else "")
        w.writerow([r["task"], "세로AI(자체)", r["work_type"], sid, r["step_name"], r["kind"], r["risk"],
                    r["model"], "", r["prompt_ver"], r["result"], r["ts"], json.dumps(r["detail"], ensure_ascii=False)[:200]])


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["--csv"]:
        to_csv(load(args[1] if len(args) > 1 else f"{now():%Y-%m}"))
    else:
        summary(load(args[0] if args else f"{now():%Y-%m}"))
