"""명령줄 진입점: python -m shorts_loop <명령>"""
import argparse
import traceback
from datetime import datetime, timedelta

from . import analytics, config, db, ideas, learn, render, research, review, scriptgen, upload, voice
from .config import DATA, TOKEN_PATH


def _status():
    with db.connect() as c:
        v = c.execute("SELECT status, COUNT(*) n FROM videos GROUP BY status").fetchall()
        i = c.execute("SELECT status, COUNT(*) n FROM ideas GROUP BY status").fetchall()
        t = c.execute("SELECT COUNT(*) FROM trend_videos").fetchone()[0]
    print("소재:", ", ".join(f"{r['status']} {r['n']}" for r in i) or "없음")
    print("영상:", ", ".join(f"{r['status']} {r['n']}" for r in v) or "없음")
    print("트렌드 영상 수집:", t)
    with db.connect() as c:
        waiting = db.videos_by_status(c, "needs_audio")
    for r in waiting:
        print(f"  녹음 대기 #{r['id']}: data/work/{r['id']}/script.txt → data/audio/{r['id']}.wav")


def _backlog() -> int:
    with db.connect() as c:
        return c.execute("SELECT COUNT(*) FROM videos WHERE status IN "
                         "('scripted','needs_audio','voiced','rendered','approved')").fetchone()[0]


def daily(cfg: dict, skip_upload: bool = False):
    """하루 한 번 돌리는 전체 루프. 단계별로 실패해도 다음 단계는 계속한다."""
    per_day = cfg["upload"]["max_per_day"]

    def step(name, fn):
        print(f"\n▶ {name}")
        try:
            r = fn()
            if r is not None:
                print(f"  {r}")
        except SystemExit as e:
            print(f"  건너뜀: {e}")
        except Exception:
            print("  실패:")
            traceback.print_exc()

    if TOKEN_PATH.exists():
        step("⑧ 성과 수집", lambda: f"{analytics.run(cfg)}건")
        step("⑨ 학습", lambda: f"{learn.run(cfg)}개 영상 반영")

    ins = DATA / "insights.md"
    stale = not ins.exists() or datetime.fromtimestamp(ins.stat().st_mtime) < datetime.now() - timedelta(days=7)
    if stale and config.env("YOUTUBE_API_KEY", required=False):
        step("① 리서치(주 1회)", lambda: f"{research.run(cfg)}개 수집 → {research.analyze(cfg)}")

    if ideas.queue_size() < cfg["script"]["idea_queue_min"]:
        step("② 소재 보충", lambda: f"{ideas.suggest(cfg)}개 추가")

    need = max(0, per_day * 2 - _backlog())  # 검수 대기열이 이틀치를 넘지 않게
    if need:
        step("③ 대본", lambda: f"{len(scriptgen.run(cfg, need))}개 작성")
    step("④ 음성", lambda: voice.run(cfg))
    step("⑤ 렌더", lambda: f"{len(render.run(cfg))}개 완성 → `review` 로 검수")
    if not skip_upload:
        step("⑦ 예약 업로드(승인분)", lambda: upload.run(cfg) or "승인된 영상 없음")
    print()
    _status()


def main():
    p = argparse.ArgumentParser(prog="shorts_loop", description="썰 채널 쇼츠 자동화 루프")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init", help="DB 생성")
    sub.add_parser("auth", help="YouTube OAuth 최초 인증")
    r = sub.add_parser("research", help="① 트렌드 메타데이터 수집")
    r.add_argument("--analyze", action="store_true", help="수집 후 형식 인사이트 생성")
    ip = sub.add_parser("ideas", help="② 소재 관리")
    isub = ip.add_subparsers(dest="action", required=True)
    a = isub.add_parser("add")
    a.add_argument("title")
    a.add_argument("summary")
    a.add_argument("--category")
    imp = isub.add_parser("import", help="구글 폼 응답 CSV 가져오기")
    imp.add_argument("csv")
    sg = isub.add_parser("suggest")
    sg.add_argument("-n", type=int, default=6)
    isub.add_parser("list")
    s = sub.add_parser("script", help="③ 대본 생성")
    s.add_argument("-n", type=int, default=2)
    sub.add_parser("voice", help="④ 내레이션")
    sub.add_parser("render", help="⑤ 영상 렌더")
    rv = sub.add_parser("review", help="⑥ 검수 대시보드")
    rv.add_argument("--port", type=int, default=8765)
    u = sub.add_parser("upload", help="⑦ 승인분 예약 업로드")
    u.add_argument("--dry-run", action="store_true")
    sub.add_parser("collect", help="⑧ 성과 수집")
    sub.add_parser("learn", help="⑨ 가중치 갱신")
    sub.add_parser("report", help="성과·가중치 보고서")
    sub.add_parser("status", help="파이프라인 현황")
    d = sub.add_parser("daily", help="전체 루프 1회 실행 (cron 용)")
    d.add_argument("--skip-upload", action="store_true")
    args = p.parse_args()

    cfg = config.load()
    db.init()
    match args.cmd:
        case "init":
            print(f"DB 준비 완료: {config.DB_PATH}")
        case "auth":
            from . import youtube_auth
            youtube_auth.credentials(interactive=True)
            print(f"토큰 저장: {TOKEN_PATH}")
        case "research":
            print(f"{research.run(cfg)}개 영상 수집")
            if args.analyze:
                print(f"인사이트: {research.analyze(cfg)}")
        case "ideas":
            if args.action == "add":
                print(f"소재 #{ideas.add(args.title, args.summary, args.category)} 추가")
            elif args.action == "import":
                print(f"{ideas.import_csv(args.csv)}개 가져옴")
            elif args.action == "suggest":
                print(f"{ideas.suggest(cfg, args.n)}개 추가")
            else:
                with db.connect() as c:
                    for row in c.execute("SELECT * FROM ideas WHERE status='new' ORDER BY id"):
                        print(f"#{row['id']} [{row['source']}/{row['category']}] {row['title']}")
        case "script":
            print(f"대본 작성: {scriptgen.run(cfg, args.n)}")
        case "voice":
            print(voice.run(cfg))
        case "render":
            for path in render.run(cfg):
                print(path)
        case "review":
            review.serve(args.port)
        case "upload":
            for vid, msg in upload.run(cfg, dry_run=args.dry_run):
                print(f"#{vid} {msg}")
        case "collect":
            print(f"{analytics.run(cfg)}건 수집")
        case "learn":
            print(f"{learn.run(cfg)}개 영상 반영")
        case "report":
            print(learn.report(cfg))
        case "status":
            _status()
        case "daily":
            daily(cfg, skip_upload=args.skip_upload)
