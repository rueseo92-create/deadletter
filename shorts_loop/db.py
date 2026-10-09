"""SQLite 저장소. 파이프라인 상태는 videos.status 로 관리한다.

status 흐름:
  scripted → voiced → rendered → approved → scheduled
                    ↘ needs_audio (manual 녹음 대기)
  rendered → rejected
"""
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone

from .config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS trend_channels (
  channel_id TEXT PRIMARY KEY,
  title TEXT, published_at TEXT, video_count INTEGER, view_count INTEGER,
  subscriber_count INTEGER, keyword TEXT, found_at TEXT
);
CREATE TABLE IF NOT EXISTS trend_videos (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT, title TEXT, published_at TEXT, duration_s INTEGER,
  view_count INTEGER, like_count INTEGER, comment_count INTEGER,
  keyword TEXT, found_at TEXT
);
CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,          -- form | manual | suggest
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'new',  -- new | used | skipped
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER REFERENCES ideas(id),
  status TEXT NOT NULL,
  title TEXT, description TEXT, tags TEXT,
  category TEXT, hook_type TEXT,
  script_json TEXT NOT NULL,
  flags TEXT,                     -- 자동 검사에서 걸린 항목(JSON 배열)
  audio_path TEXT, timings_json TEXT, video_path TEXT,
  review_note TEXT,
  publish_at TEXT, youtube_id TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS metrics (
  video_id INTEGER REFERENCES videos(id),
  window TEXT NOT NULL,           -- 48h | 7d
  collected_at TEXT NOT NULL,
  views INTEGER, avg_view_pct REAL, avg_view_s REAL,
  likes INTEGER, comments INTEGER, shares INTEGER, subs_gained INTEGER,
  PRIMARY KEY (video_id, window)
);
CREATE TABLE IF NOT EXISTS weights (
  dimension TEXT NOT NULL,        -- category | hook_type
  value TEXT NOT NULL,
  score REAL NOT NULL, samples INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (dimension, value)
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


@contextmanager
def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init():
    with connect() as c:
        c.executescript(SCHEMA)


def set_video(c, vid: int, **fields):
    fields["updated_at"] = now()
    for k, v in fields.items():
        if isinstance(v, (list, dict)):
            fields[k] = json.dumps(v, ensure_ascii=False)
    cols = ", ".join(f"{k} = ?" for k in fields)
    c.execute(f"UPDATE videos SET {cols} WHERE id = ?", (*fields.values(), vid))


def videos_by_status(c, status: str):
    return c.execute("SELECT * FROM videos WHERE status = ? ORDER BY id", (status,)).fetchall()
