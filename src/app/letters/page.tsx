"use client";

import { useEffect, useState } from "react";
import { supabase, getOrCreateUserId } from "@/lib/supabase-browser";
import LetterCard from "@/components/LetterCard";
import type { Letter, LetterCategory, LetterEmotion } from "@/types/database";
import { CATEGORIES, EMOTIONS } from "@/lib/categories";

const PAGE_SIZE = 10;

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<LetterCategory | "all">("all");
  const [filterEmotion, setFilterEmotion] = useState<LetterEmotion | "all">("all");

  useEffect(() => {
    // localStorage에서 좋아요 목록 로드
    const stored = localStorage.getItem("deadletter_likes");
    if (stored) {
      setLikedIds(new Set(JSON.parse(stored)));
    }
    loadLetters(0);
  }, [filterCategory, filterEmotion]);

  async function loadLetters(pageNum: number) {
    setLoading(true);

    let query = supabase
      .from("letters")
      .select("*")
      .eq("is_published", true)
      .eq("is_crisis", false)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }
    if (filterEmotion !== "all") {
      query = query.eq("emotion", filterEmotion);
    }

    const { data } = await query;

    if (data) {
      if (pageNum === 0) {
        setLetters(data);
      } else {
        setLetters((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }

    setPage(pageNum);
    setLoading(false);
  }

  function handleLike(id: string) {
    if (likedIds.has(id)) return;
    const newLiked = new Set(likedIds);
    newLiked.add(id);
    setLikedIds(newLiked);
    localStorage.setItem("deadletter_likes", JSON.stringify([...newLiked]));

    // DB 업데이트
    supabase
      .from("letter_likes")
      .insert({ user_id: getOrCreateUserId(), letter_id: id })
      .then(() => {
        supabase
          .from("letters")
          .update({ likes: letters.find((l) => l.id === id)!.likes + 1 })
          .eq("id", id);
      });
  }

  return (
    <section className="pt-28 pb-20">
      <div className="text-center py-16 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-card-border" />
        <span className="font-mono text-[10px] tracking-[4px] text-dim bg-bg px-4 py-4 relative">
          ALL LETTERS
        </span>
      </div>

      {/* Filters */}
      <div className="max-w-[640px] mx-auto px-6 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterCategory("all")}
            className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-colors ${
              filterCategory === "all"
                ? "border-accent text-accent"
                : "border-card-border text-dim hover:text-fg"
            }`}
          >
            전체
          </button>
          {CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === cat.value
                  ? "border-accent text-accent"
                  : "border-card-border text-dim hover:text-fg"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mt-2 scrollbar-hide">
          <button
            onClick={() => setFilterEmotion("all")}
            className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-colors ${
              filterEmotion === "all"
                ? "border-accent text-accent"
                : "border-card-border text-dim hover:text-fg"
            }`}
          >
            모든 감정
          </button>
          {EMOTIONS.map((em) => (
            <button
              key={em.value}
              onClick={() => setFilterEmotion(em.value)}
              className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-colors ${
                filterEmotion === em.value
                  ? `border-accent ${em.color}`
                  : "border-card-border text-dim hover:text-fg"
              }`}
            >
              {em.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-[640px] mx-auto px-6">
        {loading && letters.length === 0 ? (
          <div className="text-center py-20 font-mono text-sm text-dim tracking-widest">
            loading...
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="font-display text-2xl font-light text-accent mb-3">
              아직 편지가 없어요
            </h2>
            <p className="text-dim text-sm">첫 번째 편지를 써보세요.</p>
          </div>
        ) : (
          <>
            {letters.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onLike={handleLike}
                isLiked={likedIds.has(letter.id)}
              />
            ))}

            {hasMore && (
              <div className="text-center py-10">
                <button
                  onClick={() => loadLetters(page + 1)}
                  disabled={loading}
                  className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
                >
                  {loading ? "loading..." : "더 보기 \u2193"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
