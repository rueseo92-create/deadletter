"""내 영상 모음 쇼츠: 직접 찍었거나 권리가 있는 클립을 자동으로 잘라 세로 쇼츠로 만든다.

assets/my_clips/<프로젝트>/ 에 영상과 project.txt 를 넣는다.

    제목: 주말 캠핑 하이라이트 30초
    훅: 이 장면 때문에 다시 간다      (첫 3초 상단 큰 글씨, 선택)
    설명: 가평 캠핑장에서 찍은 장면 모음
    태그: 캠핑, 브이로그, 가평
    권리: 본인 촬영                    (필수: 본인 촬영 / 라이선스 보유)
    클립당 초: 4
    # 파일별 구간과 자막을 직접 정하려면 (선택)
    clip1.mp4 00:03-00:07 | 텐트 치는 데 40분 걸림

구간을 안 정하면 클립마다 소리가 가장 큰(웃음·환호·액션) 구간을 자동으로 고른다.
원본 tiktok-practice 의 편집 방식(구간 자르기 → 세로 맞춤 → 이어 붙이기)을 쓰되,
원본 화면을 흐린 배경 위에 얹어 잘림 없이 1080x1920 으로 만들고 소리는 살린다.
결과는 검수 대시보드(review)로 가고, 승인한 것만 예약 업로드된다.
"""
import json
import re
from pathlib import Path

from . import db, media, render, scriptgen
from .config import ASSETS, VIDEO_DIR, WORK_DIR

CLIPS = ASSETS / "my_clips"
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}
RIGHTS_OK = ("본인 촬영", "본인촬영", "직접 촬영", "라이선스 보유", "라이센스 보유", "own", "licensed")


def _ts(s: str) -> float:
    parts = [float(x) for x in s.strip().split(":")]
    sec = 0.0
    for p in parts:
        sec = sec * 60 + p
    return sec


def parse_project(folder: Path) -> dict:
    cfg = {"title": folder.name, "hook": "", "description": "", "tags": [], "rights": "", "seconds": 4.0,
           "ranges": {}}
    p = folder / "project.txt"
    if not p.exists():
        return cfg
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"(\S+\.(?:mp4|mov|m4v|webm|mkv))\s+([\d:.]+)\s*-\s*([\d:.]+)\s*(?:\|\s*(.*))?$", line, re.I)
        if m:
            cfg["ranges"][m.group(1)] = (_ts(m.group(2)), _ts(m.group(3)), (m.group(4) or "").strip())
            continue
        if ":" in line:
            k, v = [x.strip() for x in line.split(":", 1)]
            if k == "제목":
                cfg["title"] = v
            elif k == "훅":
                cfg["hook"] = v
            elif k == "설명":
                cfg["description"] = v
            elif k == "태그":
                cfg["tags"] = [t.strip().lstrip("#") for t in re.split(r"[,\s]+", v) if t.strip()]
            elif k == "권리":
                cfg["rights"] = v
            elif k in ("클립당 초", "클립당초"):
                cfg["seconds"] = max(1.0, min(15.0, float(v)))
    return cfg


def loudest_window(path: Path, seconds: float) -> float:
    """1초 단위 소리 크기(RMS)를 재서 가장 시끄러운 구간의 시작점을 고른다. 소리가 없으면 1초 지점."""
    import subprocess
    dur = media.duration(path)
    if dur <= seconds + 0.5:
        return 0.0
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af",
                        "asetnsamples=n=44100,astats=metadata=1:reset=1,"
                        "ametadata=print:key=lavfi.astats.Overall.RMS_level", "-f", "null", "-"],
                       capture_output=True, text=True)
    levels = []
    for v in re.findall(r"RMS_level=(-?[\d.]+|-inf)", p.stderr):
        levels.append(-120.0 if v == "-inf" else float(v))
    if not levels:
        return min(1.0, dur - seconds)
    win = max(1, int(round(seconds)))
    best, best_i = None, 0
    for i in range(0, max(1, len(levels) - win + 1)):
        score = sum(levels[i:i + win]) / win
        if best is None or score > best:
            best, best_i = score, i
    return float(min(best_i, max(0.0, dur - seconds)))


def _has_audio(path: Path) -> bool:
    import subprocess
    p = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return bool(p.stdout.strip())


def _part(src: Path, start: float, seconds: float, out: Path, w: int = 1080, h: int = 1920, fps: int = 30):
    """원본 전체를 흐린 배경 위에 얹어 세로 화면을 채운다 (잘림 없음)."""
    vf = (f"[0:v]split=2[a][b];"
          f"[a]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=24:2,eq=brightness=-0.12[bg];"
          f"[b]scale={w}:{h}:force_original_aspect_ratio=decrease[fg];"
          f"[bg][fg]overlay=(W-w)/2:(H-h)/2,fps={fps},format=yuv420p,setsar=1[v]")
    args = ["-ss", f"{start:.2f}", "-t", f"{seconds:.2f}", "-i", str(src)]
    if _has_audio(src):
        af = ["-map", "[v]", "-map", "0:a:0", "-af", "aresample=44100,aformat=channel_layouts=stereo"]
    else:
        args += ["-f", "lavfi", "-t", f"{seconds:.2f}", "-i", "anullsrc=r=44100:cl=stereo"]
        af = ["-map", "[v]", "-map", "1:a:0"]
    media.run([*args, "-filter_complex", vf, *af, "-t", f"{seconds:.2f}", "-c:v", "libx264", "-preset", "veryfast",
               "-crf", "21", "-c:a", "aac", "-b:a", "160k", str(out)])


