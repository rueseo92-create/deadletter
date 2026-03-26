"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, EMOTIONS } from "@/lib/categories";
import { anonymize, detectCrisis, detectHarmful, detectLanguage } from "@/lib/anonymizer";
import { supabase, getOrCreateUserId, isSupabaseConfigured } from "@/lib/supabase-browser";
import { useLanguage } from "@/components/LanguageProvider";
import AdBanner from "@/components/AdBanner";
import type { LetterCategory, LetterEmotion } from "@/types/database";

type Step = "category" | "recipient" | "emotion" | "body" | "sending" | "done";

const STEP_ORDER: Step[] = ["category", "recipient", "emotion", "body"];

function StepProgress({ current }: { current: Step }) {
  const idx = STEP_ORDER.indexOf(current);
  if (idx < 0) return null;

  return (
    <div className="flex items-center gap-2 mb-12">
      {STEP_ORDER.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i <= idx ? "bg-accent scale-100" : "bg-card-border scale-75"
            }`}
          />
          {i < STEP_ORDER.length - 1 && (
            <div
              className={`w-8 h-px transition-all duration-500 ${
                i < idx ? "bg-accent/50" : "bg-card-border"
              }`}
            />
          )}
        </div>
      ))}
      <span className="font-mono text-[9px] text-dim ml-3 tracking-wider">
        {idx + 1}/{STEP_ORDER.length}
      </span>
    </div>
  );
}

export default function WriteForm() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<LetterCategory | null>(null);
  const [recipientLabel, setRecipientLabel] = useState("");
  const [emotion, setEmotion] = useState<LetterEmotion | null>(null);
  const [body, setBody] = useState("");
  const [matchedLetter, setMatchedLetter] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!category || !emotion || !recipientLabel.trim() || !body.trim()) return;

    setStep("sending");
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
      setStep("body");
      return;
    }

    const harmfulRecipient = detectHarmful(recipientLabel);
    if (harmfulRecipient) {
      setError(t("filter.harmfulRecipient"));
      setStep("body");
      return;
    }

    if (detectCrisis(body)) {
      setError(t("filter.crisisMessage"));
      setStep("body");
      return;
    }

    const { text: anonymizedBody } = anonymize(body);
    const language = detectLanguage(body);
    const userId = getOrCreateUserId();

    if (!isSupabaseConfigured) {
      const demoMatches: Record<string, { to: string; body: string }> = {
        ex_lover: { to: "2년 전의 너에게", body: "네가 마지막으로 한 말이 아직도 귓가에 맴돌아. 미워하고 싶은데 그게 안 돼." },
        boss: { to: "칼퇴하면서 야근 강요하는 부장님에게", body: "저도 가족이 있어요. '열정'이라는 이름으로 제 시간을 착취하지 말아주세요." },
        parent: { to: "멀리 계신 딸에게", body: "네가 보고 싶구나. 말은 못 했지만, 매일 네 생각을 한단다. 잘 지내고 있지?" },
        child: { to: "하늘에 계신 아버지에게", body: "아버지, 저 잘 살고 있어요. 그때 왜 그랬는지 이제야 조금 알 것 같아요." },
        friend: { to: "초등학교 때 단짝에게", body: "갑자기 연락 끊어서 미안해. 어른이 되면서 연락하는 게 왜 이렇게 어려워졌을까." },
        younger_self: { to: "미래의 나에게", body: "지금 힘들지만 분명 잘 해내고 있을 거야. 그때의 내가 지금의 나를 응원해." },
        future_self: { to: "20살의 나에게", body: "지금 하고 있는 고민들, 나중에 보면 다 별거 아니야. 근데 그 순간의 감정은 진짜야." },
        deceased: { to: "먼저 떠난 할아버지에게", body: "할아버지, 저 결혼했어요. 하객석에 빈자리가 하나 있었어요." },
        society: { to: "항상 '괜찮아'라고 하는 나에게", body: "사람들 앞에서 웃는 게 너무 지쳤어. 진짜 나를 보여주면 다 떠날까 봐 무서워." },
      };
      const demo = demoMatches[category!] || demoMatches.friend;
      setMatchedLetter({
        id: "demo",
        recipient_label: demo.to,
        body: demo.body,
      });
      setStep("done");
      return;
    }

    await supabase
      .from("profiles")
      .upsert({ id: userId }, { onConflict: "id" });

    const { data: letter, error: insertError } = await supabase
      .from("letters")
      .insert({
        author_id: userId,
        recipient_label: recipientLabel.trim(),
        category,
        emotion,
        body: anonymizedBody,
        language,
      })
      .select()
      .single();

    if (insertError || !letter) {
      setError(t("write.errorSend"));
      setStep("body");
      return;
    }

    const complementMap: Record<string, string> = {
      parent: "child", child: "parent",
      younger_self: "future_self", future_self: "younger_self",
      boss: "boss", society: "society",
    };
    const complementCategory = complementMap[category] || category;

    const { data: candidates } = await supabase
      .from("letters")
      .select("*")
      .neq("author_id", userId)
      .is("matched_letter_id", null)
      .neq("id", letter.id)
      .eq("is_published", true)
      .or(`category.eq.${complementCategory},category.eq.${category}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (candidates && candidates.length > 0) {
      const best = candidates[0];
      setMatchedLetter(best);

      await supabase.from("matches").insert({
        letter_a: letter.id,
        letter_b: best.id,
      });
      await supabase
        .from("letters")
        .update({ matched_letter_id: best.id })
        .eq("id", letter.id);
      await supabase
        .from("letters")
        .update({ matched_letter_id: letter.id })
        .eq("id", best.id);
    }

    try { await supabase.rpc("increment_letters_written", { user_id: userId }); } catch {}

    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="text-center opacity-0 animate-fade-up">
        <div className="font-mono text-[10px] tracking-[6px] uppercase text-stamp-red border border-stamp-red inline-block px-4 py-2 mb-10 -rotate-1">
          {t("done.stamp")}
        </div>

        <h2 className="text-3xl md:text-4xl font-light text-accent-bright mb-4">
          {t("done.title")}
        </h2>
        <p className="text-dim mb-12 max-w-md mx-auto leading-relaxed">
          {t("done.subtitle")}
        </p>

        {matchedLetter && (
          <div className="max-w-lg mx-auto mb-12 text-left border border-card-border bg-card-bg p-8 opacity-0 animate-scale-in animation-delay-400">
            <div className="font-mono text-[9px] tracking-[3px] uppercase text-blue mb-6">
              {t("done.matchedTitle")}
            </div>
            <div className="font-mono text-[10px] tracking-[2px] text-dim mb-3">
              To: {matchedLetter.recipient_label}
            </div>
            <p className="text-fg italic leading-[1.8] mb-4">
              &ldquo;{matchedLetter.body}&rdquo;
            </p>
            <button
              onClick={() => router.push(`/letter/?id=${matchedLetter.id}`)}
              className="font-mono text-[11px] tracking-wider text-blue hover:text-accent-bright transition-colors cursor-pointer"
            >
              {t("done.writeReply")} &rarr;
            </button>
          </div>
        )}

        {/* Ad: write done */}
        <div className="max-w-lg mx-auto mb-10">
          <AdBanner slot="writeDone" format="horizontal" />
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setStep("category");
              setCategory(null);
              setEmotion(null);
              setRecipientLabel("");
              setBody("");
              setMatchedLetter(null);
            }}
            className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
          >
            {t("done.writeAnother")}
          </button>
          <button
            onClick={() => router.push("/letters")}
            className="font-mono text-[11px] tracking-wider px-6 py-3 bg-blue text-white hover:bg-blue/80 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            {t("done.readOthers")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="text-center py-20">
        <div className="inline-flex gap-3 mb-4">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "200ms" }} />
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "400ms" }} />
        </div>
        <div className="font-mono text-sm text-dim tracking-widest">
          {t("write.sending")}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <StepProgress current={step} />

      {/* Step 1: Category */}
      {step === "category" && (
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-light text-accent-bright mb-2">
            {t("write.categoryTitle")}
          </h2>
          <p className="text-dim text-sm mb-10">{t("write.categorySubtitle")}</p>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategory(cat.value);
                  setStep("recipient");
                }}
                className="text-left p-5 border border-card-border hover:border-accent/40 hover:bg-hover/60 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <span className="text-xl block mb-1">{cat.emoji}</span>
                <span className="text-sm text-dim group-hover:text-accent-bright transition-colors">
                  {t(`categories.${cat.value}`)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Recipient Label */}
      {step === "recipient" && (
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-light text-accent-bright mb-2">
            {t("write.recipientTitle")}
          </h2>
          <p className="text-dim text-sm mb-10">
            {t("write.recipientSubtitle")}
          </p>

          <div className="mb-4">
            <span className="font-mono text-[10px] tracking-[3px] uppercase text-dim">
              To:
            </span>
          </div>
          <input
            type="text"
            value={recipientLabel}
            onChange={(e) => setRecipientLabel(e.target.value)}
            placeholder={t("write.recipientPlaceholder")}
            maxLength={50}
            autoFocus
            className="w-full bg-transparent border-b border-card-border text-fg text-lg py-3 px-0 placeholder:text-dim/40 focus:outline-none focus:border-accent transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && recipientLabel.trim()) setStep("emotion");
            }}
          />
          <div className="font-mono text-[9px] text-dim mt-2 text-right">
            {recipientLabel.length}/50
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep("category")}
              className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
            >
              &larr; {t("write.back")}
            </button>
            <button
              onClick={() => recipientLabel.trim() && setStep("emotion")}
              disabled={!recipientLabel.trim()}
              className="font-mono text-[11px] tracking-wider px-6 py-3 bg-blue text-white disabled:opacity-30 hover:bg-blue/80 transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {t("write.next")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Emotion */}
      {step === "emotion" && (
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-light text-accent-bright mb-2">
            {t("write.emotionTitle")}
          </h2>
          <p className="text-dim text-sm mb-10">
            {t("write.emotionSubtitle")}
          </p>

          <div className="flex flex-wrap gap-3">
            {EMOTIONS.map((em) => (
              <button
                key={em.value}
                onClick={() => {
                  setEmotion(em.value);
                  setStep("body");
                }}
                className={`font-mono text-[11px] tracking-wider px-4 py-2.5 border border-card-border hover:border-accent/40 transition-all cursor-pointer active:scale-[0.97] ${em.color}`}
              >
                {t(`emotions.${em.value}`)}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <button
              onClick={() => setStep("recipient")}
              className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
            >
              &larr; {t("write.back")}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Body */}
      {step === "body" && (
        <div className="opacity-0 animate-fade-up">
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[3px] uppercase text-dim">
              To: {recipientLabel}
            </span>
            {emotion && (
              <span className="font-mono text-[9px] tracking-wider px-2 py-0.5 border border-card-border text-dim">
                {t(`emotions.${emotion}`)}
              </span>
            )}
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("write.bodyPlaceholder")}
            maxLength={2000}
            rows={10}
            autoFocus
            className="w-full bg-transparent border border-card-border text-fg text-[17px] leading-[1.8] p-6 placeholder:text-dim/30 focus:outline-none focus:border-accent/40 resize-none font-display italic transition-colors"
          />

          <div className="flex justify-between items-center mt-3 mb-8">
            <span className={`font-mono text-[10px] transition-colors ${body.length > 1800 ? "text-stamp-red" : "text-dim"}`}>
              {body.length}/2000
            </span>
            {error && (
              <span className="text-stamp-red text-sm whitespace-pre-line text-right max-w-[60%]">
                {error}
              </span>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("emotion")}
              className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
            >
              &larr; {t("write.back")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={body.trim().length < 10}
              className="font-mono text-[11px] tracking-wider px-8 py-3 bg-blue text-white disabled:opacity-30 hover:bg-blue/80 transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {t("write.send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
