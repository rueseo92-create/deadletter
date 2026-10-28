"""
research.py - 쓰기 전 웹 조사 (Claude 웹 검색)

AI 도구·자동화·부업 글은 요금, 메뉴 경로, 제한, 정책처럼 자주 바뀌는 사실이 핵심이다.
모델의 기억 대신 공식 문서·공식 블로그·요금 페이지를 실제로 찾아 출처 URL과 함께 정리하고,
글쓴이와 슬롭 킬러 심사위원 모두 이 자료를 근거로 쓴다.
"""

import re

import claude_client

SYSTEM = """너는 한국어 AI 실무 매체의 리서처다. 웹 검색으로 아래 주제의 '지금 기준' 사실을 확인한다.
우선순위: 공식 문서·공식 블로그·공식 요금 페이지·플랫폼 정책 페이지 > 신뢰할 만한 언론 > 기타.
찾을 것: 요금·무료 범위, 사용 조건(계정·지역·연령), 실제 메뉴 경로나 시작 절차, 제한·한도, 최근 바뀐 점,
부업 주제라면 플랫폼 수수료·수익화 조건·AI 생성물 정책·저작권 정책.

최종 답변 형식(이것만 출력):
- 확인된 사실 한 문장 [출처: 페이지 제목 | URL]
- ...
확인하지 못한 것: (찾았지만 근거가 없던 항목들)
사실은 12개 이내로, 출처 URL은 실제로 검색 결과에서 본 것만 쓴다."""


def run(topic: str, context: str, max_searches: int = 6) -> dict:
    messages = [{"role": "user", "content": f"주제: {topic}\n\n참고 맥락:\n{context[:3000]}\n\n조사해서 정리해라."}]
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": max_searches}]
    client = claude_client.client()
    resp = None
    for _ in range(4):  # pause_turn 이면 같은 대화를 다시 보내 이어서 진행
        resp = client.messages.create(model=claude_client.MODEL, max_tokens=16000, system=SYSTEM,
                                      tools=tools, messages=messages, output_config={"effort": "medium"})
        if resp.stop_reason != "pause_turn":
            break
        messages = messages + [{"role": "assistant", "content": resp.content}]
    notes = claude_client.text_of(resp).strip() if resp else ""
    seen = set()
    for block in (resp.content if resp else []):
        if getattr(block, "type", "") == "web_search_tool_result" and isinstance(block.content, list):
            for r in block.content:
                if getattr(r, "url", None):
                    seen.add(r.url)
    sources = []
    for title, url in re.findall(r"\[출처:\s*(.+?)\s*\|\s*(https?://[^\]\s]+)\s*\]", notes):
        if url not in [s["url"] for s in sources]:
            sources.append({"name": title[:80], "url": url, "verified": url in seen or not seen})
    return {"notes": notes[:5000], "sources": sources[:10]}


def prompt_block(r: dict) -> str:
    if not r.get("notes"):
        return ""
    return ("[웹 조사 결과 - 도구 요금·메뉴·제한·정책은 이 자료에 있는 것만 단정한다. 없는 건 '공식 페이지에서 확인' 으로 안내]\n"
            + r["notes"])