def _ass(cfg: dict, hook: str, captions: list[tuple[float, float, str]], out: Path, font_name: str):
    r = cfg["render"]
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {r['width']}
PlayResY: {r['height']}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,{font_name},{int(r['title_size'] * 1.05)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,3,6,0,8,70,70,170,1
Style: Cap,{font_name},{r['subtitle_size']},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,5,0,2,70,70,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    def esc(x: str) -> str:
        return x.replace("\n", " ").replace("{", "(").replace("}", ")")
    hook = esc(hook)
    captions = [(a, b, esc(c)) for a, b, c in captions]
    ev = []
    if hook:
        ev.append(f"Dialogue: 0,{render._ass_time(0)},{render._ass_time(3.0)},Hook,,0,0,0,,{hook}")
    for s, e, text in captions:
        if text:
            ev.append(f"Dialogue: 0,{render._ass_time(s)},{render._ass_time(e)},Cap,,0,0,0,,{text}")
    out.write_text(head + "\n".join(ev) + "\n", encoding="utf-8")


def build(cfg: dict, folder: Path) -> int:
    proj = parse_project(folder)
    clips = sorted(p for p in folder.iterdir() if p.suffix.lower() in VIDEO_EXT)
    if not clips:
        raise SystemExit(f"{folder} 에 영상이 없습니다.")
    clips = clips[:12]
    wd = WORK_DIR / f"montage_{folder.name}"
    wd.mkdir(parents=True, exist_ok=True)
    parts, captions, t = [], [], 0.0
    for i, src in enumerate(clips):
        if src.name in proj["ranges"]:
            start, end, cap = proj["ranges"][src.name]
            seconds = max(0.5, end - start)
        else:
            seconds = min(proj["seconds"], media.duration(src))
            start, cap = loudest_window(src, seconds), ""
        part = wd / f"part_{i:02d}.mp4"
        _part(src, start, seconds, part)
        d = media.duration(part)
        captions.append((t, t + d, cap))
        parts.append(part)
        t += d
    joined = wd / "joined.mp4"
    inputs = []
    for p in parts:
        inputs += ["-i", str(p)]
    concat = "".join(f"[{i}:v][{i}:a]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=1:a=1[v][a]"
    media.run([*inputs, "-filter_complex", concat, "-map", "[v]", "-map", "[a]", "-c:v", "libx264",
               "-preset", "veryfast", "-crf", "21", "-c:a", "aac", "-b:a", "160k", str(joined)])

    fpath = render.font_path(cfg)
    from PIL import ImageFont
    font_name = ImageFont.truetype(str(fpath), 10).getname()[0]
    ass = wd / "text.ass"
    _ass(cfg, proj["hook"], captions, ass, font_name)
    fonts_dir = str(fpath.parent).replace("\\", "/").replace(":", "\\:")
    ass_s = str(ass).replace("\\", "/").replace(":", "\\:")

    rights_ok = any(k in proj["rights"] for k in RIGHTS_OK)
    flags = [] if rights_ok else ["권리 확인 필요: project.txt 에 '권리: 본인 촬영' 또는 '권리: 라이선스 보유' (업로드 금지)"]
    if t > 60:
        flags.append(f"길이 {t:.0f}초 - 쇼츠는 60초 이하 권장")

    s = scriptgen.Script(
        title=proj["title"][:95], frame_title=proj["hook"] or proj["title"], hook_type="montage",
        lines=[scriptgen.Line(section="hook" if i == 0 else "process", text=c or f"(클립 {i + 1})",
                              sfx="none", bg="abstract") for i, (_, _, c) in enumerate(captions)],
        description=proj["description"], tags=proj["tags"], risk_notes=[])
    tags = list(dict.fromkeys(proj["tags"] + ["shorts"]))[:15]
    with db.connect() as c:
        vid = c.execute(
            """INSERT INTO videos (idea_id, status, title, description, tags, category, hook_type, script_json,
                                   flags, created_at, updated_at) VALUES (NULL,'rendering',?,?,?,?,?,?,?,?,?)""",
            (proj["title"][:95], proj["description"], json.dumps(tags, ensure_ascii=False), "montage", "montage",
             s.model_dump_json(), json.dumps(flags, ensure_ascii=False), db.now(), db.now())).lastrowid
    out = VIDEO_DIR / f"m{vid:05d}.mp4"
    media.run(["-i", str(joined), "-vf", f"subtitles='{ass_s}':fontsdir='{fonts_dir}'", "-c:v", "libx264",
               "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart",
               str(out)])
    with db.connect() as c:
        db.set_video(c, vid, status="rendered", video_path=str(out), audio_path=str(joined))
    (folder / ".done").write_text(str(vid), encoding="utf-8")
    return vid


def run(cfg: dict) -> list[int]:
    """아직 만들지 않은 프로젝트 폴더를 모두 처리한다."""
    CLIPS.mkdir(parents=True, exist_ok=True)
    made = []
    for folder in sorted(p for p in CLIPS.iterdir() if p.is_dir() and not p.name.startswith("_")):
        if (folder / ".done").exists():
            continue
        try:
            made.append(build(cfg, folder))
        except (RuntimeError, SystemExit) as e:
            print(f"  ! {folder.name}: {e}")
    return made
