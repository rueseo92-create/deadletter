"use client";

import Link from "next/link";
import type { Letter } from "@/types/database";
import { displayId } from "@/types/database";
import { getCategoryInfo, getEmotionInfo } from "@/lib/categories";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

interface LetterCardProps {
  letter: Letter;
  onLike?: (id: string) => void;
  isLiked?: boolean;
}

export default function LetterCard({ letter, onLike, isLiked }: LetterCardProps) {
  const category = getCategoryInfo(letter.category);
  const emotion = getEmotionInfo(letter.emotion);
  const did = displayId(letter.letter_number);

  function handleShare() {
    const url = `${window.location.origin}/letter/?id=${letter.id}`;
    if (navigator.share) {
      navigator.share({ title: `deadletter ${did}`, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <article className="border-t border-card-border py-10 transition-colors hover:bg-hover/30">
      {/* Meta */}
      <div className="flex justify-between items-center mb-5">
        <Link
          href={`/letter/?id=${letter.id}`}
          className="font-mono text-[10px] tracking-[2px] text-dim hover:text-accent transition-colors"
        >
          {did}
        </Link>
        <span className="font-mono text-[10px] text-dim">
          {timeAgo(letter.created_at)}
        </span>
      </div>

      {/* To: label */}
      <div className="mb-4">
        <span className="font-mono text-[10px] tracking-[2px] uppercase text-dim">
          To:
        </span>
        <span className="ml-2 text-accent text-sm">
          {letter.recipient_label}
        </span>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-5">
        <span className="font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border text-dim">
          {category.emoji} {category.label}
        </span>
        <span className={`font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border ${emotion.color}`}>
          {emotion.label}
        </span>
      </div>

      {/* Body */}
      <Link href={`/letter/?id=${letter.id}`}>
        <div className="text-[17px] leading-[1.8] text-fg mb-6 italic cursor-pointer">
          &ldquo;{letter.body}&rdquo;
        </div>
      </Link>

      {/* Stats */}
      <div className="flex gap-6">
        <button
          onClick={() => onLike?.(letter.id)}
          className={`font-mono text-[10px] tracking-wider transition-colors cursor-pointer ${
            isLiked ? "text-stamp-red" : "text-dim hover:text-accent"
          }`}
        >
          &#9829; {letter.likes + (isLiked ? 1 : 0)}
        </button>
        <span className="font-mono text-[10px] tracking-wider text-dim">
          &#9993; {letter.reply_count}개 답장
        </span>
        <button
          onClick={handleShare}
          className="font-mono text-[10px] tracking-wider text-dim hover:text-accent transition-colors cursor-pointer"
        >
          &#8599; 공유
        </button>
      </div>
    </article>
  );
}
