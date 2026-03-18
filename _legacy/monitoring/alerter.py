"""deadletter monitoring — Discord/Slack 알림

시스템 이벤트와 에러를 Discord webhook으로 전송한다.
"""

import json
import logging
from datetime import datetime

import requests

import config

logger = logging.getLogger(__name__)


def send_discord_alert(
    title: str,
    message: str,
    level: str = "info",
    fields: dict | None = None,
) -> bool:
    """Discord webhook으로 알림을 전송한다.

    Args:
        title: 알림 제목
        message: 알림 내용
        level: "info" | "warning" | "error"
        fields: 추가 필드 dict

    Returns:
        전송 성공 여부
    """
    webhook_url = config.DISCORD_WEBHOOK_URL
    if not webhook_url:
        logger.debug("Discord webhook 미설정 — 알림 건너뜀")
        return False

    color_map = {
        "info": 0x7BA882,     # sage
        "warning": 0xC17A5A,  # terra
        "error": 0xCC3333,    # red
    }

    embed = {
        "title": f"{'🔴' if level == 'error' else '🟡' if level == 'warning' else '🟢'} {title}",
        "description": message,
        "color": color_map.get(level, 0x7BA882),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "footer": {"text": "deadletter monitoring"},
    }

    if fields:
        embed["fields"] = [
            {"name": k, "value": str(v), "inline": True}
            for k, v in fields.items()
        ]

    payload = {"embeds": [embed]}

    try:
        response = requests.post(
            webhook_url,
            json=payload,
            timeout=10,
        )
        if response.status_code in (200, 204):
            logger.debug("Discord 알림 전송 성공: %s", title)
            return True

        logger.warning("Discord 알림 실패 (status %d)", response.status_code)
        return False

    except Exception as e:
        logger.error("Discord 알림 에러: %s", e)
        return False


def alert_new_letter(letter_id: str, language: str) -> bool:
    """새 편지 게시 알림."""
    return send_discord_alert(
        title="새 편지 게시",
        message=f"편지 **{letter_id}** 이(가) 웹사이트에 게시되었습니다.",
        level="info",
        fields={"Language": language},
    )


def alert_crisis_detected(matched_keywords: list[str]) -> bool:
    """위기 감지 알림."""
    return send_discord_alert(
        title="위기 감지",
        message="사용자 메시지에서 위기 신호가 감지되었습니다. 위기 리소스가 자동 전달되었습니다.",
        level="warning",
        fields={"Keywords": ", ".join(matched_keywords)},
    )


def alert_error(component: str, error_message: str) -> bool:
    """시스템 에러 알림."""
    return send_discord_alert(
        title=f"시스템 에러: {component}",
        message=error_message,
        level="error",
    )


def alert_health_report(report: dict) -> bool:
    """상태 체크 리포트 알림."""
    checks_summary = "\n".join(
        f"- **{name}**: [{c['status']}] {c['message']}"
        for name, c in report["checks"].items()
    )
    return send_discord_alert(
        title=f"상태 리포트: {report['overall'].upper()}",
        message=checks_summary,
        level="error" if report["overall"] == "error" else "info",
    )
