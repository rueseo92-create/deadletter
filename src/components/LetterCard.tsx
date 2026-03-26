"use client";

import Link from "next/link";
import type { Letter } from "@/types/database";
import { displayId } from "@/types/database";
import { getCategoryInfo, getEmotionInfo } from "@/lib/categories";
import TranslatedText from "@/components/TranslatedText";
import { useLanguage } from "@/components/LanguageProvider";

interface LetterCardProps {
  letter: Letter;
  onLike?: (id: string) => void;
  isLiked?: boolean;
}

export default function LetterCard({ letter, onLike, isLiked }: LetterCardProps) {
  const { t } = useLanguage();
  const category = getCategoryInfo(letter.category);
  const emotion = getEmotionInfo(letter.emotion);
  const did = displayId(letter.letter_number);

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return t("letters.ago_just");
    if (diff < 3600) return t("letters.ago_min").replace("{n}", String(Math.floor(diff / 60)));
    if (diff < 86400) return t("letters.ago_hour").replace("{n}", String(Math.floor(diff / 3600)));
    return t("letters.ago_day").replace("{n}", String(Math.floor(diff / 86400)));
  }

  function handleShare() {
    const url = `${window.location.origin}/letter/?id=${letter.id}`;
    if (navigator.share) {
      navigator.share({ title: `deadletter ${did}`, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  }

  return (
    <article className="border-t border-card-border py-10 group">
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
          {category.emoji} {t(`categories.${letter.category}`)}
        </span>
        <span className={`font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border ${emotion.color}`}>
          {t(`emotions.${letter.emotion}`)}
        </span>
      </div>

      {/* Body */}
      <div className="mb-6">
        <Link href={`/letter/?id=${letter.id}`} className="cursor-pointer block">
          <TranslatedText text={letter.body} className="text-[17px] leading-[1.8] text-fg italic" />
        </Link>
      </div>

      {/* Stats */}
      <div className="flex gap-6 items-center">
        <button
          onClick={() => onLike?.(letter.id)}
          className={`font-mono text-[10px] tracking-wider transition-all cursor-pointer ${
            isLiked
              ? "text-stamp-red scale-105"
              : "text-dim hover:text-stamp-red"
          }`}
        >
          {isLiked ? "\u2665" : "\u2661"} {letter.likes + (isLiked ? 1 : 0)}
        </button>
        <Link
          href={`/letter/?id=${letter.id}`}
          className="font-mono text-[10px] tracking-wider text-dim hover:text-blue transition-colors"
        >
          &#9993; {letter.reply_count}{t("letters.replyCount")}
        </Link>
        <button
          onClick={handleShare}
          className="font-mono text-[10px] tracking-wider text-dim hover:text-accent transition-colors cursor-pointer"
        >
          &#8599; {t("letters.share")}
        </button>
      </div>
    </article>
  );
}
