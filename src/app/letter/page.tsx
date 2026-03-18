"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, getOrCreateUserId, isSupabaseConfigured } from "@/lib/supabase-browser";
import { getCategoryInfo, getEmotionInfo } from "@/lib/categories";
import { displayId } from "@/types/database";
import ProxyReplyForm from "@/components/ProxyReplyForm";
import type { Letter, Reply } from "@/types/database";

// 데모 편지 데이터
const DEMO_LETTERS: Record<string, Letter & { demoReplies: Reply[] }> = {
  demo: {
    id: "demo",
    letter_number: 42,
    author_id: "",
    recipient_label: "3년 전 헤어진 너에게",
    category: "ex_lover",
    emotion: "longing",
    body: "네가 마지막으로 한 말이 '미안해'였는데, 그 말이 진심이었는지 3년째 궁금해. 사실 난 아직도 그 카페 앞을 지나갈 때마다 발걸음이 느려져.",
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
        body: "나는 네 전 연인이 아니지만 — 그 '미안해'는 진심이었을 거야. 진심이 아닌 사람은 그 말을 하지 않거든.",
        likes: 234,
        created_at: "2026-03-17T22:30:00Z",
      },
      {
        id: "r2",
        letter_id: "demo",
        author_id: "",
        body: "나도 비슷한 경험이 있어서 이해해. 시간이 지나면 '그 사람도 힘들었겠구나'라는 생각이 들 거야. 그게 놓아주는 첫 걸음이더라.",
        likes: 156,
        created_at: "2026-03-18T01:00:00Z",
      },
    ],
  },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

function LetterDetail() {
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

    // 데모 모드
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-dim tracking-widest">loading...</span>
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="font-display text-2xl font-light text-accent">편지를 찾을 수 없어요</h2>
        <Link href="/letters/" className="font-mono text-[11px] tracking-wider text-dim hover:text-fg">
          &larr; 모든 편지 보기
        </Link>
      </div>
    );
  }

  const category = getCategoryInfo(letter.category);
  const emotion = getEmotionInfo(letter.emotion);
  const did = displayId(letter.letter_number);

  return (
    <section className="max-w-[640px] mx-auto pt-32 pb-20 px-6">
      <Link href="/letters/" className="font-mono text-[11px] tracking-[2px] text-dim hover:text-fg transition-colors inline-block mb-10">
        &larr; ALL LETTERS
      </Link>

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
          {category.emoji} {category.label}
        </span>
        <span className={`font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border ${emotion.color}`}>
          {emotion.label}
        </span>
      </div>

      <div className="text-xl leading-[1.9] text-fg italic mb-10">
        &ldquo;{letter.body}&rdquo;
      </div>

      <div className="flex gap-6 mb-12 pb-8 border-b border-card-border">
        <button onClick={handleLike} className={`font-mono text-[10px] tracking-wider transition-colors cursor-pointer ${liked ? "text-stamp-red" : "text-dim hover:text-accent"}`}>
          &#9829; {letter.likes + (liked ? 1 : 0)}
        </button>
        <span className="font-mono text-[10px] tracking-wider text-dim">&#128065; {letter.views}</span>
        <span className="font-mono text-[10px] tracking-wider text-dim">&#9993; {replies.length}개 답장</span>
      </div>

      <div className="mb-10">
        <div className="font-mono text-[10px] tracking-[4px] uppercase text-dim mb-8">Replies from strangers</div>

        {replies.length === 0 ? (
          <p className="text-dim text-sm mb-8">아직 답장이 없어요. 첫 번째 답장을 남겨보세요.</p>
        ) : (
          <div className="space-y-6 mb-10">
            {replies.map((reply) => (
              <div key={reply.id} className="bg-card-bg border-l-2 border-blue p-5">
                <p className="text-sm text-accent leading-relaxed mb-3">{reply.body}</p>
                <span className="font-mono text-[9px] text-dim">{timeAgo(reply.created_at)}</span>
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
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-mono text-sm text-dim tracking-widest">loading...</span>
      </div>
    }>
      <LetterDetail />
    </Suspense>
  );
}
