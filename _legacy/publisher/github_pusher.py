"""deadletter publisher — GitHub auto-push

생성된 letters.json을 GitHub Pages 저장소에 자동 push한다.
"""

import subprocess
import logging
from pathlib import Path

import config

logger = logging.getLogger(__name__)


def push_to_github(
    json_path: str,
    repo_path: str | None = None,
    commit_message: str = "update letters [automated]",
) -> bool:
    """생성된 JSON을 GitHub에 push한다.

    Args:
        json_path: letters.json 파일 경로
        repo_path: Git 저장소 로컬 경로 (None이면 BASE_DIR 사용)
        commit_message: 커밋 메시지

    Returns:
        push 성공 여부
    """
    if repo_path is None:
        repo_path = str(config.BASE_DIR)

    commands = [
        f"cd {repo_path}",
        f"cp {json_path} web/data/letters.json",
        "git add web/data/letters.json",
        f'git commit -m "{commit_message}"',
        "git push origin main",
    ]

    try:
        result = subprocess.run(
            " && ".join(commands),
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode == 0:
            logger.info("GitHub push 성공")
            return True

        # 변경 사항 없음 (이미 최신)
        if "nothing to commit" in result.stdout:
            logger.info("변경 사항 없음 — push 건너뜀")
            return True

        logger.error("GitHub push 실패: %s", result.stderr.strip())
        return False

    except subprocess.TimeoutExpired:
        logger.error("GitHub push 타임아웃 (60초)")
        return False
    except Exception as e:
        logger.error("GitHub push 에러: %s", e)
        return False


def publish_and_push() -> bool:
    """편지를 JSON으로 생성하고 GitHub에 push한다.

    Returns:
        성공 여부
    """
    from publisher.letter_publisher import write_letters_json

    json_path = write_letters_json()
    return push_to_github(str(json_path))
