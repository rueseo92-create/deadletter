"""④ 내레이션 (3강).

provider
- manual:     data/work/<id>/script.txt 를 보고 직접 녹음해서 data/audio/<id>.(wav|m4a|mp3) 로 저장.
              줄마다 0.3초쯤 쉬면 자막 싱크가 정확해진다.
- elevenlabs: 줄 단위로 TTS 생성 후 이어 붙인다. 타이밍이 정확하다. (상업 이용 가능한 요금제 필요)
- dummy:      무음. 파이프라인 테스트 전용. 업로드 금지.

결과: narration.wav + timings[{start, end, text, sfx, bg}]
"""
import json

import requests

from . import db, media, scriptgen
from .config import AUDIO_DIR, WORK_DIR, env


def _tts_elevenlabs(cfg: dict, text: str, out_mp3):
    vc = cfg["voice"]
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{vc['elevenlabs_voice_id']}",
        params={"output_format": "mp3_44100_128"},
        headers={"xi-api-key": env("ELEVENLABS_API_KEY")},
        json={"text": text, "model_id": vc["elevenlabs_model"]},
        timeout=120,
    )
    r.raise_for_status()
    out_mp3.write_bytes(r.content)


def _concat_lines(cfg: dict, wd, lines, make_line) -> tuple[str, list[dict]]:
    gap = cfg["voice"]["gap_ms"] / 1000
    gap_wav = wd / "gap.wav"
    media.silence(gap_wav, gap)
    parts, timings, t = [], [], 0.0
    for i, ln in enumerate(lines):
        wav = wd / f"line_{i:02d}.wav"
        make_line(i, ln, wav)
        d = media.duration(wav)
        timings.append({"start": round(t, 3), "end": round(t + d, 3), "text": ln.text,
                        "sfx": ln.sfx, "bg": ln.bg})
        parts += [wav, gap_wav]
        t += d + gap
    lst = wd / "concat.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\n" for p in parts), encoding="utf-8")
    out = wd / "narration.wav"
    media.run(["-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(out)])
    return str(out), timings


def _align_manual(audio, lines) -> list[dict]:
    """직접 녹음본: 글자 수 비례 위치에서 가장 가까운 무음 구간을 줄 경계로 쓴다."""
    total = media.duration(audio)
    sil = media.silences(audio)
    lead = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
    tail = sil[-1][0] if sil and sil[-1][1] >= total - 0.05 else total
    mids = [(a + b) / 2 for a, b in sil if lead < (a + b) / 2 < tail]
    chars = [max(len(l.text), 1) for l in lines]
    acc, bounds = 0, []
    for c in chars[:-1]:
        acc += c
        target = lead + (tail - lead) * acc / sum(chars)
        best = min(mids, key=lambda m: abs(m - target)) if mids else target
        if abs(best - target) > 1.2:  # 근처에 쉼이 없으면 비례값 사용
            best = target
        bounds.append(max(best, bounds[-1] + 0.3 if bounds else lead + 0.3))
    edges = [lead, *bounds, tail]
    return [{"start": round(edges[i], 3), "end": round(edges[i + 1], 3), "text": l.text,
             "sfx": l.sfx, "bg": l.bg} for i, l in enumerate(lines)]


def _find_manual(vid: int):
    for ext in ("wav", "m4a", "mp3"):
        p = AUDIO_DIR / f"{vid}.{ext}"
        if p.exists():
            return p
    return None


def process(cfg: dict, row) -> str:
    vid = row["id"]
    s = scriptgen.load(row)
    wd = WORK_DIR / str(vid)
    wd.mkdir(parents=True, exist_ok=True)
    (wd / "script.txt").write_text(
        f"[{s.title}]\n\n" + "\n".join(l.text for l in s.lines) + "\n", encoding="utf-8")
    provider = cfg["voice"]["provider"]

    if provider == "manual":
        src = _find_manual(vid)
        if not src:
            with db.connect() as c:
                db.set_video(c, vid, status="needs_audio")
            return "needs_audio"
        audio = wd / "narration.wav"
        media.to_wav(src, audio)
        timings = _align_manual(audio, s.lines)
        audio = str(audio)
    elif provider == "elevenlabs":
        def make(i, ln, wav):
            mp3 = wd / f"line_{i:02d}.mp3"
            _tts_elevenlabs(cfg, ln.text, mp3)
            media.to_wav(mp3, wav)
        audio, timings = _concat_lines(cfg, wd, s.lines, make)
    elif provider == "dummy":
        audio, timings = _concat_lines(
            cfg, wd, s.lines, lambda i, ln, wav: media.silence(wav, max(0.8, len(ln.text) * 0.14)))
    else:
        raise SystemExit(f"알 수 없는 voice.provider: {provider}")

    flags = json.loads(row["flags"] or "[]")
    if provider == "dummy" and "더미 음성(업로드 금지)" not in flags:
        flags.append("더미 음성(업로드 금지)")
    with db.connect() as c:
        db.set_video(c, vid, status="voiced", audio_path=audio, timings_json=timings, flags=flags)
    return "voiced"


def run(cfg: dict) -> dict:
    stats = {}
    with db.connect() as c:
        rows = db.videos_by_status(c, "scripted") + db.videos_by_status(c, "needs_audio")
    for row in rows:
        r = process(cfg, row)
        stats[r] = stats.get(r, 0) + 1
    return stats
