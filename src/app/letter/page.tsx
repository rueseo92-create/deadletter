"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, getOrCreateUserId, isSupabaseConfigured } from "@/lib/supabase-browser";
import { getCategoryInfo, getEmotionInfo } from "@/lib/categories";
import { displayId } from "@/types/database";
import ProxyReplyForm from "@/components/ProxyReplyForm";
import TranslatedText from "@/components/TranslatedText";
import type { Letter, Reply } from "@/types/database";
import { useLanguage } from "@/components/LanguageProvider";
import AdBanner from "@/components/AdBanner";

// 데모 데이터
const DEMO_LETTERS: Record<string, Letter & { demoReplies: Reply[] }> = {
  demo: {
    id: "demo",
    letter_number: 42,
    author_id: "",
    recipient_label: "매일 야근시키는 팀장님에게",
    category: "boss",
    emotion: "anger",
    body: "'가족 같은 회사'라면서요. 그런데 왜 저는 가족한테도 안 하는 야근을 여기서 매일 하고 있죠? 퇴사하고 싶다는 말, 월급날마다 삼킵니다.",
    language: "ko",
    is_published: true,
    is_crisis: false,
    likes: 891,
    views: 2340,
    reply_count: 2,
    matched_letter_id: null,
    created_at: "2026-03-17T21:00:00Z",
    demoReplies: [
      {
        id: "r1",
        letter_id: "demo",
        author_id: "",
        body: "당신의 상사는 아니지만 — 그 말을 삼키는 건 약해서가 아니라, 책임감이 있어서예요. 당신은 충분히 잘하고 있어요.",
        likes: 234,
        created_at: "2026-03-17T22:30:00Z",
      },
      {
        id: "r2",
        letter_id: "demo",
        author_id: "",
        body: "나도 같은 상황이야. '열정'이라는 이름으로 우리 시간을 갈아넣는 게 정당화될 순 없지. 당신의 답답함이 너무 공감돼.",
        likes: 156,
        created_at: "2026-03-18T01:00:00Z",
      },
    ],
  },
};

function LetterDetail() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const letterId = searchParams.get("id") || "";

  const [letter, setLetter] = useState<Letter | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadLetter();
  }, [letterId]);

  async function loadLetter() {
    if (!letterId) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || letterId === "demo") {
      const demo = DEMO_LETTERS.demo;
      setLetter(demo);
      setReplies(demo.demoReplies);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("letters")
      .select("*")
      .eq("id", letterId)
      .single();

    if (data) {
      setLetter(data);
      await supabase
        .from("letters")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", letterId);
    }

    const { data: replyData } = await supabase
      .from("replies")
      .select("*")
      .eq("letter_id", letterId)
      .order("created_at", { ascending: true });

    if (replyData) setReplies(replyData);

    const stored = JSON.parse(localStorage.getItem("deadletter_likes") || "[]");
    setLiked(stored.includes(letterId));

    setLoading(false);
  }

  async function loadReplies() {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from("replies")
      .select("*")
      .eq("letter_id", letterId)
      .order("created_at", { ascending: true });
    if (data) setReplies(data);
  }

  function handleLike() {
    if (liked) return;
    setLiked(true);
    const stored = JSON.parse(localStorage.getItem("deadletter_likes") || "[]");
    stored.push(letterId);
    localStorage.setItem("deadletter_likes", JSON.stringify(stored));
  }

  function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return t("letters.ago_just");
    if (diff < 3600) return t("letters.ago_min").replace("{n}", String(Math.floor(diff / 60)));
    if (diff < 86400) return t("letters.ago_hour").replace("{n}", String(Math.floor(diff / 3600)));
    return t("letters.ago_day").replace("{n}", String(Math.floor(diff / 86400)));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="inline-flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: "200ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: "400ms" }} />
          </div>
          <span className="font-mono text-sm text-dim tracking-widest">{t("letters.loading")}</span>
        </div>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-4xl opacity-30 mb-2">&#9993;</div>
        <h2 className="font-display text-2xl font-light text-accent">{t("letter.notFound")}</h2>
        <Link href="/letters/" className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors">
          &larr; {t("letter.backToAll")}
        </Link>
      </div>
    );
  }

  const category = getCategoryInfo(letter.category);
  const emotion = getEmotionInfo(letter.emotion);
  const did = displayId(letter.letter_number);

  return (
    <section className="max-w-[640px] mx-auto pt-32 pb-20 px-6">
      <Link href="/letters/" className="font-mono text-[11px] tracking-[2px] text-dim hover:text-fg transition-colors inline-block mb-12">
        &larr; {t("letter.backToAll")}
      </Link>

      {/* Letter header */}
      <div className="border border-card-border bg-card-bg p-8 md:p-10 mb-8">
        <div className="flex justify-between items-center mb-6">
          <span className="font-mono text-[10px] tracking-[2px] text-dim">{did}</span>
          <span className="font-mono text-[10px] text-dim">{timeAgo(letter.created_at)}</span>
        </div>

        <div className="mb-5">
          <span className="font-mono text-[10px] tracking-[3px] uppercase text-dim">To:</span>
          <span className="ml-3 text-accent text-lg">{letter.recipient_label}</span>
        </div>

        <div className="flex gap-2 mb-8">
          <span className="font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border text-dim">
            {category.emoji} {t(`categories.${letter.category}`)}
          </span>
          <span className={`font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border ${emotion.color}`}>
            {t(`emotions.${letter.emotion}`)}
          </span>
        </div>

        <div className="mb-6">
          <TranslatedText text={letter.body} className="text-xl leading-[1.9] text-fg italic" />
        </div>

        <div className="flex gap-6 pt-6 border-t border-card-border">
          <button
            onClick={handleLike}
            className={`font-mono text-[10px] tracking-wider transition-all cursor-pointer ${
              liked ? "text-stamp-red scale-105" : "text-dim hover:text-stamp-red"
            }`}
          >
            {liked ? "\u2665" : "\u2661"} {letter.likes + (liked ? 1 : 0)}
          </button>
          <span className="font-mono text-[10px] tracking-wider text-dim">&#128065; {letter.views}</span>
          <span className="font-mono text-[10px] tracking-wider text-dim">&#9993; {replies.length}{t("letters.replyCount")}</span>
        </div>
      </div>

      {/* Ad: letter bottom */}
      <div className="mb-8">
        <AdBanner slot="letterBottom" format="horizontal" />
      </div>

      {/* Replies */}
      <div className="mb-10">
        <div className="font-mono text-[10px] tracking-[4px] uppercase text-dim mb-8 flex items-center gap-3">
          {t("letter.repliesTitle")}
          {replies.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 bg-card-bg border border-card-border rounded-sm">
              {replies.length}
            </span>
          )}
        </div>

        {replies.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-card-border">
            <div className="text-2xl opacity-20 mb-3">&#9993;</div>
            <p className="text-dim text-sm">{t("letter.noReplies")}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {replies.map((reply, i) => (
              <div
                key={reply.id}
                className="bg-card-bg border-l-2 border-blue p-5 opacity-0 animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <TranslatedText text={reply.body} className="text-sm text-accent leading-relaxed" />
                <span className="font-mono text-[9px] text-dim mt-3 block">{timeAgo(reply.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProxyReplyForm letterId={letter.id} recipientLabel={letter.recipient_label} onReplySubmitted={loadReplies} />
    </section>
  );
}

export default function LetterPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-dim tracking-widest">{t("letters.loading")}</span>
      </div>
    }>
      <LetterDetail />
    </Suspense>
  );
}
