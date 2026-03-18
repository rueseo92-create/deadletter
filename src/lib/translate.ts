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

export async function translate(
  text: string,
  from: "ko" | "en",
  to: "ko" | "en"
): Promise<string> {
  if (from === to) return text;

  const cacheKey = `${from}>${to}:${text.slice(0, 100)}`;
  const cached = getCache()[cacheKey];
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text.slice(0, 500)
      )}&langpair=${from}|${to}`
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

export function detectLang(text: string): "ko" | "en" {
  const koreanChars = [...text].filter(
    (c) => c >= "\uAC00" && c <= "\uD7A3"
  ).length;
  return koreanChars > text.length * 0.15 ? "ko" : "en";
}
