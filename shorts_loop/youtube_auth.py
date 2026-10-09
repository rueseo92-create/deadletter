"""YouTube OAuth. 최초 1회 `python -m shorts_loop auth` 로 브라우저 동의 후 토큰을 저장한다."""
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from .config import TOKEN_PATH, env

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]


def credentials(interactive: bool = False) -> Credentials:
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    if not creds or not creds.valid:
        if not interactive:
            raise SystemExit("YouTube 인증이 없습니다. 먼저 `python -m shorts_loop auth` 를 실행하세요.")
        flow = InstalledAppFlow.from_client_secrets_file(env("YOUTUBE_CLIENT_SECRET"), SCOPES)
        creds = flow.run_local_server(port=0, open_browser=True)
    TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")
    return creds


def youtube():
    return build("youtube", "v3", credentials=credentials(), cache_discovery=False)


def analytics():
    return build("youtubeAnalytics", "v2", credentials=credentials(), cache_discovery=False)
