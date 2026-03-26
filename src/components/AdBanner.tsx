"use client";

import { useEffect, useRef } from "react";
import { AD_CONFIG, isAdsConfigured } from "@/lib/ads";

interface AdBannerProps {
  slot: keyof typeof AD_CONFIG.slots;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export default function AdBanner({
  slot,
  format = "auto",
  className = "",
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (!isAdsConfigured()) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded or ad blocker
    }
  }, []);

  // AdSense 미설정 시 placeholder 표시
  if (!isAdsConfigured()) {
    if (!AD_CONFIG.enabled) return null;

    return (
      <div className={`border border-dashed border-card-border bg-card-bg/50 flex items-center justify-center py-6 ${className}`}>
        <div className="text-center">
          <span className="font-mono text-[9px] tracking-[3px] uppercase text-dim/40 block mb-1">
            AD SPACE
          </span>
          <span className="font-mono text-[8px] text-dim/25">
            AdSense 설정 후 활성화됩니다
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container overflow-hidden ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CONFIG.publisherId}
        data-ad-slot={AD_CONFIG.slots[slot]}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
