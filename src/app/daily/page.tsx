"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getOrCreateUserId } from "@/lib/supabase-browser";
import { getCategoryInfo, getEmotionInfo } from "@/lib/categories";
import { displayId } from "@/types/database";
import type { Letter } from "@/types/database";

export default function DailyPage() {
  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    loadDailyLetter();
  }, []);

  async function loadDailyLetter() {
    const userId = getOrCreateUserId();
    const today = new Date().toISOString().split("T")[0];

    // 오늘 이미 배정된 편지가 있는지 확인
    const { data: existing } = await supabase
      .from("daily_letters")
      .select("letter_id")
      .eq("user_id", userId)
      .eq("assigned_date", today)
      .single();

    if (existing) {
      const { data: letterData } = await supabase
        .from("letters")
        .select("*")
        .eq("id", existing.letter_id)
        .single();
      if (letterData) setLetter(letterData);
      setLoading(false);
      return;
    }

    // 새 편지 배정: 랜덤 게시 편지 선택 (자기 편지 제외)
    const { data: candidates } = await supabase
      .from("letters")
      .select("*")
      .eq("is_published", true)
      .eq("is_crisis", false)
      .neq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (candidates && candidates.length > 0) {
      const randomIdx = Math.floor(Math.random() * candidates.length);
      const chosen = candidates[randomIdx];

      await supabase.from("daily_letters").insert({
        user_id: userId,
        letter_id: chosen.id,
        assigned_date: today,
      });

      setLetter(chosen);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-dim tracking-widest animate-pulse">
          오늘의 편지를 찾는 중...
        </span>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <h2 className="font-display text-2xl font-light text-accent-bright">
          아직 읽을 편지가 없어요
        </h2>
        <p className="text-dim text-sm text-center max-w-sm leading-relaxed">
          사람들이 편지를 쓰면, 매일 아침 한 통이 당신에게 도착합니다.
        </p>
        <Link
          href="/write"
          className="font-mono text-[11px] tracking-wider px-6 py-3 bg-blue text-white hover:bg-blue/80 transition-colors"
        >
          먼저 편지를 써보세요
        </Link>
      </div>
    );
  }

  const category = getCategoryInfo(letter.category);
  const emotion = getEmotionInfo(letter.emotion);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="font-mono text-[10px] tracking-[6px] uppercase text-dim mb-16">
          오늘의 편지
        </div>

        {!revealed ? (
          <div className="opacity-0 animate-fade-up">
            {/* 봉투 모양 */}
            <div className="border border-card-border bg-card-bg p-10 md:p-14 cursor-pointer hover:border-accent/30 transition-all"
              onClick={() => setRevealed(true)}
            >
              <div className="font-mono text-[9px] tracking-[4px] uppercase text-dim mb-8">
                {displayId(letter.letter_number)}
              </div>

              <div className="text-accent-bright text-lg mb-4">
                누군가가 보내지 못한 편지가
                <br />
                당신에게 도착했습니다.
              </div>

              <div className="font-mono text-[10px] text-blue tracking-wider mt-8">
                탭하여 읽기
              </div>
            </div>
          </div>
        ) : (
          <div className="opacity-0 animate-fade-up text-left">
            <div className="border border-card-border bg-card-bg p-8 md:p-12">
              {/* To label */}
              <div className="mb-6">
                <span className="font-mono text-[10px] tracking-[3px] uppercase text-dim">
                  To:
                </span>
                <span className="ml-3 text-accent">
                  {letter.recipient_label}
                </span>
              </div>

              {/* Tags */}
              <div className="flex gap-2 mb-6">
                <span className="font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border text-dim">
                  {category.emoji} {category.label}
                </span>
                <span
                  className={`font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border ${emotion.color}`}
                >
                  {emotion.label}
                </span>
              </div>

              {/* Body */}
              <div className="text-lg leading-[1.9] text-fg italic mb-8">
                &ldquo;{letter.body}&rdquo;
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-card-border">
                <Link
                  href={`/letter/?id=${letter.id}`}
                  className="font-mono text-[11px] tracking-wider text-blue hover:text-accent-bright transition-colors"
                >
                  답장 쓰기 &rarr;
                </Link>
                <Link
                  href="/letters"
                  className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors"
                >
                  더 많은 편지
                </Link>
              </div>
            </div>

            <div className="text-center mt-8 font-mono text-[9px] text-dim tracking-wider">
              내일 새로운 편지가 도착합니다
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
