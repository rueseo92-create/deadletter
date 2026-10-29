/**
 * /api/og - 동적 Open Graph 이미지 겸 글 썸네일
 *
 * 사용: /api/og?title=제목&category=ai-news
 * 카테고리마다 색을 달리해 목록에서 한눈에 구분되고, 굵은 제목이 썸네일 자체로 후킹 역할을 한다.
 */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { siteConfig } from "@/lib/config";

export const runtime = "edge";

const FONT_URL = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/woff/Pretendard-ExtraBold.woff";

const THEMES: Record<string, { label: string; accent: string; glow: string }> = {
  "ai-automation": { label: "AI 자동화", accent: "#818CF8", glow: "#4F46E5" },
  "ai-side-hustle": { label: "AI 마케팅", accent: "#FBBF24", glow: "#D97706" },
  "ai-news": { label: "AI 뉴스", accent: "#FB7185", glow: "#E11D48" },
  "ai-tools": { label: "AI 도구", accent: "#2DD4BF", glow: "#0D9488" },
};
const DEFAULT_THEME = { label: "세로AI", accent: "#818CF8", glow: "#4F46E5" };

let fontCache: ArrayBuffer | null = null;
async function loadFont(): Promise<ArrayBuffer | null> {
  if (fontCache) return fontCache;
  try {
    const res = await fetch(FONT_URL);
    if (res.ok) fontCache = await res.arrayBuffer();
  } catch {
    // 폰트를 못 받아도 기본 글꼴로 그린다
  }
  return fontCache;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || siteConfig.defaultTitle).slice(0, 80);
  const theme = THEMES[searchParams.get("category") || ""] || DEFAULT_THEME;
  const font = await loadFont();
  const size = title.length > 34 ? 60 : title.length > 22 ? 68 : 78;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 76px",
          background: "#0B0B10",
          backgroundImage: `radial-gradient(circle at 88% 12%, ${theme.glow}66 0%, transparent 45%), radial-gradient(circle at 0% 100%, ${theme.glow}33 0%, transparent 40%)`,
          fontFamily: font ? "Pretendard" : "sans-serif",
          color: "#F5F5F7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#0B0B10",
              background: theme.accent,
              padding: "8px 22px",
              borderRadius: 999,
            }}
          >
            {theme.label}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: size,
            lineHeight: 1.22,
            letterSpacing: "-0.03em",
            maxWidth: "94%",
            wordBreak: "keep-all",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 8, height: 34, borderRadius: 4, background: theme.accent, marginRight: 14 }} />
          <span style={{ fontSize: 30, letterSpacing: "-0.02em" }}>세로AI</span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 22, color: "#A1A1AA" }}>검증해서 정리하는 AI 실전 미디어</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font ? [{ name: "Pretendard", data: font, weight: 800, style: "normal" }] : undefined,
      headers: { "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable" },
    }
  );
}
