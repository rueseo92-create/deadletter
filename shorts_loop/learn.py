"""⑨ 학습: 잘 된 형식에 가중치를 올려 다음 소재·대본 선택에 반영한다 (2강 '100개 만들어 보기').

영상 점수 = 0.5×(평균 시청 비율 / KPI) + 0.3×(좋아요율 / KPI) + 0.2×(조회수 순위 백분위)
카테고리·후킹 유형별 점수는 표본이 적을 때 전체 평균 쪽으로 당겨서(베이지안 평활) 계산한다.
"""
from datetime import datetime, timedelta, timezone

from . import db


def _video_scores(cfg: dict) -> list[dict]:
    kpi = cfg["learn"]["kpi"]
    with db.connect() as c:
        rows = c.execute("""
            SELECT v.id, v.category, v.hook_type, v.publish_at, m.window, m.views, m.avg_view_pct,
                   m.likes, m.comments
            FROM videos v JOIN metrics m ON m.video_id = v.id
            ORDER BY v.id, CASE m.window WHEN '7d' THEN 0 ELSE 1 END""").fetchall()
    latest = {}
    for r in rows:  # 7d 가 있으면 7d, 없으면 48h
        latest.setdefault(r["id"], r)
    rows = list(latest.values())
    if not rows:
        return []
    by_views = sorted(rows, key=lambda r: r["views"])
    rank = {r["id"]: (i + 1) / len(by_views) for i, r in enumerate(by_views)}
    out = []
    for r in rows:
        like_rate = 100 * r["likes"] / r["views"] if r["views"] else 0
        score = (0.5 * min(r["avg_view_pct"] / kpi["avg_view_pct"], 1.5)
                 + 0.3 * min(like_rate / kpi["like_rate"], 1.5)
                 + 0.2 * rank[r["id"]])
        out.append({**dict(r), "like_rate": like_rate, "score": score})
    return out


def run(cfg: dict) -> int:
    vs = _video_scores(cfg)
    if not vs:
        return 0
    m = cfg["learn"]["min_samples"]
    prior = sum(v["score"] for v in vs) / len(vs)
    with db.connect() as c:
        for dim in ("category", "hook_type"):
            groups = {}
            for v in vs:
                groups.setdefault(v[dim] or "기타", []).append(v["score"])
            for val, scores in groups.items():
                smoothed = (sum(scores) + prior * m) / (len(scores) + m)
                c.execute("INSERT OR REPLACE INTO weights VALUES (?,?,?,?,?)",
                          (dim, val, smoothed, len(scores), db.now()))
    return len(vs)


def top_weights(dimension: str) -> list[tuple[str, float]]:
    with db.connect() as c:
        rows = c.execute("SELECT value, score FROM weights WHERE dimension=? ORDER BY score DESC",
                         (dimension,)).fetchall()
    if not rows:
        return []
    hi = max(r["score"] for r in rows) or 1
    return [(r["value"], r["score"] / hi) for r in rows]


def report(cfg: dict) -> str:
    vs = _video_scores(cfg)
    kpi, lc = cfg["learn"]["kpi"], cfg["learn"]
    lines = ["== 영상별 성과 (최신 창 기준) =="]
    for v in sorted(vs, key=lambda x: -x["score"]):
        ok = "OK " if v["avg_view_pct"] >= kpi["avg_view_pct"] and v["like_rate"] >= kpi["like_rate"] else "-- "
        lines.append(f"{ok}#{v['id']:<4} {v['window']:<3} 조회 {v['views']:>8,}  시청 {v['avg_view_pct']:5.1f}%  "
                     f"좋아요율 {v['like_rate']:4.1f}%  점수 {v['score']:.2f}  [{v['category']}/{v['hook_type']}]")
    lines.append("\n== 가중치 ==")
    with db.connect() as c:
        for r in c.execute("SELECT * FROM weights ORDER BY dimension, score DESC"):
            lines.append(f"{r['dimension']:<9} {r['value']:<20} {r['score']:.2f} (n={r['samples']})")
    drop = dropped_categories(cfg)
    if drop:
        lines.append(f"\n제외 중인 카테고리(최근 {lc['drop_after_days']}일 전부 KPI 미달): {', '.join(drop)}")
    return "\n".join(lines)


def dropped_categories(cfg: dict) -> list[str]:
    """최근 drop_after_days 동안 표본이 충분한데 전부 시청 비율 KPI 미달인 카테고리."""
    lc, kpi = cfg["learn"], cfg["learn"]["kpi"]
    cutoff = datetime.now(timezone.utc) - timedelta(days=lc["drop_after_days"])
    cats = {}
    for v in _video_scores(cfg):
        if v["category"] and v["publish_at"] and datetime.fromisoformat(v["publish_at"]) >= cutoff:
            cats.setdefault(v["category"], []).append(v)
    return [c for c, xs in cats.items() if len(xs) >= lc["min_samples"] and
            all(x["avg_view_pct"] < kpi["avg_view_pct"] for x in xs)]
