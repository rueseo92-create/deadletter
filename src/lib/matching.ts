/**
 * deadletter — 편지 매칭 로직
 *
 * 규칙:
 * 1. 보완 카테고리 우선 (parent ↔ child, younger_self ↔ future_self)
 * 2. 같은 카테고리 2순위 (ex_lover ↔ ex_lover)
 * 3. 같은 감정 3순위
 * 4. 자기 편지는 제외
 */

import type { Letter, LetterCategory, LetterEmotion } from "@/types/database";
import { getComplementCategory } from "./categories";

interface MatchCandidate {
  letter: Letter;
  score: number;
}

export function findBestMatch(
  newLetter: Letter,
  candidates: Letter[],
): Letter | null {
  const complement = getComplementCategory(newLetter.category);

  const scored: MatchCandidate[] = candidates
    .filter((c) => c.author_id !== newLetter.author_id) // 자기 편지 제외
    .filter((c) => !c.matched_letter_id) // 이미 매칭된 편지 제외
    .map((candidate) => {
      let score = 0;

      // 보완 카테고리 매칭 (최고 점수)
      if (candidate.category === complement) {
        score += 10;
      }

      // 같은 카테고리
      if (candidate.category === newLetter.category) {
        score += 5;
      }

      // 같은 감정
      if (candidate.emotion === newLetter.emotion) {
        score += 3;
      }

      // 같은 언어
      if (candidate.language === newLetter.language) {
        score += 2;
      }

      // 최신 편지 약간 우대
      const ageHours =
        (Date.now() - new Date(candidate.created_at).getTime()) / 3600000;
      if (ageHours < 24) score += 1;

      return { letter: candidate, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].letter : null;
}
