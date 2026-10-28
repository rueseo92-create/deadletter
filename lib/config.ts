// ============================================
// 사이트 설정 — 세로AI (SERO AI)
// AI 자동화 · AI 부업 · AI 뉴스 · AI 도구
// ============================================

export type CategoryIcon = "automation" | "hustle" | "news" | "tools";

export interface Category {
  slug: string;
  name: string;
  nameEn: string;
  /** 한 줄 소개 — 카테고리 헤더, 빈 상태, 홈 섹션에 사용 */
  description: string;
  descriptionEn: string;
  icon: CategoryIcon;
}

// 콘텐츠 파이프라인과 공유하는 슬러그 — 이름을 바꾸지 마세요.
const categories: Category[] = [
  {
    slug: "ai-automation",
    name: "AI 자동화",
    nameEn: "AI Automation",
    description: "반복 업무를 AI와 노코드 도구로 줄이는 실전 워크플로",
    descriptionEn: "Practical workflows that hand repetitive work to AI and no-code tools",
    icon: "automation",
  },
  {
    slug: "ai-side-hustle",
    name: "AI 부업",
    nameEn: "AI Side Hustle",
    description: "AI로 시작하는 부업 — 실제 수익 구조와 비용, 리스크까지",
    descriptionEn: "Side income with AI — real revenue models, costs and risks",
    icon: "hustle",
  },
  {
    slug: "ai-news",
    name: "AI 뉴스",
    nameEn: "AI News",
    description: "꼭 알아야 할 AI 소식만 골라 맥락과 함께 정리",
    descriptionEn: "The AI news that matters, with context",
    icon: "news",
  },
  {
    slug: "ai-tools",
    name: "AI 도구",
    nameEn: "AI Tools",
    description: "직접 써보고 비교한 AI 도구 사용법과 선택 기준",
    descriptionEn: "Hands-on guides and comparisons of AI tools",
    icon: "tools",
  },
];

export const siteConfig = {
  name: "세로AI",
  nameEn: "SERO AI",
  tagline: "AI 자동화 · AI 부업 · AI 뉴스 — 검증해서 정리합니다",
  description:
    "AI 자동화, AI 부업, AI 뉴스, AI 도구 — 쏟아지는 AI 정보 중 실제로 쓸 수 있는 것만 검증해서 정리합니다.",
  url: "https://seroai.xyz",
  author: "세로AI 편집팀",
  // TODO: 실제 이메일 확인
  email: "contact@seroai.xyz",
  locale: "ko_KR",

  defaultTitle: "세로AI | AI 자동화 · AI 부업 · AI 뉴스 · AI 도구",
  titleTemplate: "%s | 세로AI",

  social: {
    instagram: "",
    twitter: "",
  },

  categories,

  nav: categories.map((c) => ({ href: `/categories/${c.slug}`, label: c.name })),

  // 쿠팡 파트너스
  coupang: {
    enabled: true,
    trackingCode: "AF9905627",
    ads: {
      postBottom: { id: 838592, template: "carousel" as const, width: "680", height: "140" },
      sidebar: { id: 838592, template: "card" as const, width: "300", height: "250" },
      postMid: { id: 838592, template: "banner" as const, width: "680", height: "100" },
      homeTop: { id: 838592, template: "carousel" as const, width: "680", height: "140" },
    },
    productKeywords: {
      "ai-automation": [
        "업무 자동화 도서",
        "로지텍 MX Keys S 키보드",
        "LG 울트라와이드 모니터 34인치",
        "삼성 T7 외장SSD 1TB",
      ],
      "ai-side-hustle": [
        "AI 활용 도서",
        "USB 콘덴서 마이크",
        "로지텍 웹캠 C920",
        "가성비 노트북",
      ],
      "ai-news": [
        "인공지능 교양 도서",
        "챗GPT 활용 도서",
        "아이패드 에어 M2",
        "노이즈캔슬링 이어폰",
      ],
      "ai-tools": [
        "맥북 에어 M3",
        "기계식 키보드",
        "로지텍 MX Master 3S 마우스",
        "27인치 4K 모니터",
      ],
    } as Record<string, string[]>,
    tagProductMap: {
      "챗GPT": "챗GPT 활용 도서",
      "ChatGPT": "챗GPT 활용 도서",
      "프롬프트": "프롬프트 엔지니어링 도서",
      "자동화": "업무 자동화 도서",
      "엑셀": "엑셀 실무 도서",
      "파이썬": "파이썬 입문 도서",
      "코딩": "기계식 키보드",
      "유튜브": "USB 콘덴서 마이크",
      "영상": "로지텍 웹캠 C920",
      "쇼츠": "스마트폰 짐벌",
      "팟캐스트": "USB 콘덴서 마이크",
      "블로그": "AI 글쓰기 도서",
      "부업": "AI 부업 도서",
      "이미지": "드로잉 태블릿",
      "노트북": "가성비 노트북",
      "로컬 LLM": "게이밍 노트북 RTX",
      "GPU": "그래픽카드 RTX",
    } as Record<string, string>,
    disclaimer:
      "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
  },

  analytics: {
    gaId: "G-01E31GWTCD",
  },

  disclaimer:
    "세로AI의 콘텐츠는 정보 제공 목적으로 작성되며, AI 도구의 가격·기능·정책은 수시로 바뀔 수 있습니다. 중요한 결정 전에는 공식 자료를 확인해 주세요.",
};

export const CATEGORY_SLUGS: readonly string[] = categories.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return siteConfig.categories.find((c) => c.slug === slug);
}

/** 현재 운영 중인 4개 카테고리 중 하나인지 */
export function isActiveCategory(slug: string | undefined | null): boolean {
  return !!slug && CATEGORY_SLUGS.includes(slug);
}

export function categoryName(cat: Category, locale: string): string {
  return locale === "en" ? cat.nameEn : cat.name;
}

export function categoryDescription(cat: Category, locale: string): string {
  return locale === "en" ? cat.descriptionEn : cat.description;
}
