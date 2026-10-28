/**
 * /api/og - 동적 Open Graph 이미지 생성
 *
 * 사용: <meta property="og:image" content="/api/og?title=제목&category=finance" />
 */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { siteConfig } from "@/lib/config";

export const runtime = "edge";

// 단일 액센트 — 사이트 디자인 토큰(--accent)과 동일
const ACCENT = "#4F46E5";
const categoryLabels: Record<string, string> = {
  "ai-automation": "AI AUTOMATION",
  "ai-side-hustle": "AI SIDE HUSTLE",
  "ai-news": "AI NEWS",
  "ai-tools": "AI TOOLS",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || siteConfig.defaultTitle;
  const category = searchParams.get("category") || "";
  const accent = ACCENT;
  const label = categoryLabels[category] || "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          background: "#FCFCFB",
          fontFamily: "sans-serif",
        }}
      >
        {/* 상단: 카테고리 + 장식 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {label && (
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: accent,
                background: `${accent}18`,
                padding: "8px 20px",
                borderRadius: 40,
                border: `1px solid ${accent}40`,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          )}
        </div>

        {/* 중앙: 제목 */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#111113",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            maxWidth: "90%",
          }}
        >
          {title}
        </div>

        {/* 하단: 브랜드 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 6, height: 30, borderRadius: 3, background: accent }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: "#111113", letterSpacing: "-0.02em" }}>
            {siteConfig.nameEn}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 14, color: "#A8A29E" }}>
            seroai.xyz
          </span>
        </div>

      </div>
    ),
    { width: 1200, height: 630 }
  );
}
