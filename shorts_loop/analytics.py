"""⑧ 성과 수집 (4강).

공개 후 48시간·7일 시점의 지표를 YouTube Analytics API 로 가져온다.
(스와이프 이탈률은 API 로 제공되지 않으므로 Studio 에서 눈으로 확인한다.)
"""
from datetime import datetime, timedelta, timezone

from . import db, youtube_auth

WINDOWS = {"48h": timedelta(hours=48), "7d": timedelta(days=7)}
METRICS = "views,averageViewPercentage,averageViewDuration,likes,comments,shares,subscribersGained"


def due() -> list[tuple]:
    now = datetime.now(timezone.utc)
    out = []
    with db.connect() as c:
        rows = c.execute("SELECT id, youtube_id, publish_at FROM videos "
                         "WHERE status='scheduled' AND youtube_id IS NOT NULL").fetchall()
        have = {(r["video_id"], r["window"]) for r in c.execute("SELECT video_id, window FROM metrics")}
    for r in rows:
        pub = datetime.fromisoformat(r["publish_at"])
        for w, delta in WINDOWS.items():
            # Analytics 는 하루 정도 늦게 집계되므로 하루 여유를 둔다
            if (r["id"], w) not in have and now >= pub + delta + timedelta(days=1):
                out.append((r, w, pub, pub + delta))
    return out


def run(cfg: dict) -> int:
    jobs = due()
    if not jobs:
        return 0
    api = youtube_auth.analytics()
    n = 0
    for row, window, start, end in jobs:
        res = api.reports().query(
            ids="channel==MINE", startDate=start.date().isoformat(), endDate=end.date().isoformat(),
            metrics=METRICS, dimensions="video", filters=f"video=={row['youtube_id']}",
        ).execute()
        vals = (res.get("rows") or [[row["youtube_id"]] + [0] * 7])[0][1:]
        views, pct, dur, likes, comments, shares, subs = vals
        with db.connect() as c:
            c.execute("INSERT OR REPLACE INTO metrics VALUES (?,?,?,?,?,?,?,?,?,?)",
                      (row["id"], window, db.now(), int(views), float(pct), float(dur),
                       int(likes), int(comments), int(shares), int(subs)))
        n += 1
    return n
