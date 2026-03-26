"use client";

import { useEffect, useRef } from "react";
import { AD_CONFIG, isAdsConfigured } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

export default function AdInFeed({ className = "" }: { className?: string }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (!isAdsConfigured()) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, []);

  if (!isAdsConfigured()) {
    if (!AD_CONFIG.enabled) return null;

    return (
      <div className={`border-t border-card-border py-8 ${className}`}>
        <div className="border border-dashed border-card-border/50 bg-card-bg/30 flex items-center justify-center py-10 px-4">
          <span className="font-mono text-[9px] tracking-[3px] uppercase text-dim/30">
            SPONSORED
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-t border-card-border py-8 ${className}`}>
      <div className="relative">
        <span className="font-mono text-[8px] tracking-[2px] uppercase text-dim/30 block mb-2">
          sponsored
        </span>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={AD_CONFIG.publisherId}
          data-ad-slot={AD_CONFIG.slots.inFeed}
          data-ad-format="fluid"
          data-ad-layout-key="-6t+ed+2i-1n-4w"
        />
      </div>
    </div>
  );
}
