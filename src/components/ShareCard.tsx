"use client";

import { useRef } from "react";
import type { Letter } from "@/types/database";
import { displayId } from "@/types/database";
import { getCategoryInfo, getEmotionInfo } from "@/lib/categories";

interface ShareCardProps {
  letter: Letter;
}

export default function ShareCard({ letter }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const did = displayId(letter.letter_number);
  const emotion = getEmotionInfo(letter.emotion);

  function handleCopyLink() {
    const url = `${window.location.origin}/letter/?id=${letter.id}`;
    if (navigator.share) {
      navigator.share({
        title: `deadletter ${did}`,
        text: `"${letter.body.slice(0, 100)}..."`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <div>
      {/* 공유용 카드 (스크린샷 대상) */}
      <div
        ref={cardRef}
        className="bg-bg border border-card-border p-8 max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <span className="font-mono text-[10px] tracking-[3px] text-accent">
            deadletter<span className="text-stamp-red">.</span>
          </span>
          <span className="font-mono text-[10px] tracking-[2px] text-dim">
            {did}
          </span>
        </div>

        <div className="mb-4">
          <span className="font-mono text-[9px] tracking-[2px] uppercase text-dim">
            To:
          </span>
          <span className="ml-2 text-accent text-xs">
            {letter.recipient_label}
          </span>
        </div>

        <div className="text-fg italic leading-relaxed mb-6 text-sm">
          &ldquo;{letter.body.length > 200 ? letter.body.slice(0, 200) + "..." : letter.body}&rdquo;
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-card-border">
          <span className={`font-mono text-[9px] tracking-wider ${emotion.color}`}>
            {emotion.label}
          </span>
          <span className="font-mono text-[9px] text-dim tracking-wider">
            send what you can&apos;t say
          </span>
        </div>
      </div>

      {/* 공유 버튼 */}
      <button
        onClick={handleCopyLink}
        className="mt-4 font-mono text-[11px] tracking-wider text-dim hover:text-accent transition-colors cursor-pointer"
      >
        &#8599; 링크 복사 / 공유
      </button>
    </div>
  );
}
