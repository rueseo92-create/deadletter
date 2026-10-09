"""⑤ 편집 자동화 (3강).

3강의 '미리캔버스 틀'을 코드로 만든다: 1080×1920 검은 배경, 상단 제목, 흰 선으로 둘린 영상 창,
하단 채널명. 영상 창에는 assets/backgrounds/<태그>/ 의 직접 촬영본·라이선스 확인된 스톡을 넣고,
자막은 음성 타이밍에 맞춰 굽고, 효과음은 줄 시작점에 얹는다.
"""
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from . import db, media, scriptgen
from .config import ASSETS, VIDEO_DIR, WORK_DIR

VIDEO_EXT = {".mp4", ".mov", ".webm", ".mkv"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp"}
AUDIO_EXT = {".wav", ".mp3", ".m4a", ".ogg"}

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "C:/Windows/Fonts/malgunbd.ttf",
    "C:/Windows/Fonts/malgun.ttf",
]


def font_path(cfg: dict) -> Path:
    for p in [cfg["render"].get("font_path"), *FONT_CANDIDATES]:
        if p and Path(p).exists():
            return Path(p)
    for p in (ASSETS / "fonts").glob("*.[ot]t[fc]"):
        return p
    raise SystemExit("한글 폰트를 찾지 못했습니다. config.json 의 render.font_path 에 눈누 등에서 받은 "
                     ".ttf 경로를 넣거나 shorts_loop/assets/fonts/ 에 넣으세요.")


def _draw_center(draw, text, font, cx, cy, fill="white", spacing=14):
    box = draw.multiline_textbbox((0, 0), text, font=font, spacing=spacing, align="center")
    w, h = box[2] - box[0], box[3] - box[1]
    draw.multiline_text((cx - w / 2, cy - h / 2), text, font=font, fill=fill,
                        spacing=spacing, align="center")


def make_frame(cfg: dict, title: str, out: Path):
    r = cfg["render"]
    W, H, win = r["width"], r["height"], r["window"]
    fp = str(font_path(cfg))
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)
    # 영상 창은 투명하게 뚫는다
    d.rectangle([win["x"], win["y"], win["x"] + win["w"] - 1, win["y"] + win["h"] - 1], fill=(0, 0, 0, 0))
    lw = r["line_width"]
    for y in (win["y"] - lw, win["y"] + win["h"]):
        d.rectangle([0, y, W, y + lw - 1], fill=r["line_color"])
    _draw_center(d, title.replace("\\n", "\n"), ImageFont.truetype(fp, r["title_size"]),
                 W / 2, win["y"] / 2)
    _draw_center(d, f"@{cfg['channel_name']}", ImageFont.truetype(fp, r["footer_size"]),
                 W / 2, H - 150, fill=(200, 200, 200, 255))
    img.save(out)


