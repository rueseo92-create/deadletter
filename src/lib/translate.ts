const CACHE_KEY = "deadletter_translations";

function getCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setCache(key: string, value: string) {
  if (typeof window === "undefined") return;
  const cache = getCache();
  cache[key] = value;
  // 캐시 크기 제한 (최대 200개)
  const keys = Object.keys(cache);
  if (keys.length > 200) {
    delete cache[keys[0]];
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

type Lang = "ko" | "en" | "ja" | "zh";

// MyMemory API language codes
const LANG_CODES: Record<Lang, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh-CN",
};

export async function translate(
  text: string,
  from: Lang,
  to: Lang
): Promise<string> {
  if (from === to) return text;

  const cacheKey = `${from}>${to}:${text.slice(0, 100)}`;
  const cached = getCache()[cacheKey];
  if (cached) return cached;

  const fromCode = LANG_CODES[from] || from;
  const toCode = LANG_CODES[to] || to;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text.slice(0, 500)
      )}&langpair=${fromCode}|${toCode}`
    );
    const data = await res.json();
    const translated = data.responseData?.translatedText;
    if (translated && translated !== text) {
      setCache(cacheKey, translated);
      return translated;
    }
    return text;
  } catch {
    return text;
  }
}

export function detectLang(text: string): Lang {
  const chars = [...text];
  const koreanChars = chars.filter(
    (c) => c >= "\uAC00" && c <= "\uD7A3"
  ).length;
  const japaneseChars = chars.filter(
    (c) => (c >= "\u3040" && c <= "\u309F") || (c >= "\u30A0" && c <= "\u30FF")
  ).length;
  const chineseChars = chars.filter(
    (c) => c >= "\u4E00" && c <= "\u9FFF"
  ).length;

  const len = text.length || 1;
  if (koreanChars / len > 0.15) return "ko";
  if (japaneseChars / len > 0.1) return "ja";
  // Chinese characters also appear in Japanese, so check Japanese first
  if (chineseChars / len > 0.15) return "zh";
  return "en";
}
