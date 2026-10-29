"""⑦ 예약 업로드 (2강).

승인된 영상만 올린다. 시청자가 많은 시간대 슬롯(기본 점심 12:30, 저녁 21:00 KST)에
예약 공개(privacyStatus=private + publishAt)로 넣는다.

주의: Google Cloud 프로젝트가 YouTube API 감사(audit)를 통과하기 전에는 API로 올린 영상이
비공개로 고정된다. 감사 전에는 `--dry-run` 으로 슬롯만 확인하고 YouTube Studio 에서 직접 올린다.
"""
import json
from datetime import datetime, timedelta, timezone

from googleapiclient.http import MediaFileUpload

from . import db

KST = timezone(timedelta(hours=9))


def _taken_slots() -> set[str]:
    with db.connect() as c:
        return {r["publish_at"] for r in c.execute(
            "SELECT publish_at FROM videos WHERE publish_at IS NOT NULL").fetchall()}


def next_slots(cfg: dict, n: int) -> list[datetime]:
    uc = cfg["upload"]
    taken = _taken_slots()
    now = datetime.now(KST) + timedelta(minutes=60)  # 최소 1시간 뒤
    out, day = [], now.date()
    while len(out) < n:
        for hhmm in uc["slots_kst"][: uc["max_per_day"]]:
            h, m = map(int, hhmm.split(":"))
            t = datetime(day.year, day.month, day.day, h, m, tzinfo=KST)
            iso = t.astimezone(timezone.utc).isoformat(timespec="seconds")
            if t > now and iso not in taken:
                out.append(t)
                taken.add(iso)
                if len(out) == n:
                    break
        day += timedelta(days=1)
    return out


def _body(cfg: dict, row, publish_at: datetime) -> dict:
    uc = cfg["upload"]
    montage = row["hook_type"] == "montage"  # 직접 찍은 영상 모음
    desc = (row["description"] or "").strip()
    if montage:
        desc += "\n\n#shorts " + " ".join("#" + t for t in json.loads(row["tags"] or "[]")[:5] if t != "shorts")
    else:
        desc += "\n\n※ 각색된 이야기이며 등장인물·상황은 실제와 무관합니다.\n#shorts #썰"
    return {
        "snippet": {
            "title": row["title"],
            "description": desc,
            "tags": json.loads(row["tags"] or "[]"),
            "categoryId": uc["category_id"],
            "defaultLanguage": "ko",
            "defaultAudioLanguage": "ko",
        },
        "status": {
            "privacyStatus": "private",
            "publishAt": publish_at.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            "selfDeclaredMadeForKids": False,
            # AI 음성·사실적인 AI 이미지를 쓰면 '변경되거나 합성된 콘텐츠' 표시
            "containsSyntheticMedia": False if montage else bool(uc["synthetic_media"]),
        },
    }


def run(cfg: dict, dry_run: bool = False) -> list[tuple[int, str]]:
    with db.connect() as c:
        rows = db.videos_by_status(c, "approved")
    if not rows:
        return []
    slots = next_slots(cfg, len(rows))
    yt = None if dry_run else __import__("shorts_loop.youtube_auth", fromlist=["youtube"]).youtube()
    done = []
    for row, slot in zip(rows, slots):
        if dry_run:
            done.append((row["id"], f"(dry-run) {slot:%m-%d %H:%M} KST 예정"))
            continue
        req = yt.videos().insert(
            part="snippet,status", body=_body(cfg, row, slot),
            media_body=MediaFileUpload(row["video_path"], mimetype="video/mp4", resumable=True, chunksize=8 << 20),
        )
        resp = None
        while resp is None:
            _, resp = req.next_chunk()
        with db.connect() as c:
            db.set_video(c, row["id"], status="scheduled", youtube_id=resp["id"],
                         publish_at=slot.astimezone(timezone.utc).isoformat(timespec="seconds"))
        done.append((row["id"], f"https://youtu.be/{resp['id']}  {slot:%m-%d %H:%M} KST 공개"))
    return done
