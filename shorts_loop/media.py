"""ffmpeg / ffprobe 헬퍼."""
import json
import re
import subprocess


def run(args: list[str]):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args],
                       capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg 실패:\n{p.stderr[-2000:]}")


def duration(path) -> float:
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "json", str(path)], capture_output=True, text=True, check=True)
    return float(json.loads(p.stdout)["format"]["duration"])


def to_wav(src, dst):
    run(["-i", str(src), "-ac", "1", "-ar", "44100", str(dst)])


def silence(dst, seconds: float):
    run(["-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", f"{seconds:.3f}", str(dst)])


def silences(path, noise_db: int = -35, min_s: float = 0.18) -> list[tuple[float, float]]:
    """(시작, 끝) 무음 구간 목록."""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af",
                        f"silencedetect=noise={noise_db}dB:d={min_s}", "-f", "null", "-"],
                       capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", p.stderr)]
    return list(zip(starts, ends))
