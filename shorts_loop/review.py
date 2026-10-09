"""⑥ 사람 검수 대시보드. 이 단계는 자동화하지 않는다.

python -m shorts_loop review  →  http://127.0.0.1:8765
렌더된 영상을 보고 제목을 고친 뒤 승인/반려한다. 승인된 것만 업로드 대상이 된다.
"""
import html
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import db, scriptgen

CSS = """
:root{--bg:#f6f6f4;--card:#fff;--ink:#1d1d1f;--mute:#6b6b70;--line:#e3e3e0;--ok:#1f7a4a;--bad:#b3261e;--warn:#8a5a00}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--card:#1d1d20;--ink:#ececef;--mute:#9a9aa2;--line:#2c2c31;--ok:#5cc58b;--bad:#ff8a80;--warn:#f0b54a}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:24px 16px}h1{font-size:20px;margin:0 0 4px}
.sub{color:var(--mute);margin:0 0 20px}.card{background:var(--card);border:1px solid var(--line);border-radius:12px;
padding:16px;margin:0 0 16px;display:grid;grid-template-columns:270px 1fr;gap:20px}
video{width:270px;aspect-ratio:9/16;background:#000;border-radius:8px}
@media (max-width:640px){.card{grid-template-columns:1fr}video{width:100%}}
input[type=text],textarea{width:100%;font:inherit;color:inherit;background:transparent;border:1px solid var(--line);border-radius:8px;padding:8px}
ol{padding-left:20px;margin:8px 0}li small{color:var(--mute)}.flags{color:var(--warn);margin:8px 0}
.row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}button{font:inherit;border:0;border-radius:8px;padding:8px 16px;cursor:pointer}
.ok{background:var(--ok);color:#fff}.bad{background:transparent;color:var(--bad);border:1px solid var(--bad)}
.empty{color:var(--mute);padding:40px 0;text-align:center}
"""


def _page(rows) -> str:
    cards = []
    for r in rows:
        s = scriptgen.load(r)
        flags = json.loads(r["flags"] or "[]")
        blocked = any("업로드 금지" in f for f in flags)
        lines = "".join(f"<li>{html.escape(l.text)} <small>{l.section} · {l.sfx} · {l.bg}</small></li>"
                        for l in s.lines)
        flag_html = ("<div class=flags>확인 필요: " + " / ".join(html.escape(f) for f in flags) + "</div>") if flags else ""
        ok_btn = "" if blocked else "<button class=ok name=action value=approve>승인</button>"
        cards.append(f"""
<form class=card method=post action="/decide/{r['id']}">
  <video src="/media/{r['id']}" controls preload=metadata></video>
  <div>
    <label>제목<input type=text name=title value="{html.escape(r['title'] or '')}" maxlength=95></label>
    <p class=sub>#{r['id']} · {html.escape(r['category'] or '-')} · 후킹 {html.escape(r['hook_type'] or '-')}</p>
    {flag_html}
    <ol>{lines}</ol>
    <label>메모(반려 사유)<textarea name=note rows=2></textarea></label>
    <div class=row>{ok_btn}<button class=bad name=action value=reject>반려</button></div>
  </div>
</form>""")
    body = "".join(cards) or "<p class=empty>검수할 영상이 없습니다.</p>"
    return (f"<!doctype html><html lang=ko><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
            f"<title>쇼츠 검수</title><style>{CSS}</style><main><h1>쇼츠 검수 대기열</h1>"
            f"<p class=sub>{len(rows)}개 대기 · 승인한 영상만 예약 업로드됩니다</p>{body}</main></html>")


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body: bytes, ctype="text/html; charset=utf-8"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/":
            with db.connect() as c:
                rows = db.videos_by_status(c, "rendered")
            return self._send(200, _page(rows).encode())
        if path.startswith("/media/"):
            with db.connect() as c:
                row = c.execute("SELECT video_path FROM videos WHERE id=?",
                                (int(path.rsplit("/", 1)[1]),)).fetchone()
            if not row or not row["video_path"] or not Path(row["video_path"]).exists():
                return self._send(404, b"not found", "text/plain")
            return self._send(200, Path(row["video_path"]).read_bytes(), "video/mp4")
        self._send(404, b"not found", "text/plain")

    def do_POST(self):
        path = urlparse(self.path).path
        if not path.startswith("/decide/"):
            return self._send(404, b"not found", "text/plain")
        vid = int(path.rsplit("/", 1)[1])
        n = int(self.headers.get("Content-Length", 0))
        form = {k: v[0] for k, v in parse_qs(self.rfile.read(n).decode()).items()}
        with db.connect() as c:
            row = c.execute("SELECT * FROM videos WHERE id=?", (vid,)).fetchone()
            flags = json.loads(row["flags"] or "[]") if row else []
            if row and row["status"] == "rendered":
                if form.get("action") == "approve" and not any("업로드 금지" in f for f in flags):
                    db.set_video(c, vid, status="approved", title=form.get("title", row["title"])[:95])
                elif form.get("action") == "reject":
                    db.set_video(c, vid, status="rejected", review_note=form.get("note", ""))
        self.send_response(303)
        self.send_header("Location", "/")
        self.end_headers()

    def log_message(self, *a):
        pass


def serve(port: int = 8765):
    print(f"검수 대시보드: http://127.0.0.1:{port}  (Ctrl+C 종료)")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
