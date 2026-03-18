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

// 유해 콘텐츠 키워드 (성적, 욕설, 혐오)
const PROFANITY_KO = [
  "씨발", "시발", "ㅅㅂ", "ㅆㅂ", "씹", "좆", "ㅈㄹ", "지랄",
  "병신", "ㅂㅅ", "미친년", "미친놈", "꺼져", "닥쳐",
  "개새끼", "개새", "개년", "년놈", "썅", "니미", "느금마",
  "호로", "후레", "애미", "애비", "엠창", "니엄마",
  "ㅗ", "ㅁㅊ",
];

const PROFANITY_EN = [
  "fuck", "shit", "bitch", "asshole", "dick", "pussy",
  "bastard", "damn", "crap", "whore", "slut",
  "motherfucker", "cock", "cunt",
];

const SEXUAL_KO = [
  "섹스", "성관계", "자위", "포르노", "야동", "보지", "자지",
  "강간", "성폭행", "성추행", "몰카", "딸딸이",
  "떡치", "박히", "따먹", "빨아", "핥아",
  "가슴 만", "엉덩이 만", "벗겨", "알몸",
  "19금", "음란", "변태",
];

const SEXUAL_EN = [
  "sex", "porn", "nude", "naked", "masturbat",
  "rape", "molest", "blowjob", "handjob",
  "orgasm", "erotic", "hentai", "xxx",
];

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

export function detectHarmful(text: string): string | null {
  const lower = text.toLowerCase();
  const normalized = lower.replace(/\s+/g, "");

  if (
    PROFANITY_KO.some((kw) => normalized.includes(kw)) ||
    PROFANITY_EN.some((kw) => lower.includes(kw))
  ) {
    return "욕설이나 비속어가 포함된 편지는 보낼 수 없어요.";
  }

  if (
    SEXUAL_KO.some((kw) => normalized.includes(kw)) ||
    SEXUAL_EN.some((kw) => lower.includes(kw))
  ) {
    return "성적인 내용이 포함된 편지는 보낼 수 없어요.";
  }

  return null;
}

export function detectLanguage(text: string): "ko" | "en" {
  const koreanChars = [...text].filter(
    (c) => c >= "\uAC00" && c <= "\uD7A3",
  ).length;
  return koreanChars > text.length * 0.15 ? "ko" : "en";
}
