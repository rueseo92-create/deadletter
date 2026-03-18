"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, EMOTIONS } from "@/lib/categories";
import { anonymize, detectCrisis, detectHarmful, detectLanguage } from "@/lib/anonymizer";
import { supabase, getOrCreateUserId, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { LetterCategory, LetterEmotion } from "@/types/database";

type Step = "category" | "recipient" | "emotion" | "body" | "sending" | "done";

export default function WriteForm() {
  const router = useRouter();
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

    // 유해 콘텐츠 감지
    const harmfulMsg = detectHarmful(body);
    if (harmfulMsg) {
      setError(harmfulMsg);
      setStep("body");
      return;
    }

    // 수신인 유해 콘텐츠 감지
    const harmfulRecipient = detectHarmful(recipientLabel);
    if (harmfulRecipient) {
      setError("수신인에 부적절한 표현이 포함되어 있어요.");
      setStep("body");
      return;
    }

    // 위기 감지
    if (detectCrisis(body)) {
      setError(
        "당신의 이야기를 들을 수 있어서 다행이에요. 지금 힘드시다면 전문 상담을 받아보세요.\n\n자살예방상담전화: 1393\n정신건강위기상담전화: 1577-0199"
      );
      setStep("body");
      return;
    }

    // 익명화
    const { text: anonymizedBody } = anonymize(body);
    const language = detectLanguage(body);
    const userId = getOrCreateUserId();

    // 데모 모드 (Supabase 미설정)
    if (!isSupabaseConfigured) {
      const demoMatches: Record<string, { to: string; body: string }> = {
        parent: { to: "멀리 계신 딸에게", body: "네가 보고 싶구나. 말은 못 했지만, 매일 네 생각을 한단다. 잘 지내고 있지?" },
        child: { to: "하늘에 계신 아버지에게", body: "아버지, 저 잘 살고 있어요. 그때 왜 그랬는지 이제야 조금 알 것 같아요." },
        ex_lover: { to: "2년 전의 너에게", body: "네가 마지막으로 한 말이 아직도 귓가에 맴돌아. 미워하고 싶은데 그게 안 돼." },
        friend: { to: "초등학교 때 단짝에게", body: "갑자기 연락 끊어서 미안해. 어른이 되면서 연락하는 게 왜 이렇게 어려워졌을까." },
        younger_self: { to: "미래의 나에게", body: "지금 힘들지만 분명 잘 해내고 있을 거야. 그때의 내가 지금의 나를 응원해." },
        future_self: { to: "20살의 나에게", body: "지금 하고 있는 고민들, 나중에 보면 다 별거 아니야. 근데 그 순간의 감정은 진짜야." },
        deceased: { to: "먼저 떠난 할아버지에게", body: "할아버지, 저 결혼했어요. 하객석에 빈자리가 하나 있었어요." },
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

    // 프로필 확인/생성
    await supabase
      .from("profiles")
      .upsert({ id: userId }, { onConflict: "id" });

    // 편지 저장
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
      setError("편지를 보내지 못했어요. 다시 시도해주세요.");
      setStep("body");
      return;
    }

    // 매칭 시도: 보완 카테고리의 편지 찾기
    const complementMap: Record<string, string> = {
      parent: "child", child: "parent",
      younger_self: "future_self", future_self: "younger_self",
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

    // 프로필 업데이트
    try { await supabase.rpc("increment_letters_written", { user_id: userId }); } catch {}

    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="text-center opacity-0 animate-fade-up">
        <div className="font-mono text-[10px] tracking-[6px] uppercase text-stamp-red border border-stamp-red inline-block px-4 py-2 mb-10 -rotate-1">
          delivered to the void
        </div>

        <h2 className="text-3xl md:text-4xl font-light text-accent-bright mb-4">
          편지가 떠났습니다
        </h2>
        <p className="text-dim mb-12 max-w-md mx-auto leading-relaxed">
          당신의 말은 이제 바다 위를 떠다니다 누군가에게 닿을 거예요.
        </p>

        {matchedLetter && (
          <div className="max-w-lg mx-auto mb-12 text-left border border-card-border bg-card-bg p-8">
            <div className="font-mono text-[9px] tracking-[3px] uppercase text-blue mb-6">
              당신에게 도착한 편지
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
              답장 쓰기 &rarr;
            </button>
          </div>
        )}

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
            한 통 더 쓰기
          </button>
          <button
            onClick={() => router.push("/letters")}
            className="font-mono text-[11px] tracking-wider px-6 py-3 bg-blue text-white hover:bg-blue/80 transition-colors cursor-pointer"
          >
            다른 편지 읽기
          </button>
        </div>
      </div>
    );
  }

  if (step === "sending") {
    return (
      <div className="text-center py-20">
        <div className="font-mono text-sm text-dim tracking-widest animate-pulse">
          편지를 보내는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Step 1: Category */}
      {step === "category" && (
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-light text-accent-bright mb-2">
            누구에게 쓰나요?
          </h2>
          <p className="text-dim text-sm mb-10">이 편지는 전달되지 않습니다.</p>

          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategory(cat.value);
                  setStep("recipient");
                }}
                className="text-left p-4 border border-card-border hover:border-accent/40 hover:bg-hover transition-all cursor-pointer group"
              >
                <span className="text-lg mr-2">{cat.emoji}</span>
                <span className="text-sm text-dim group-hover:text-accent-bright transition-colors">
                  {cat.label}
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
            편지의 수신인을 적어주세요
          </h2>
          <p className="text-dim text-sm mb-10">
            이름 대신 당신만 아는 호칭으로.
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
            placeholder="3년 전 헤어진 너에게"
            maxLength={50}
            autoFocus
            className="w-full bg-transparent border-b border-card-border text-fg text-lg py-3 px-0 placeholder:text-dim/40 focus:outline-none focus:border-accent transition-colors"
          />

          <div className="flex justify-between mt-10">
            <button
              onClick={() => setStep("category")}
              className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
            >
              &larr; 뒤로
            </button>
            <button
              onClick={() => recipientLabel.trim() && setStep("emotion")}
              disabled={!recipientLabel.trim()}
              className="font-mono text-[11px] tracking-wider px-6 py-3 bg-blue text-white disabled:opacity-30 hover:bg-blue/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Emotion */}
      {step === "emotion" && (
        <div className="opacity-0 animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-light text-accent-bright mb-2">
            어떤 마음인가요?
          </h2>
          <p className="text-dim text-sm mb-10">
            비슷한 감정의 편지와 연결됩니다.
          </p>

          <div className="flex flex-wrap gap-3">
            {EMOTIONS.map((em) => (
              <button
                key={em.value}
                onClick={() => {
                  setEmotion(em.value);
                  setStep("body");
                }}
                className={`font-mono text-[11px] tracking-wider px-4 py-2 border border-card-border hover:border-accent/40 transition-all cursor-pointer ${em.color}`}
              >
                {em.label}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <button
              onClick={() => setStep("recipient")}
              className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
            >
              &larr; 뒤로
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Body */}
      {step === "body" && (
        <div className="opacity-0 animate-fade-up">
          <div className="mb-6">
            <span className="font-mono text-[10px] tracking-[3px] uppercase text-dim">
              To: {recipientLabel}
            </span>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="보내지 못한 말을 여기에 적어주세요..."
            maxLength={2000}
            rows={10}
            autoFocus
            className="w-full bg-transparent border border-card-border text-fg text-[17px] leading-[1.8] p-6 placeholder:text-dim/30 focus:outline-none focus:border-accent/40 resize-none font-display italic transition-colors"
          />

          <div className="flex justify-between items-center mt-2 mb-8">
            <span className="font-mono text-[10px] text-dim">
              {body.length}/2000
            </span>
            {error && (
              <span className="text-stamp-red text-sm whitespace-pre-line text-right">
                {error}
              </span>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("emotion")}
              className="font-mono text-[11px] tracking-wider text-dim hover:text-fg transition-colors cursor-pointer"
            >
              &larr; 뒤로
            </button>
            <button
              onClick={handleSubmit}
              disabled={body.trim().length < 10}
              className="font-mono text-[11px] tracking-wider px-8 py-3 bg-blue text-white disabled:opacity-30 hover:bg-blue/80 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              편지 보내기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
