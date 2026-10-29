"""
research.py - 쓰기 전 웹 조사 (Claude 웹 검색)

AI 도구·자동화·마케팅 글은 요금, 메뉴 경로, 제한, 정책처럼 자주 바뀌는 사실이 핵심이다.
모델의 기억 대신 공식 문서·공식 블로그·요금 페이지를 실제로 찾아 출처 URL과 함께 정리하고,
글쓴이와 슬롭 킬러 심사위원 모두 이 자료를 근거로 쓴다.
"""

import re

import claude_client

SYSTEM = """너는 한국어 AI 실무 매체의 리서처다. 웹 검색으로 아래 주제의 '지금 기준' 사실을 확인한다.
우선순위: 공식 문서·공식 블로그·공식 요금 페이지·플랫폼 정책 페이지 > 신뢰할 만한 언론 > 기타.
찾을 것: 요금·무료 범위, 사용 조건(계정·지역·연령), 실제 메뉴 경로나 시작 절차, 제한·한도, 최근 바뀐 점,
마케팅 주제라면 플랫폼 운영 정책(네이버·구글·인스타)·광고 표시 규정·리뷰 정책·저작권.

최종 답변 형식(이것만 출력):
- 확인된 사실 한 문장 [출처: 페이지 제목 | URL]
- ...
확인하지 못한 것: (찾았지만 근거가 없던 항목들)
사실은 12개 이내로, 출처 URL은 실제로 검색·열람한 것만 쓴다.

조사 방법(검색 횟수가 제한돼 있으니 효율적으로):
1) 먼저 공식 페이지를 겨냥해 검색한다. 예: "zapier pricing site:zapier.com", "perplexity pro limits site:perplexity.ai", 영어 검색이 공식 문서를 더 잘 찾는다.
2) 공식 페이지 주소를 찾으면 web_fetch 로 그 페이지 본문을 직접 열어 숫자·조건을 확인한다. 검색 요약만 보고 단정하지 않는다.
3) 같은 내용을 여러 번 검색하지 않는다. 핵심 질문 3-4개에 집중한다."""


def run(topic: str, context: str, max_searches: int = 8, max_fetches: int = 5) -> dict:
    messages = [{"role": "user", "content": f"주제: {topic}\n\n참고 맥락:\n{context[:3000]}\n\n조사해서 정리해라."}]
    tools = [{"type": "web_search_20260209", "name": "web_search", "max_uses": max_searches},
             {"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": max_fetches}]
    client = claude_client.client()
    resp = None
    for _ in range(4):  # pause_turn 이면 같은 대화를 다시 보내 이어서 진행
        resp = client.messages.create(model=claude_client.MODEL, max_tokens=16000, system=SYSTEM,
                                      tools=tools, messages=messages, output_config={"effort": "medium"})
        if resp.stop_reason != "pause_turn":
            break
        messages = messages + [{"role": "assistant", "content": resp.content}]
    notes = claude_client.text_of(resp).strip() if resp else ""
    seen, titles, searches, errors = set(), {}, 0, []
    for block in (resp.content if resp else []):
        btype = getattr(block, "type", "")
        if btype == "server_tool_use":
            searches += 1
        if btype == "web_fetch_tool_result":
            c = block.content
            url = getattr(c, "url", None)
            if url:
                seen.add(url)
                titles.setdefault(url, getattr(getattr(c, "content", None), "title", None) or url)
            else:
                errors.append(getattr(c, "error_code", "fetch_error"))
        if btype == "web_search_tool_result":
            content = block.content
            if isinstance(content, list):
                for r in content:
                    if getattr(r, "url", None):
                        seen.add(r.url)
                        titles[r.url] = getattr(r, "title", "") or r.url
            else:  # 오류 객체 (예: 계정에서 웹 검색이 꺼져 있음)
                errors.append(getattr(content, "error_code", str(content))[:80])
        # 인용(citations)에 달린 출처도 모은다
        for c in getattr(block, "citations", None) or []:
            if getattr(c, "url", None):
                seen.add(c.url)
                titles.setdefault(c.url, getattr(c, "title", "") or c.url)
    fetched = sum(1 for b in (resp.content if resp else []) if getattr(b, "type", "") == "web_fetch_tool_result")
    print(f"  [조사] 도구 호출 {searches}회(열람 {fetched}), 결과 URL {len(seen)}개, 오류 {errors or '없음'}, stop={getattr(resp, 'stop_reason', None)}")
    if notes:
        print("  [조사] " + notes[:300].replace("\n", " / "))
    # 본문에 적힌 URL 중 실제 검색 결과로 본 것만 출처로 인정
    sources = []
    for url in re.findall(r"https?://[^\s\]\)|>\"']+", notes):
        url = url.rstrip(".,")
        if url in seen and url not in [s["url"] for s in sources]:
            sources.append({"name": titles.get(url, url)[:80], "url": url})
    if not seen:  # 검색이 아예 안 됐으면 기억에서 나온 '사실'은 쓰지 않는다
        return {"notes": "", "sources": [], "error": errors or ["no_search"]}
    return {"notes": notes[:5000], "sources": sources[:10]}


def prompt_block(r: dict) -> str:
    if not r.get("notes"):
        return ""
    return ("[웹 조사 결과 - 도구 요금·메뉴·제한·정책은 이 자료에 있는 것만 단정한다. 없는 건 '공식 페이지에서 확인' 으로 안내]\n"
            + r["notes"])
