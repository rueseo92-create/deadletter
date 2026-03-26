// ─── Google AdSense 설정 ───
// 아래 값들을 본인의 AdSense 정보로 교체하세요.
// 1. https://adsense.google.com 에서 계정 생성
// 2. 사이트 (deadletter.vercel.app) 등록 및 승인
// 3. 광고 단위 생성 후 아래 슬롯 ID 교체

export const AD_CONFIG = {
  // AdSense Publisher ID (ca-pub-XXXXXXXXXX)
  publisherId: "ca-pub-1902054355965964",

  // 광고 슬롯 ID (각 배치별)
  slots: {
    // 편지 피드 사이에 들어가는 인피드 광고
    inFeed: "0000000000",
    // 편지 상세 페이지 하단 배너
    letterBottom: "0000000001",
    // 편지 작성 완료 후 배너
    writeDone: "0000000002",
    // 오늘의 편지 하단
    dailyBottom: "0000000003",
    // 랜딩 페이지 섹션 사이
    landing: "0000000004",
  },

  // 광고 활성화 여부 (AdSense 승인 전까지 false로 유지)
  enabled: true,
} as const;

// AdSense가 설정 완료되었는지 확인
export function isAdsConfigured(): boolean {
  return AD_CONFIG.enabled && AD_CONFIG.publisherId.length > 0;
}