def _ass_time(t: float) -> str:
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def make_ass(cfg: dict, timings: list[dict], font_name: str, out: Path):
    r = cfg["render"]
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {r['width']}
PlayResY: {r['height']}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,{font_name},{r['subtitle_size']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,5,0,8,60,60,{r['subtitle_y']},1
Style: Hook,{font_name},{int(r['subtitle_size'] * 1.1)},&H0000F0FF,&H0000F0FF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,6,0,8,60,60,{r['subtitle_y']},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for i, t in enumerate(timings):
        style = "Hook" if i == 0 else "Main"
        text = t["text"].replace("\n", " ").replace("{", "(").replace("}", ")")
        ev.append(f"Dialogue: 0,{_ass_time(t['start'])},{_ass_time(t['end'])},{style},,0,0,0,,{text}")
    out.write_text(head + "\n".join(ev) + "\n", encoding="utf-8")


def _assets(kind: str, tag: str, exts: set) -> list[Path]:
    base = ASSETS / kind
    files = [p for p in (base / tag).glob("*") if p.suffix.lower() in exts]
    if not files:
        files = [p for p in base.glob("*") if p.is_file() and p.suffix.lower() in exts]
    return sorted(files)


def _segments(timings, total):
    """같은 배경 태그가 이어지는 줄은 한 구간으로 묶는다."""
    segs = []
    for i, t in enumerate(timings):
        start = 0.0 if i == 0 else t["start"]
        end = total if i == len(timings) - 1 else timings[i + 1]["start"]
        if segs and segs[-1]["bg"] == t["bg"]:
            segs[-1]["end"] = end
        else:
            segs.append({"bg": t["bg"], "start": start, "end": end})
    return segs


def _bg_clip(cfg, seg, rng, out: Path):
    win, fps = cfg["render"]["window"], cfg["render"]["fps"]
    w, h, dur = win["w"], win["h"], max(seg["end"] - seg["start"], 0.1)
    cover = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps={fps},format=yuv420p"
    choices = _assets("backgrounds", seg["bg"], VIDEO_EXT | IMAGE_EXT)
    if not choices:
        media.run(["-f", "lavfi", "-i", f"gradients=s={w}x{h}:d={dur:.3f}:speed=0.008:r={fps}",
                   "-vf", "format=yuv420p,eq=brightness=-0.25", "-an", "-c:v", "libx264", "-preset", "veryfast",
                   str(out)])
        return
    src = rng.choice(choices)
    if src.suffix.lower() in IMAGE_EXT:
        # 정지 이미지는 천천히 확대해서 움직임을 준다
        frames = int(dur * fps) + 1
        vf = (f"scale={w * 2}:{h * 2}:force_original_aspect_ratio=increase,crop={w * 2}:{h * 2},"
              f"zoompan=z='min(1+on*0.0008,1.15)':d={frames}:s={w}x{h}:fps={fps},format=yuv420p")
        media.run(["-loop", "1", "-i", str(src), "-t", f"{dur:.3f}", "-vf", vf, "-an",
                   "-c:v", "libx264", "-preset", "veryfast", str(out)])
    else:
        clip_len = media.duration(src)
        offset = rng.uniform(0, max(clip_len - dur, 0)) if clip_len > dur else 0
        media.run(["-ss", f"{offset:.2f}", "-stream_loop", "-1", "-i", str(src), "-t", f"{dur:.3f}",
                   "-vf", cover, "-an", "-c:v", "libx264", "-preset", "veryfast", str(out)])


def render(cfg: dict, row) -> str:
    vid = row["id"]
    s = scriptgen.load(row)
    timings = json.loads(row["timings_json"])
    wd = WORK_DIR / str(vid)
    wd.mkdir(parents=True, exist_ok=True)
    rng = random.Random(vid)
    r = cfg["render"]
    total = media.duration(row["audio_path"]) + 0.4

    frame = wd / "frame.png"
    make_frame(cfg, s.frame_title, frame)
    fpath = font_path(cfg)
    font_name = ImageFont.truetype(str(fpath), 10).getname()[0]
    ass = wd / "subs.ass"
    make_ass(cfg, timings, font_name, ass)

    # 배경 구간 클립 → 이어 붙이기
    parts = []
    for i, seg in enumerate(_segments(timings, total)):
        p = wd / f"bg_{i:02d}.mp4"
        _bg_clip(cfg, seg, rng, p)
        parts.append(p)
    lst = wd / "bg.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\n" for p in parts), encoding="utf-8")
    bg = wd / "bg.mp4"
    media.run(["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(bg)])

    # 효과음: 줄 시작점에 배치
    inputs = ["-i", str(bg), "-i", str(frame), "-i", row["audio_path"]]
    sfx_filters, sfx_labels = [], []
    for t in timings:
        if t["sfx"] == "none":
            continue
        files = _assets("sfx", t["sfx"], AUDIO_EXT)
        if not files:
            continue
        idx = len(inputs) // 2
        inputs += ["-i", str(rng.choice(files))]
        ms = int(t["start"] * 1000)
        sfx_filters.append(f"[{idx}:a]adelay={ms}|{ms},volume={r['sfx_volume']}[s{idx}]")
        sfx_labels.append(f"[s{idx}]")

    win = r["window"]
    fonts_dir = str(fpath.parent).replace("\\", "/").replace(":", "\\:")
    ass_s = str(ass).replace("\\", "/").replace(":", "\\:")
    vf = (f"color=c=black:s={r['width']}x{r['height']}:r={r['fps']}:d={total:.3f}[base];"
          f"[base][0:v]overlay={win['x']}:{win['y']}:shortest=1[v1];"
          f"[v1][1:v]overlay=0:0[v2];"
          f"[v2]subtitles='{ass_s}':fontsdir='{fonts_dir}'[v]")
    if sfx_labels:
        af = ";".join(sfx_filters) + ";" + f"[2:a]{''.join(sfx_labels)}amix=inputs={1 + len(sfx_labels)}:normalize=0:duration=first[a]"
    else:
        af = "[2:a]anull[a]"
    out = VIDEO_DIR / f"{vid:05d}.mp4"
    media.run([*inputs, "-filter_complex", vf + ";" + af, "-map", "[v]", "-map", "[a]",
               "-t", f"{total:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
               "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])
    with db.connect() as c:
        db.set_video(c, vid, status="rendered", video_path=str(out))
    return str(out)


def run(cfg: dict) -> list[str]:
    with db.connect() as c:
        rows = db.videos_by_status(c, "voiced")
    out = []
    for row in rows:
        try:
            out.append(render(cfg, row))
        except RuntimeError as e:
            print(f"  ! 영상 {row['id']} 렌더 실패: {e}")
    return out
