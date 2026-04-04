// ============================================
// 사이트 설정 — 데일리인사이트 (High-CPC Content Blog)
// ============================================

export const siteConfig = {
  name: "데일리인사이트",
  description:
    "금융, 보험, 건강, IT, 부동산 — 생활 속 핵심 정보를 매일 쉽게 정리합니다",
  url: "https://deadletter.ink",
  author: "데일리인사이트",
  locale: "ko_KR",

  defaultTitle: "데일리인사이트 | 금융 · 보험 · 건강 · IT · 생활 정보",
  titleTemplate: "%s | 데일리인사이트",

  social: {
    instagram: "",
    twitter: "",
  },

  // 고CPC 카테고리
  categories: [
    { slug: "finance", name: "금융·재테크", emoji: "💰" },
    { slug: "insurance", name: "보험", emoji: "🛡️" },
    { slug: "health", name: "건강·의료", emoji: "💊" },
    { slug: "tech", name: "IT·테크", emoji: "💻" },
    { slug: "realestate", name: "부동산", emoji: "🏠" },
    { slug: "lifestyle", name: "생활·자기계발", emoji: "📚" },
  ],

  nav: [
    { href: "/", label: "홈" },
    { href: "/categories/finance", label: "금융" },
    { href: "/categories/insurance", label: "보험" },
    { href: "/categories/health", label: "건강" },
    { href: "/categories/tech", label: "IT" },
    { href: "/categories/realestate", label: "부동산" },
    { href: "/categories/lifestyle", label: "생활" },
  ],

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
      finance: [
        "주식투자 입문서",
        "재테크 도서",
        "삼성 갤럭시북4 프로",
        "금융계산기",
      ],
      insurance: [
        "보험 비교 도서",
        "건강관리 도서",
        "체성분 분석기",
        "혈압계",
      ],
      health: [
        "종합비타민",
        "오메가3",
        "프로틴 파우더",
        "필라테스 매트",
      ],
      tech: [
        "LG 울트라와이드 모니터 34인치",
        "로지텍 MX Master 3S 마우스",
        "삼성 T7 외장SSD 1TB",
        "아이패드 에어 M2",
      ],
      realestate: [
        "부동산 투자 도서",
        "인테리어 도서",
        "레이저 거리측정기",
        "스마트 도어락",
      ],
      lifestyle: [
        "자기계발 도서",
        "토익 교재",
        "노이즈캔슬링 이어폰",
        "독서등",
      ],
    } as Record<string, string[]>,
    tagProductMap: {
      "대출": "금융 도서",
      "적금": "재테크 도서",
      "주식": "주식투자 입문서",
      "카드": "신용카드 혜택 도서",
      "보험": "보험 비교 도서",
      "자동차보험": "자동차 블랙박스",
      "실손보험": "건강관리 도서",
      "비타민": "종합비타민",
      "다이어트": "체중계",
      "영양제": "오메가3",
      "노트북": "삼성 갤럭시북4 프로",
      "VPN": "VPN 서비스 도서",
      "청약": "부동산 투자 도서",
      "인테리어": "인테리어 도서",
      "자격증": "자격증 교재",
      "토익": "토익 교재",
    } as Record<string, string>,
    disclaimer:
      "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
  },

  analytics: {
    gaId: "G-01E31GWTCD",
  },

  disclaimer:
    "본 블로그의 콘텐츠는 정보 제공 목적으로 작성되었으며, 정확한 정보는 관련 기관 공식 자료를 확인해주세요.",
};

export function getCategory(slug: string) {
  return siteConfig.categories.find((c) => c.slug === slug);
}
