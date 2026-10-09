"""① 콘텐츠 발굴 (2강).

키워드로 쇼츠를 검색해 '최근 개설됐는데 빠르게 큰 채널'과 그 채널의 히트 영상을
메타데이터만 수집한다. 영상 파일은 내려받지 않는다. 수집 결과는 형식 분석
(제목 패턴·길이·후킹 유형)에만 쓴다.
"""
import re
from datetime import datetime, timedelta, timezone

import requests
from pydantic import BaseModel

from . import db, llm
from .config import DATA, env

API = "https://www.googleapis.com/youtube/v3"


def _get(path: str, **params):
    params["key"] = env("YOUTUBE_API_KEY")
    r = requests.get(f"{API}/{path}", params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def _duration_s(iso: str) -> int:
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    d, h, mi, s = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + s


def _chunks(xs, n=50):
    for i in range(0, len(xs), n):
        yield xs[i:i + n]


def run(cfg: dict) -> int:
    rc = cfg["research"]
    after = (datetime.now(timezone.utc) - timedelta(days=rc["published_within_days"]))
    after_s = after.strftime("%Y-%m-%dT%H:%M:%SZ")
    found = 0
    with db.connect() as c:
        for kw in rc["keywords"]:
            # search.list = 100 units. 키워드 수 × 100 이 하루 할당량(10,000)을 넘지 않게.
            res = _get("search", part="id", q=f"{kw} #shorts", type="video",
                       videoDuration="short", order="viewCount", publishedAfter=after_s,
                       regionCode=rc["region_code"], relevanceLanguage=rc["language"],
                       maxResults=rc["max_results_per_keyword"])
            vids = [it["id"]["videoId"] for it in res.get("items", [])]
            if not vids:
                continue
            videos = _get("videos", part="snippet,statistics,contentDetails",
                          id=",".join(vids)).get("items", [])
            ch_ids = sorted({v["snippet"]["channelId"] for v in videos})
            channels = {}
            for chunk in _chunks(ch_ids):
                for ch in _get("channels", part="snippet,statistics",
                               id=",".join(chunk)).get("items", []):
                    channels[ch["id"]] = ch

            for v in videos:
                ch = channels.get(v["snippet"]["channelId"])
                if not ch:
                    continue
                st, cst = v.get("statistics", {}), ch.get("statistics", {})
                ch_age = datetime.now(timezone.utc) - datetime.fromisoformat(
                    ch["snippet"]["publishedAt"].replace("Z", "+00:00"))
                ch_views = int(cst.get("viewCount", 0))
                views = int(st.get("viewCount", 0))
                dur = _duration_s(v["contentDetails"]["duration"])
                if dur > 180:  # 쇼츠 최대 3분
                    continue
                if ch_age.days > rc["channel_max_age_days"] or ch_views < rc["channel_min_views"]:
                    continue
                if views < rc["video_min_views"]:
                    continue
                c.execute("""INSERT OR REPLACE INTO trend_channels VALUES (?,?,?,?,?,?,?,?)""",
                          (ch["id"], ch["snippet"]["title"], ch["snippet"]["publishedAt"],
                           int(cst.get("videoCount", 0)), ch_views,
                           int(cst.get("subscriberCount", 0) or 0), kw, db.now()))
                c.execute("""INSERT OR REPLACE INTO trend_videos VALUES (?,?,?,?,?,?,?,?,?,?)""",
                          (v["id"], ch["id"], v["snippet"]["title"], v["snippet"]["publishedAt"],
                           dur, views, int(st.get("likeCount", 0) or 0),
                           int(st.get("commentCount", 0) or 0), kw, db.now()))
                found += 1
    return found


class Insights(BaseModel):
    title_patterns: list[str]
    hook_types: list[str]
    typical_length_s: int
    topic_clusters: list[str]
    do_list: list[str]
    avoid_list: list[str]


def analyze(cfg: dict) -> str:
    """수집한 히트 영상 제목·길이로 형식 패턴을 뽑아 data/insights.md 에 저장."""
    with db.connect() as c:
        rows = c.execute("""SELECT title, duration_s, view_count, like_count FROM trend_videos
                            ORDER BY view_count DESC LIMIT 80""").fetchall()
    if not rows:
        raise SystemExit("trend_videos 가 비어 있습니다. 먼저 `research` 를 실행하세요.")
    table = "\n".join(f"- [{r['view_count']:,}회, {r['duration_s']}초, 좋아요 {r['like_count']:,}] {r['title']}"
                      for r in rows)
    ins = llm.parse(
        cfg["script"]["model"],
        "너는 한국 유튜브 쇼츠 포맷 분석가다. 제목과 수치만 보고 '형식'을 분석한다. "
        "특정 영상을 베끼는 방법이 아니라 재사용 가능한 구조적 패턴을 뽑는다.",
        f"채널 니치: {cfg['niche']}\n\n잘 된 쇼츠 목록:\n{table}\n\n"
        "제목 패턴, 첫 문장 후킹 유형(짧은 영문 snake_case 라벨), 적정 길이, 주제 군집, "
        "따라 할 것/피할 것을 정리해라.",
        Insights,
    )
    md = ["# 형식 인사이트", "",
          f"적정 길이: 약 {ins.typical_length_s}초", "",
          "## 제목 패턴", *[f"- {x}" for x in ins.title_patterns], "",
          "## 후킹 유형", *[f"- {x}" for x in ins.hook_types], "",
          "## 주제 군집", *[f"- {x}" for x in ins.topic_clusters], "",
          "## 따라 할 것", *[f"- {x}" for x in ins.do_list], "",
          "## 피할 것", *[f"- {x}" for x in ins.avoid_list], ""]
    out = DATA / "insights.md"
    out.write_text("\n".join(md), encoding="utf-8")
    return str(out)


def load_insights() -> str:
    p = DATA / "insights.md"
    return p.read_text(encoding="utf-8") if p.exists() else ""
