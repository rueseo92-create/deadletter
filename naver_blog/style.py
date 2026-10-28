"""말투 학습: 내 블로그 기존 글을 읽어 말투 규칙(style.md)과 예시 문단을 만든다.

돈나나 '내 말투 AI 세팅'과 같은 6가지 기준으로 분석한다.
"""
import html
import re
import urllib.request

from pydantic import BaseModel

from . import llm
from .config import EXAMPLES_FILE, STYLE_FILE

UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"


def _get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read().decode("utf-8", errors="ignore")


def rss_posts(blog_id: str) -> list[dict]:
    xml = _get(f"https://rss.blog.naver.com/{blog_id}.xml")
    out = []
    for item in re.findall(r"<item>(.*?)</item>", xml, re.S):
        title = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>", item, re.S).group(1)
        log = re.search(rf"blog\.naver\.com/{blog_id}/(\d+)", item)
        date = re.search(r"<pubDate>(.*?)</pubDate>", item)
        if log:
            out.append({"title": html.unescape(title).strip(), "log_no": log.group(1),
                        "url": f"https://blog.naver.com/{blog_id}/{log.group(1)}",
                        "date": date.group(1) if date else ""})
    return out


def post_text(blog_id: str, log_no: str) -> str:
    page = _get(f"https://m.blog.naver.com/PostView.naver?blogId={blog_id}&logNo={log_no}")
    paras = re.findall(r'<p class="se-text-paragraph[^"]*"[^>]*>(.*?)</p>', page, re.S)
    lines = [html.unescape(re.sub(r"<[^>]+>", "", p)).replace("​", "").strip() for p in paras]
    return "\n".join(lines).strip()


class StyleGuide(BaseModel):
    tone: str
    sentence_and_linebreak: str
    flow: str
    frequent_expressions: list[str]
    avoided_expressions: list[str]
    rules: list[str]


def learn(cfg: dict) -> str:
    posts = rss_posts(cfg["blog_id"])
    texts = []
    for p in posts:
        try:
            t = post_text(cfg["blog_id"], p["log_no"])
        except Exception as e:
            print(f"  ! {p['title']} 읽기 실패: {e}")
            continue
        if len(t) > 80:
            texts.append(f"### {p['title']}\n{t}")
    if not texts:
        raise SystemExit("읽을 수 있는 글이 없습니다. 블로그가 전체 공개인지 확인하세요.")
    corpus = "\n\n".join(texts)
    g = llm.parse(
        cfg["model"],
        "너는 블로그 문체 분석가다. 내용을 요약하지 말고 글쓴이의 말투와 작성 습관만 분석한다.",
        f"아래는 한 사람이 직접 쓴 네이버 블로그 글들이다.\n\n{corpus}\n\n"
        "1) 말투와 어조 2) 문장 길이와 줄바꿈 습관 3) 도입-본문-마무리 흐름 4) 자주 쓰는 표현 "
        "5) 잘 쓰지 않는 표현 6) 이 말투를 재현하기 위한 작성 규칙(구체적으로, 8~12개)을 정리해라.",
        StyleGuide,
    )
    md = ["# 내 블로그 말투 규칙", "",
          f"## 말투와 어조\n{g.tone}", "",
          f"## 문장 길이와 줄바꿈\n{g.sentence_and_linebreak}", "",
          f"## 글 흐름\n{g.flow}", "",
          "## 자주 쓰는 표현", *[f"- {x}" for x in g.frequent_expressions], "",
          "## 잘 쓰지 않는 표현", *[f"- {x}" for x in g.avoided_expressions], "",
          "## 작성 규칙", *[f"- {x}" for x in g.rules], ""]
    STYLE_FILE.write_text("\n".join(md), encoding="utf-8")
    # 예시 문단: 긴 글 3개의 앞부분
    ex = sorted(texts, key=len, reverse=True)[:3]
    EXAMPLES_FILE.write_text("\n\n---\n\n".join(t[:700] for t in ex), encoding="utf-8")
    return f"{len(texts)}개 글 분석 → {STYLE_FILE}"


def load() -> tuple[str, str]:
    style = STYLE_FILE.read_text(encoding="utf-8") if STYLE_FILE.exists() else ""
    ex = EXAMPLES_FILE.read_text(encoding="utf-8") if EXAMPLES_FILE.exists() else ""
    return style, ex
