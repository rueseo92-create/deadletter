"use client";

import { useEffect, useRef } from "react";
import { siteConfig } from "@/lib/config";

const AF_CODE = siteConfig.coupang.trackingCode;

/** 쿠팡 파트너스 어필리에이트 링크 생성 */
function buildAffiliateLink(keyword: string): string {
  const encodedKw = encodeURIComponent(keyword);
  // landingUrl의 구조 부분은 수동 인코딩, 키워드만 encodeURIComponent
  return `https://link.coupang.com/re/AFFDP?lptag=${AF_CODE}&subid=&pageType=SEARCH&landingUrl=https%3A%2F%2Fwww.coupang.com%2Fnp%2Fsearch%3Fq%3D${encodedKw}%26channel%3Duser`;
}

// ─── 동적 배너 광고 (g.js) ───────────────────

interface CoupangAdProps {
  id: number;
  template?: "carousel" | "banner" | "card";
  width?: string;
  height?: string;
  subId?: string;
  className?: string;
}

export function CoupangAd({
  id,
  template = "carousel",
  width = "680",
  height = "140",
  subId = "",
  className = "",
}: CoupangAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    const script = document.createElement("script");
    script.src = "https://ads-partners.coupang.com/g.js";
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).PartnersCoupang !== "undefined") {
        new (window as any).PartnersCoupang.G({
          id,
          template,
          subId,
          width,
          height,
        });
      }
    };
    containerRef.current.appendChild(script);
  }, [id, template, subId, width, height]);

  return (
    <div
      ref={containerRef}
      className={`coupang-ad-container flex justify-center ${className}`}
    />
  );
}

// ─── 키워드 기반 어필리에이트 링크 카드 ──────

interface CoupangLinkAdProps {
  keywords: string[];
  title?: string;
  className?: string;
}

export function CoupangLinkAd({
  keywords,
  title = "추천 상품 보러가기",
  className = "",
}: CoupangLinkAdProps) {
  return (
    <aside aria-label="쿠팡 파트너스 광고" className={`rounded-xl border border-line bg-surface ${className}`}>
      <div className="flex items-baseline justify-between gap-3 px-4 pb-1 pt-3.5 sm:px-5">
        <p className="text-[14px] font-semibold text-ink">{title}</p>
        <span className="text-[11px] text-ink-3">광고 · 쿠팡 파트너스</span>
      </div>
      <ul className="grid gap-px px-2 pb-2 sm:grid-cols-2 sm:px-3">
        {keywords.map((kw) => (
          <li key={kw}>
            <a
              href={buildAffiliateLink(kw)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-[14px] text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
            >
              <span className="truncate">{kw}</span>
              <span className="flex flex-shrink-0 items-center gap-1 text-[12px] text-ink-3 group-hover:text-ink-2">
                쿠팡에서 보기
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-ink-3 sm:px-5">
        {siteConfig.coupang.disclaimer}
      </p>
    </aside>
  );
}

// ─── 컴팩트 사이드바 광고 ────────────────────

interface CoupangSidebarAdProps {
  keywords: string[];
  className?: string;
}

export function CoupangSidebarAd({
  keywords,
  className = "",
}: CoupangSidebarAdProps) {
  return (
    <aside aria-label="쿠팡 파트너스 광고" className={`rounded-xl border border-line bg-surface ${className}`}>
      <p className="border-b border-line px-4 py-3 text-[12px] font-semibold text-ink-2">쿠팡 추천 · 광고</p>
      <ul className="space-y-px p-2">
        {keywords.map((kw) => (
          <li key={kw}>
            <a
              href={buildAffiliateLink(kw)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block truncate rounded-md px-2.5 py-2 text-[13px] text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
            >
              {kw}
            </a>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-2 text-[10px] text-ink-3">
        쿠팡 파트너스 활동으로 수수료를 받을 수 있습니다.
      </p>
    </aside>
  );
}

// ─── 광고 래퍼 ───────────────────────────────

export function AdSlot({
  children,
  className = "",
  label = true,
}: {
  children: React.ReactNode;
  className?: string;
  label?: boolean;
}) {
  return (
    <div className={`my-8 ${className}`}>
      {label && <p className="mb-2 text-center text-[11px] tracking-wider text-ink-3">광고</p>}
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
