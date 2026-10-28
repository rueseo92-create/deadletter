"""python -m naver_blog <명령>"""
import argparse
import shutil
import webbrowser

from . import config, draft, preview, queue, style
from .config import INBOX, OUT


def main():
    p = argparse.ArgumentParser(prog="naver_blog", description="네이버 블로그 경험 기반 반자동 운영")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("learn-style", help="기존 글로 내 말투 학습 (처음 1회, 글이 쌓이면 다시)")
    n = sub.add_parser("new", help="inbox 에 새 방문 폴더 만들기")
    n.add_argument("name", help="예: 2026-11-02-논현-효도치킨")
    d = sub.add_parser("draft", help="원고 만들기")
    d.add_argument("folders", nargs="*", help="inbox 안 폴더 이름 (비우면 아직 안 만든 것 전부)")
    d.add_argument("--no-open", action="store_true")
    sub.add_parser("list", help="예약 대기열")
    sub.add_parser("sync", help="RSS 로 발행 여부 확인")
    a = p.parse_args()
    cfg = config.load()

    if a.cmd == "learn-style":
        print(style.learn(cfg))
    elif a.cmd == "new":
        dst = INBOX / a.name
        shutil.copytree(INBOX / "_template", dst, dirs_exist_ok=True)
        print(f"{dst}\n  → memo.txt 를 채우고 사진을 넣은 뒤: python -m naver_blog draft {a.name}")
    elif a.cmd == "draft":
        done = {x["folder"] for x in queue.load()}
        targets = a.folders or [f.name for f in sorted(INBOX.iterdir())
                                if f.is_dir() and f.name != "_template" and f.name not in done]
        if not targets:
            print("만들 원고가 없습니다. `new` 로 폴더를 만들고 메모와 사진을 넣으세요.")
        for name in targets:
            print(f"▶ {name}")
            res = draft.make(cfg, INBOX / name, OUT)
            slot = queue.add(cfg, res)
            page = preview.write(res, OUT / name, slot)
            errs = sum(i["severity"] == "error" for i in res["issues"])
            print(f"  제목: {res['title']}\n  예약 추천: {slot}\n  확인 필요: {len(res['issues'])}건 (빨간 {errs})\n  {page}")
            if not a.no_open:
                webbrowser.open(page.as_uri())
    elif a.cmd == "list":
        for x in queue.load():
            print(f"[{x['status']:<9}] {x['slot']:<22} {x['title']}  {x.get('url', '')}")
    elif a.cmd == "sync":
        for line in queue.sync(cfg) or ["새로 확인된 발행 글 없음"]:
            print(line)
