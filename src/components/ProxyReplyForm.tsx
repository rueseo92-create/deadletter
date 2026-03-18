"use client";

import { useState } from "react";
import { supabase, getOrCreateUserId } from "@/lib/supabase-browser";
import { detectHarmful } from "@/lib/anonymizer";

interface ProxyReplyFormProps {
  letterId: string;
  recipientLabel: string;
  onReplySubmitted: () => void;
}

export default function ProxyReplyForm({
  letterId,
  recipientLabel,
  onReplySubmitted,
}: ProxyReplyFormProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit() {
    if (body.trim().length < 5) return;

    const harmfulMsg = detectHarmful(body);
    if (harmfulMsg) {
      setError(harmfulMsg);
      return;
    }

    setSending(true);
    setError("");

    const userId = getOrCreateUserId();

    const { error } = await supabase.from("replies").insert({
      letter_id: letterId,
      author_id: userId,
      body: body.trim(),
    });

    if (!error) {
      // reply_count 증가
      try { await supabase.rpc("increment_reply_count", { lid: letterId }); } catch {}

      setSent(true);
      onReplySubmitted();
    }

    setSending(false);
  }

  if (sent) {
    return (
      <div className="border border-card-border bg-card-bg p-6 text-center">
        <p className="text-accent text-sm">답장이 전해졌습니다.</p>
      </div>
    );
  }

  return (
    <div className="border border-card-border bg-card-bg p-6">
      <div className="font-mono text-[9px] tracking-[3px] uppercase text-blue mb-4">
        나는 &ldquo;{recipientLabel}&rdquo;이/가 아니지만...
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="낯선 사람으로서, 이 편지에 답장을 써주세요"
        maxLength={1000}
        rows={4}
        className="w-full bg-transparent border border-card-border text-fg text-sm leading-relaxed p-4 placeholder:text-dim/30 focus:outline-none focus:border-accent/40 resize-none font-display transition-colors"
      />

      <div className="flex justify-between items-center mt-3">
        <div>
          <span className="font-mono text-[10px] text-dim">
            {body.length}/1000
          </span>
          {error && (
            <span className="text-stamp-red text-xs ml-3">{error}</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={body.trim().length < 5 || sending}
          className="font-mono text-[11px] tracking-wider px-5 py-2 bg-blue text-white disabled:opacity-30 hover:bg-blue/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {sending ? "보내는 중..." : "답장 보내기"}
        </button>
      </div>
    </div>
  );
}
