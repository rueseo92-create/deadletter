export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

export const localeNames: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

export const ogLocales: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
};

export const htmlLangs: Record<Locale, string> = {
  ko: "ko",
  en: "en",
};

// Dictionary 타입
export interface Dictionary {
  meta: { siteDescription: string; defaultTitle: string };
  nav: Record<string, string>;
  home: {
    latest: string;
    all: string;
    viewAllPosts: string;
    noPosts: string;
    noPostsDesc: string;
    firstPostSoon: string;
    popularKeywords: string;
    newsletter: string;
    newsletterDesc: string;
    emailPlaceholder: string;
    subscribe: string;
    noSpam: string;
    aboutThisBlog: string;
    aboutItems: string[];
    coupangTitle: string;
    coupangDevTitle: string;
  };
  post: {
    readingTime: string;
    references: string;
    relatedPosts: string;
    viewAll: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    home: string;
    coupangReaderTitle: string;
    coupangDevTitle: string;
    koreanContentNotice: string;
  };
  search: {
    title: string;
    description: string;
    placeholder: string;
    button: string;
    popularKeywords: string;
    results: string;
    noResults: string;
    noResultsDesc: string;
    initialTitle: string;
    initialDesc: string;
    reset: string;
    tag: string;
  };
  category: {
    postsCount: string;
    all: string;
    noPosts: string;
    noPostsDesc: string;
    allPosts: string;
  };
  footer: {
    sitemap: string;
    rss: string;
    privacyPolicy: string;
  };
  coupang: {
    viewOnCoupang: string;
    recommendation: string;
    disclaimer: string;
    sponsored: string;
  };
}

// 사전 로딩 (빌드 타임에 JSON import)
const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ko: () => import("@/dictionaries/ko.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
};

// 세로AI 리브랜딩 문구 — dictionaries/*.json 에 남아 있는 이전 브랜드 문구를 덮어쓴다.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const overrides: Record<Locale, DeepPartial<Dictionary>> = {
  ko: {
    meta: {
      defaultTitle: "세로AI 딸깍스튜디오 | AI 자동화 대행 · 홈페이지 · AI 마케팅",
      siteDescription:
        "AI 공부할 시간 없는 사장님 대신, 사업부터 이해하고 업무 자동화·홈페이지·웹앱·검색과 AI 답변 마케팅까지 세팅해 드리는 AI 자동화 대행.",
    },
    nav: { home: "홈", about: "소개" },
    home: {
      latest: "최신",
      newsletter: "주간 AI 브리핑",
      newsletterDesc:
        "한 주의 AI 소식과 가게·회사에 바로 써먹을 수 있는 자동화·마케팅 아이디어를 매주 한 번 보내드립니다.",
      noPosts: "첫 글을 준비 중입니다",
      noPostsDesc: "검수 패널을 통과한 첫 글이 곧 올라옵니다.",
      firstPostSoon: "검수 패널을 통과한 첫 글이 곧 올라옵니다.",
      coupangTitle: "AI 작업 환경 추천",
      coupangDevTitle: "AI 작업 환경 추천",
      aboutItems: [
        "AI 자동화 워크플로를 단계별로 정리",
        "작은 가게 AI 마케팅의 비용과 주의할 정책",
        "꼭 알아야 할 AI 뉴스만 선별",
        "직접 써보고 비교한 AI 도구",
      ],
    },
    post: {
      coupangReaderTitle: "이 글과 함께 보면 좋은 상품",
      coupangDevTitle: "AI 작업 환경 추천",
    },
    search: {
      description: "키워드나 태그로 세로AI의 글을 찾아보세요",
      placeholder: "검색어를 입력하세요 (예: 자동화, 챗GPT, 홈페이지)",
    },
    category: {
      noPostsDesc: "검수 패널을 통과한 첫 글을 준비하고 있습니다.",
    },
  },
  en: {
    meta: {
      defaultTitle: "SERO AI Ttalkkak Studio | AI automation agency",
      siteDescription:
        "An AI automation agency for busy small-business owners: workflow automation, websites, web apps and search/AI-answer marketing, set up for you.",
    },
    nav: { home: "Home", about: "About" },
    home: {
      latest: "Latest",
      newsletter: "Weekly AI Briefing",
      newsletterDesc: "One email a week: the AI news that matters and ideas you can use.",
      noPosts: "Our first story is on the way",
      noPostsDesc: "The first reviewed post will be published soon.",
      firstPostSoon: "The first reviewed post will be published soon.",
      coupangTitle: "Recommended gear",
      coupangDevTitle: "Recommended gear",
      aboutItems: [
        "Step-by-step AI automation workflows",
        "Real economics of AI side hustles",
        "Curated AI news",
        "Hands-on AI tool comparisons",
      ],
    },
    post: {
      coupangReaderTitle: "Related products",
      coupangDevTitle: "Recommended gear",
    },
  },
};

function merge<T>(base: T, patch: DeepPartial<T> | undefined): T {
  if (!patch) return base;
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") {
      out[k] = merge(out[k], v as any);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const base = await (dictionaries[locale] || dictionaries[defaultLocale])();
  return merge(base, overrides[locale]);
}

// 로케일 기반 href 생성
export function localizedHref(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}

// 유효한 로케일인지 확인
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
