"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 relative">
        <div
          className="font-mono text-[10px] tracking-[6px] uppercase text-stamp-red border border-stamp-red px-4 py-1.5 inline-block mb-12 -rotate-2 opacity-0 animate-fade-in"
        >
          return to sender
        </div>

        <h1 className="font-display font-light text-[clamp(36px,6vw,72px)] leading-[1.15] text-accent-bright max-w-[700px] opacity-0 animate-fade-up animation-delay-200 whitespace-pre-line">
          {t("hero.title")}
        </h1>

        <p className="text-dim text-base mt-7 max-w-[420px] leading-relaxed opacity-0 animate-fade-up animation-delay-400 whitespace-pre-line">
          {t("hero.subtitle")}
        </p>

        <div className="mt-12 flex flex-col items-center gap-3 opacity-0 animate-fade-up animation-delay-600">
          <Link
            href="/write"
            className="font-mono text-[13px] tracking-wider bg-blue text-white px-9 py-3.5 hover:bg-blue/80 transition-all hover:-translate-y-0.5"
          >
            {t("hero.cta")} &rarr;
          </Link>
          <span className="font-mono text-[10px] text-dim tracking-wider">
            {t("hero.tagline")}
          </span>
        </div>

        {/* iMessage-style mockup */}
        <div className="max-w-[340px] w-full mt-20 bg-card-bg border border-card-border p-6 opacity-0 animate-fade-up animation-delay-800">
          <div className="font-mono text-[9px] tracking-[2px] text-dim text-center mb-5 uppercase">
            deadletter &middot; anonymous
          </div>

          <div className="flex justify-end mb-3">
            <div className="max-w-[240px] bg-blue text-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-br-sm">
              엄마한테 미안하다고 말하고 싶었는데, 결국 못 했어요. 작년 봄에 돌아가셨거든요.
            </div>
          </div>

          <div className="flex justify-start mb-3">
            <div className="max-w-[260px] bg-[#1c1c1b] text-accent px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
              나는 당신의 엄마가 아니지만, 엄마로서 말해줄게요 &mdash; 그 마음, 분명 이미 닿았을 거예요.
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[240px] bg-[#1c1c1b] text-dim px-3.5 py-2.5 text-[12px] leading-relaxed rounded-2xl rounded-bl-sm font-mono tracking-wider">
              from a stranger who cares.
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 font-mono text-[10px] tracking-[3px] text-dim opacity-0 animate-fade-in animation-delay-1000 animate-float">
          &darr; scroll
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32 px-6 md:px-10 max-w-[900px] mx-auto">
        <div className="font-mono text-[10px] tracking-[4px] uppercase text-dim mb-12">
          {t("hero.howItWorksTitle")}
        </div>

        <div className="relative">
          <div className="absolute left-5 top-8 bottom-8 w-px bg-card-border" />

          {[
            {
              num: "01",
              title: t("hero.step1title"),
              desc: t("hero.step1desc"),
            },
            {
              num: "02",
              title: t("hero.step2title"),
              desc: t("hero.step2desc"),
            },
            {
              num: "03",
              title: t("hero.step3title"),
              desc: t("hero.step3desc"),
            },
            {
              num: "04",
              title: t("hero.step4title"),
              desc: t("hero.step4desc"),
            },
          ].map((step) => (
            <div key={step.num} className="flex gap-8 md:gap-10 py-9">
              <div className="font-mono text-xs text-accent min-w-[40px] h-10 flex items-center justify-center border border-card-border bg-bg relative z-10 shrink-0">
                {step.num}
              </div>
              <div>
                <h3 className="font-display text-[22px] text-accent-bright mb-2">
                  {step.title}
                </h3>
                <p className="text-[15px] text-dim leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sample Letters */}
      <div className="text-center py-20 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-card-border" />
        <span className="font-mono text-[10px] tracking-[4px] text-dim bg-bg px-4 py-4 relative">
          {t("hero.sampleTitle")}
        </span>
      </div>

      <section className="max-w-[640px] mx-auto px-6 md:px-10 pb-24">
        {[
          {
            id: "DL-0042",
            to: "3년 전 헤어진 너에게",
            body: "네가 마지막으로 한 말이 '미안해'였는데, 그 말이 진심이었는지 3년째 궁금해. 사실 난 아직도 그 카페 앞을 지나갈 때마다 발걸음이 느려져.",
            emotion: "그리움",
            reply: "나는 네 전 연인이 아니지만 — 그 '미안해'는 진심이었을 거야. 진심이 아닌 사람은 그 말을 하지 않거든.",
            replyCount: 12,
            likes: 891,
          },
          {
            id: "DL-0041",
            to: "돌아가신 할머니에게",
            body: "할머니, 나 의사 됐어. 할머니가 아플 때 아무것도 못 해줬던 게 시작이었어. 이제 다른 사람의 할머니는 지킬 수 있어.",
            emotion: "감사",
            reply: "할머니로서 말해줄게 — 네가 의사가 됐다는 게 아니라, 그 마음이 있다는 것 자체가 가장 큰 선물이란다.",
            replyCount: 34,
            likes: 2103,
          },
          {
            id: "DL-0040",
            to: "To the friend I ghosted",
            body: "I ghosted you because I was jealous of your life. It's been 2 years and I think about you every single day. I'm sorry.",
            emotion: "regret",
            reply: "I'm not your friend, but as someone who was ghosted — I'd forgive you in a heartbeat. The apology you can't send? It's already enough. Just try.",
            replyCount: 8,
            likes: 567,
          },
        ].map((letter) => (
          <article
            key={letter.id}
            className="border-t border-card-border py-10"
          >
            <div className="flex justify-between items-center mb-5">
              <span className="font-mono text-[10px] tracking-[2px] text-dim">
                {letter.id}
              </span>
              <span className="font-mono text-[9px] tracking-wider px-2 py-1 border border-card-border text-dim">
                {letter.emotion}
              </span>
            </div>

            <div className="mb-4">
              <span className="font-mono text-[10px] tracking-[2px] uppercase text-dim">
                To:
              </span>
              <span className="ml-2 text-accent text-sm">
                {letter.to}
              </span>
            </div>

            <div className="text-[17px] leading-[1.8] text-fg mb-6 italic">
              &ldquo;{letter.body}&rdquo;
            </div>

            <div className="bg-card-bg border-l-2 border-blue p-4 mb-5">
              <div className="font-mono text-[9px] tracking-[2px] text-blue mb-2 uppercase">
                a stranger replied
              </div>
              <p className="text-sm text-accent leading-relaxed">
                {letter.reply}
              </p>
            </div>

            <div className="flex gap-6">
              <span className="font-mono text-[10px] text-dim">
                &#9829; {letter.likes.toLocaleString()}
              </span>
              <span className="font-mono text-[10px] text-dim">
                &#9993; {letter.replyCount}개 답장
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* CTA */}
      <div className="text-center py-20 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-card-border" />
        <span className="font-mono text-[10px] tracking-[4px] text-dim bg-bg px-4 py-4 relative">
          {t("hero.yourTurn")}
        </span>
      </div>

      <section className="min-h-[60vh] flex flex-col justify-center items-center text-center px-6 pb-20">
        <h2 className="font-display font-light text-[clamp(28px,4vw,48px)] text-accent-bright mb-4 whitespace-pre-line">
          {t("hero.bottomTitle")}
        </h2>
        <p className="text-dim mb-10 max-w-md leading-relaxed">
          {t("hero.bottomSubtitle")}
        </p>
        <Link
          href="/write"
          className="font-mono text-[13px] tracking-wider bg-blue text-white px-9 py-3.5 hover:bg-blue/80 transition-all hover:-translate-y-0.5"
        >
          {t("hero.cta")} &rarr;
        </Link>
      </section>
    </>
  );
}
