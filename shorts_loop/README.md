# shorts_loop — 썰 채널 쇼츠 자동화 루프

강의 순서(발굴 → 대본 → 녹음 → 편집 → 업로드 → 분석)를 그대로 자동화하되,
남의 영상을 받거나 녹화해서 다시 올리는 단계는 없습니다. 모든 영상은 **직접 만든 대본과
직접 녹음했거나 라이선스가 있는 음성, 직접 고른 배경 소스**로 만듭니다.

```
① research   유튜브 쇼츠 메타데이터 수집 + 형식 인사이트 (영상 파일은 받지 않음)
② ideas      시청자 제보(CSV) / 직접 메모 / LLM 창작 소재
③ script     결말→설명→과정→의견(+CTA) 대본, 줄마다 효과음·배경 태그
④ voice      직접 녹음(manual) 또는 ElevenLabs TTS → 자막 타이밍
⑤ render     1080×1920 틀 + 배경 + 자막 + 효과음 → mp4
⑥ review     사람 검수 대시보드 (승인한 것만 다음 단계로)
⑦ upload     점심·저녁 슬롯에 예약 공개
⑧ collect    48시간·7일 성과 수집
⑨ learn      카테고리·후킹 유형별 가중치 → ②③에 반영
```

## 설치

```bash
pip install -r shorts_loop/requirements.txt   # ffmpeg 도 필요 (brew/apt/winget install ffmpeg)
cp shorts_loop/.env.example shorts_loop/.env          # 키 입력
cp shorts_loop/config.example.json shorts_loop/config.json   # 채널명·니치·폰트 수정
python -m shorts_loop init
```

**준비물**

| 항목 | 위치 | 비고 |
|---|---|---|
| 한글 폰트 | `config.json` 의 `render.font_path` 또는 `assets/fonts/` | 눈누에서 상업 이용 가능한 폰트 |
| 배경 소스 | `assets/backgrounds/<태그>/` (office, street, home, school, cafe, night, abstract) | 직접 촬영본, Pexels·Pixabay 등 라이선스 확인된 영상·이미지. 비어 있으면 그라데이션으로 대체 |
| 효과음 | `assets/sfx/<태그>/` (whoosh, pop, ding, boom, shock, laugh) | YouTube 오디오 보관함 등 라이선스가 명확한 것 |
| Claude API 키 | `.env` `ANTHROPIC_API_KEY` | 소재·대본·인사이트 |
| YouTube API 키 | `.env` `YOUTUBE_API_KEY` | 리서치(읽기 전용) |
| OAuth 클라이언트 | `.env` `YOUTUBE_CLIENT_SECRET` | 업로드·성과 수집. 최초 1회 `python -m shorts_loop auth` |

## 매일 돌리기

```bash
python -m shorts_loop daily          # ⑧⑨ → ①(주 1회) → ② → ③ → ④ → ⑤ → ⑦
python -m shorts_loop review         # http://127.0.0.1:8765 에서 검수 (하루 15~20분)
```

cron 예시 (매일 오전 9시):

```
0 9 * * * cd /path/to/deadletter && python -m shorts_loop daily >> shorts_loop/data/daily.log 2>&1
```

Windows 는 작업 스케줄러에 같은 명령을 등록합니다. 렌더에 ffmpeg 와 로컬 파일이 필요하므로
GitHub Actions 보다 내 PC나 작은 서버에서 돌리는 쪽이 맞습니다.

## 직접 녹음(manual) 흐름

1. `daily` 또는 `voice` 를 실행하면 대본이 `data/work/<id>/script.txt` 에 생깁니다.
2. 줄마다 0.3초쯤 쉬면서 읽고 `data/audio/<id>.wav` (m4a, mp3 도 가능)로 저장합니다.
3. 다음 `daily` 때 쉼 구간을 찾아 자막을 자동으로 맞추고 렌더합니다.

`python -m shorts_loop status` 로 녹음 대기 목록을 볼 수 있습니다.

## 개별 명령

```bash
python -m shorts_loop research --analyze       # ①
python -m shorts_loop ideas import 응답.csv     # ② 구글 폼 응답 (동의 열이 있으면 동의한 행만)
python -m shorts_loop ideas add "제목" "요지" --category 직장
python -m shorts_loop ideas suggest -n 6
python -m shorts_loop script -n 2               # ③
python -m shorts_loop voice                     # ④
python -m shorts_loop render                    # ⑤
python -m shorts_loop upload --dry-run          # ⑦ 슬롯만 확인
python -m shorts_loop collect && python -m shorts_loop learn && python -m shorts_loop report
```

## 안전장치

- **검수 없이는 업로드되지 않습니다.** `rendered` 에서 `approved` 로 바꾸는 건 대시보드뿐입니다.
- 더미 음성(`voice.provider=dummy`)으로 만든 영상은 승인 버튼이 막혀 있습니다.
- 대본 자동 검사: 길이, 첫 줄 후킹 여부, 금지어, 전화번호, 이름+호칭 패턴, 모델이 남긴 위험 메모.
- 설명란에 "각색된 이야기" 문구를 자동으로 넣고, AI 음성을 쓰면 합성 콘텐츠 표시를 켭니다
  (`upload.synthetic_media`).
- 성과가 3주 동안 KPI에 못 미친 카테고리는 창작 소재에서 자동으로 빠집니다. 시청자 제보는 예외입니다.
- 검수 대기열이 이틀치(`max_per_day × 2`)를 넘으면 새 대본을 만들지 않습니다.

## 알아둘 제약

- Google Cloud 프로젝트가 **YouTube API 감사**를 통과하기 전에는 API로 올린 영상이 비공개로 고정됩니다.
  그 전까지는 `upload --dry-run` 으로 시간만 정하고 Studio 에서 직접 올리세요.
- YouTube Data API 기본 할당량은 하루 10,000 단위입니다. 검색 1회에 100, 업로드 1회에 약 1,600 단위가
  듭니다. `research.keywords` 는 5~10개로 유지하세요.
- 스와이프 이탈률은 API로 제공되지 않아 Studio 에서 확인해야 합니다.
- ElevenLabs 등 TTS는 상업 이용이 허용된 요금제에서만 쓰세요.
