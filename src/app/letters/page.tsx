"use client";

import { useEffect, useState } from "react";
import { supabase, getOrCreateUserId } from "@/lib/supabase-browser";
import LetterCard from "@/components/LetterCard";
import type { Letter, LetterCategory, LetterEmotion } from "@/types/database";
import { CATEGORIES, EMOTIONS } from "@/lib/categories";
import { useLanguage } from "@/components/LanguageProvider";
import AdInFeed from "@/components/AdInFeed";

const PAGE_SIZE = 10;

function SkeletonCard() {
  return (
    <div className="border-t border-card-border py-10">
      <div className="flex justify-between mb-5">
        <div className="skeleton w-20 h-3" />
        <div className="skeleton w-16 h-3" />
      </div>
      <div className="skeleton w-40 h-4 mb-5" />
      <div className="flex gap-2 mb-5">
        <div className="skeleton w-24 h-5" />
        <div className="skeleton w-16 h-5" />
      </div>
      <div className="space-y-2 mb-6">
        <div className="skeleton w-full h-4" />
        <div className="skeleton w-4/5 h-4" />
        <div className="skeleton w-3/5 h-4" />
      </div>
      <div className="flex gap-6">
        <div className="skeleton w-12 h-3" />
        <div className="skeleton w-14 h-3" />
        <div className="skeleton w-12 h-3" />
      </div>
    </div>
  );
}

export default function LettersPage() {
  const { t } = useLanguage();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<LetterCategory | "all">("all");
  const [filterEmotion, setFilterEmotion] = useState<LetterEmotion | "all">("all");

  useEffect(() => {
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
          {t("letters.allLetters")}
        </span>
      </div>

      {/* Filters */}
      <div className="max-w-[640px] mx-auto px-6 mb-8">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          <button
            onClick={() => { setFilterCategory("all"); }}
            className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-all ${
              filterCategory === "all"
                ? "border-accent text-accent bg-accent/5"
                : "border-card-border text-dim hover:text-fg hover:border-dim/30"
            }`}
          >
            {t("letters.all")}
          </button>
          {CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-all ${
                filterCategory === cat.value
                  ? "border-accent text-accent bg-accent/5"
                  : "border-card-border text-dim hover:text-fg hover:border-dim/30"
              }`}
            >
              {cat.emoji} {t(`categories.${cat.value}`)}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mt-1 scrollbar-hide">
          <button
            onClick={() => setFilterEmotion("all")}
            className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-all ${
              filterEmotion === "all"
                ? "border-accent text-accent bg-accent/5"
                : "border-card-border text-dim hover:text-fg hover:border-dim/30"
            }`}
          >
            {t("letters.allEmotions")}
          </button>
          {EMOTIONS.map((em) => (
            <button
              key={em.value}
              onClick={() => setFilterEmotion(em.value)}
              className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border whitespace-nowrap cursor-pointer transition-all ${
                filterEmotion === em.value
                  ? `border-accent ${em.color} bg-accent/5`
                  : "border-card-border text-dim hover:text-fg hover:border-dim/30"
              }`}
            >
              {t(`emotions.${em.value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-[640px] mx-auto px-6">
        {loading && letters.length === 0 ? (
          <div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4 opacity-30">&#9993;</div>
            <h2 className="font-display text-2xl font-light text-accent mb-3">
              {t("letters.noLetters")}
            </h2>
            <p className="text-dim text-sm">{t("letters.noLettersDesc")}</p>
          </div>
        ) : (
          <>
            {letters.map((letter, idx) => (
              <div key={letter.id}>
                <LetterCard
                  letter={letter}
                  onLike={handleLike}
                  isLiked={likedIds.has(letter.id)}
                />
                {/* 3번째 편지마다 인피드 광고 삽입 */}
                {idx === 2 && <AdInFeed />}
                {idx === 6 && <AdInFeed />}
              </div>
            ))}

            {hasMore && (
              <div className="text-center py-10">
                <button
                  onClick={() => loadLetters(page + 1)}
                  disabled={loading}
                  className="font-mono text-[11px] tracking-wider px-6 py-2.5 border border-card-border text-dim hover:text-fg hover:border-dim/30 transition-all cursor-pointer disabled:opacity-30"
                >
                  {loading ? t("letters.loading") : `${t("letters.loadMore")} \u2193`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
