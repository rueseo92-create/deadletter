/**
 * deadletter — 개인정보 필터링 (클라이언트 사이드)
 * Stage 1: Regex 기반 한국어/영어 PII 패턴 치환
 */

const REPLACEMENT = "[REDACTED]";

const PATTERNS: Record<string, RegExp> = {
  phone_kr: /01[016789]-?\d{3,4}-?\d{4}/g,
  phone_intl: /\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ssn_kr: /\d{6}[-\s]?\d{7}/g,
  address_kr:
    /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[시도]?\s*\S+[시군구]\s*\S+[읍면동로길]/g,
  card_number: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  social_handle: /@[a-zA-Z0-9_.]{2,30}/g,
};

// 위기 키워드
const CRISIS_KEYWORDS_KO = [
  "죽고 싶", "죽고싶", "자살", "자해",
  "살고 싶지 않", "살기 싫", "끝내고 싶",
  "없어지고 싶", "사라지고 싶",
];

const CRISIS_KEYWORDS_EN = [
  "kill myself", "suicide", "self-harm", "self harm",
  "want to die", "end my life", "end it all",
  "don't want to live", "better off dead",
];

export function anonymize(text: string): {
  text: string;
  replacements: number;
} {
  let result = text;
  let replacements = 0;

  for (const [, pattern] of Object.entries(PATTERNS)) {
    const matches = result.match(pattern);
    if (matches) {
      replacements += matches.length;
      result = result.replace(pattern, REPLACEMENT);
    }
  }

  return { text: result, replacements };
}

export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    CRISIS_KEYWORDS_KO.some((kw) => lower.includes(kw)) ||
    CRISIS_KEYWORDS_EN.some((kw) => lower.includes(kw))
  );
}

export function detectLanguage(text: string): "ko" | "en" {
  const koreanChars = [...text].filter(
    (c) => c >= "\uAC00" && c <= "\uD7A3",
  ).length;
  return koreanChars > text.length * 0.15 ? "ko" : "en";
}
