"""deadletter publisher — OG 이미지 자동 생성

편지별 소셜 공유용 OG 이미지를 SVG 기반으로 생성한다.
(향후 Playwright/Puppeteer로 고도화 가능)
"""

import logging
from pathlib import Path

import config

logger = logging.getLogger(__name__)

OG_SVG_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#1a1614"/>
  <text x="80" y="80" font-family="Georgia, serif" font-size="24" fill="#C17A5A">deadletter</text>
  <line x1="80" y1="100" x2="1120" y2="100" stroke="#333" stroke-width="1"/>
  <text x="80" y="160" font-family="Georgia, serif" font-size="18" fill="#666">{letter_id}</text>
  <foreignObject x="80" y="190" width="1040" height="300">
    <p xmlns="http://www.w3.org/1999/xhtml"
       style="font-family: Georgia, serif; font-size: 28px; color: #e8e0d8; line-height: 1.6; margin: 0;">
      "{text}"
    </p>
  </foreignObject>
  <text x="80" y="560" font-family="monospace" font-size="16" fill="#555">send what you can't say</text>
</svg>"""


def generate_og_image(
    letter_id: str,
    text: str,
    output_dir: Path | None = None,
) -> Path:
    """편지용 OG 이미지 SVG를 생성한다.

    Args:
        letter_id: 편지 ID (e.g., "DL-0042")
        text: 편지 텍스트 (truncated)
        output_dir: 출력 디렉토리

    Returns:
        생성된 SVG 파일 경로
    """
    if output_dir is None:
        output_dir = config.WEB_DATA_PATH / "og"

    output_dir.mkdir(parents=True, exist_ok=True)

    # 텍스트 길이 제한 (OG 카드용)
    display_text = text[:150] + "..." if len(text) > 150 else text
    # XML 이스케이프
    display_text = (
        display_text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )

    svg_content = OG_SVG_TEMPLATE.format(
        letter_id=letter_id,
        text=display_text,
    )

    output_path = output_dir / f"{letter_id}.svg"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    logger.info("OG 이미지 생성: %s", output_path)
    return output_path
