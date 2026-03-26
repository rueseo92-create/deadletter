"use client";

import { useState } from "react";
import { supabase, getOrCreateUserId } from "@/lib/supabase-browser";
import { detectHarmful } from "@/lib/anonymizer";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit() {
    if (body.trim().length < 5) return;

    setSending(true);
    setError("");

    const harmfulMsg = detectHarmful(body);
    if (harmfulMsg) {
      if (harmfulMsg.includes("욕설") || harmfulMsg.includes("비속어")) {
        setError(t("filter.harmfulProfanity"));
      } else if (harmfulMsg.includes("성적")) {
        setError(t("filter.harmfulSexual"));
      } else {
        setError(harmfulMsg);
      }
      setSending(false);
      return;
    }

    const userId = getOrCreateUserId();

    const { error } = await supabase.from("replies").insert({
      letter_id: letterId,
      author_id: userId,
      body: body.trim(),
    });

    if (!error) {
      try { await supabase.rpc("increment_reply_count", { lid: letterId }); } catch {}

      setSent(true);
      onReplySubmitted();
    }

    setSending(false);
  }

  if (sent) {
    return (
      <div className="border border-card-border bg-card-bg p-8 text-center opacity-0 animate-scale-in">
        <div className="text-2xl mb-3 opacity-40">&#10003;</div>
        <p className="text-accent text-sm">{t("letter.replySent")}</p>
      </div>
    );
  }

  return (
    <div className="border border-card-border bg-card-bg p-6 md:p-8">
      <div className="font-mono text-[9px] tracking-[3px] uppercase text-blue mb-5">
        {t("letter.replyLabel").replace("{name}", recipientLabel)}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("letter.replyPlaceholder")}
        maxLength={1000}
        rows={4}
        className="w-full bg-transparent border border-card-border text-fg text-sm leading-relaxed p-4 placeholder:text-dim/30 focus:outline-none focus:border-accent/40 resize-none font-display transition-colors"
      />

      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center gap-3">
          <span className={`font-mono text-[10px] transition-colors ${body.length > 900 ? "text-stamp-red" : "text-dim"}`}>
            {body.length}/1000
          </span>
          {error && (
            <span className="text-stamp-red text-xs">{error}</span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={body.trim().length < 5 || sending}
          className="font-mono text-[11px] tracking-wider px-5 py-2.5 bg-blue text-white disabled:opacity-30 hover:bg-blue/80 transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
        >
          {sending ? t("letter.replySending") : t("letter.replySend")}
        </button>
      </div>
    </div>
  );
}
