"""미리보기 페이지(post.html)와 붙여넣기용 텍스트(post.txt)."""
import html
import json
from pathlib import Path

CSS = """
:root{--bg:#f7f7f5;--card:#fff;--ink:#1e1e20;--mute:#6c6c72;--line:#e4e4e0;--accent:#03a94d;--bad:#c62828;--warn:#9a6400}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--card:#1c1c1f;--ink:#ececef;--mute:#9b9ba3;--line:#2d2d32;--accent:#3ecf7a;--bad:#ff8a80;--warn:#f2b84b}}
*{box-sizing:border-box}html,body{overflow-x:hidden}code{overflow-wrap:anywhere}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 -apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 80px}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;color:var(--mute);margin:28px 0 8px;font-weight:600}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
.opt{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}.opt:last-child{border:0}.opt span{flex:1;min-width:0;overflow-wrap:anywhere}
button{font:inherit;font-size:13px;border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:8px;padding:4px 10px;cursor:pointer}
button.main{background:var(--accent);border-color:var(--accent);color:#fff}
.post p{white-space:pre-wrap;margin:0 0 16px}.post figure{margin:0 0 16px}.post img{width:100%;border-radius:8px;display:block}
.post figcaption{font-size:13px;color:var(--mute)}.tag{display:inline-block;margin:0 6px 6px 0;color:var(--accent)}
li.error{color:var(--bad)}li.warn{color:var(--warn)}.mute{color:var(--mute);font-size:14px}.disc{border-left:3px solid var(--accent);padding-left:10px}
"""

JS = """
function copy(t,b){const done=()=>{const o=b.textContent;b.textContent='복사됨';setTimeout(()=>b.textContent=o,1200)};
 if(navigator.clipboard){navigator.clipboard.writeText(t).then(done,()=>fb(t,done))}else fb(t,done)}
function fb(t,done){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();done()}
"""


def body_text(d: dict) -> str:
    parts = [d["disclosure"]] if d["disclosure"] else []
    for b in d["blocks"]:
        parts.append(b["text"] if b["kind"] == "text" else f"[사진 {b['photo']:02d}]")
    if d["place_info"]:
        parts.append("\n".join(d["place_info"]))
    return "\n\n".join(p.strip() for p in parts if p.strip())


def write(d: dict, out_dir: Path, slot: str) -> Path:
    e = html.escape
    txt = body_text(d)
    (out_dir / "post.txt").write_text(
        f"제목: {d['title']}\n\n{txt}\n\n태그: {' '.join('#' + t for t in d['tags'])}\n", encoding="utf-8")

    opts = "".join(f"<div class=opt><span>{e(t)}</span><button onclick='copy({json.dumps(t)},this)'>복사</button></div>"
                   for t in d["title_options"])
    post = [f"<p class=disc>{e(d['disclosure'])}</p>"] if d["disclosure"] else []
    for b in d["blocks"]:
        if b["kind"] == "text":
            post.append(f"<p>{e(b['text'])}</p>")
        elif 1 <= b["photo"] <= len(d["photos"]):
            name = d["photos"][b["photo"] - 1]
            note = d["photo_notes"][b["photo"] - 1] if b["photo"] <= len(d["photo_notes"]) else ""
            post.append(f"<figure><img src='photos/{e(name)}' loading=lazy alt='{e(note)}'>"
                        f"<figcaption>사진 {b['photo']:02d} · {e(name)}</figcaption></figure>")
    if d["place_info"]:
        post.append("<p>" + e("\n".join(d["place_info"])) + "</p>")
    rejected = "".join(f"<p class=mute>탈락: {e(r['title'])} ({e(', '.join(r['why']))})</p>"
                       for r in d.get("title_rejected", []))
    issues = "".join(f"<li class={i['severity']}>{e(i['issue'])}</li>" for i in d["issues"]) or "<li>문제 없음</li>"
    tags = "".join(f"<span class=tag>#{e(t)}</span>" for t in d["tags"])
    kw = d["keywords"]
    page = f"""<!doctype html><html lang=ko><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>{e(d['title'])}</title><style>{CSS}</style><script>{JS}</script><main>
<h1>{e(d['title'])}</h1>
<p class=mute>메인 {e(kw['main'])} · 세부 {e(kw['keyword'])} · 예약발행 추천 {e(slot)}</p>
<h2>확인할 것</h2><div class=card><ul>{issues}</ul>
<p class=mute>빨간 항목은 고친 뒤 올리세요. 메모에 없는 내용이 들어갔는지 마지막으로 한 번 읽어 주세요.</p></div>
<h2>제목 후보</h2><div class=card>{opts}{rejected}</div>
<h2>본문 <button class=main onclick='copy({json.dumps(txt)},this)'>본문 텍스트 복사</button></h2>
<p class=mute>네이버 글쓰기에 붙여 넣은 뒤, [사진 NN] 자리에 photos 폴더의 같은 번호 사진을 올리세요.</p>
<div class="card post">{''.join(post)}</div>
<h2>태그 <button onclick='copy({json.dumps(" ".join("#" + t for t in d["tags"]))},this)'>복사</button></h2>
<div class=card>{tags}</div>
<h2>올리는 순서</h2><div class=card><ol>
<li>네이버 블로그 글쓰기 → 제목 붙여 넣기</li><li>본문 텍스트 붙여 넣기 → [사진 NN] 자리에 사진 올리기</li>
<li>장소(지도) 추가, 태그 붙여 넣기</li><li>발행 → 예약 → {e(slot)}</li>
<li>올린 뒤 <code>python -m naver_blog sync</code> 로 발행 기록</li></ol></div>
</main></html>"""
    path = out_dir / "post.html"
    path.write_text(page, encoding="utf-8")
    return path
