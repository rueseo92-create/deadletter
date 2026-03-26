"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import AdBanner from "@/components/AdBanner";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 relative">
        <div
          className="font-mono text-[10px] tracking-[6px] uppercase text-stamp-red border border-stamp-red px-4 py-1.5 inline-block mb-12 -rotate-2 opacity-0 animate-fade-in"
        >
          {t("hero.stamp")}
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
            className="font-mono text-[13px] tracking-wider bg-blue text-white px-9 py-3.5 hover:bg-blue/80 transition-all hover:-translate-y-0.5 active:translate-y-0"
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
            {t("hero.mockupHeader")}
          </div>

          <div className="flex justify-end mb-3">
            <div className="max-w-[240px] bg-blue text-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-br-sm">
              {t("hero.mockupMsg1")}
            </div>
          </div>

          <div className="flex justify-start mb-3">
            <div className="max-w-[260px] bg-[#1c1c1b] text-accent px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
              {t("hero.mockupReply1")}
            </div>
          </div>

          <div className="flex justify-start">
            <div className="max-w-[240px] bg-[#1c1c1b] text-dim px-3.5 py-2.5 text-[12px] leading-relaxed rounded-2xl rounded-bl-sm font-mono tracking-wider">
              {t("hero.mockupReply2")}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 font-mono text-[10px] tracking-[3px] text-dim opacity-0 animate-fade-in animation-delay-1000 animate-float">
          &darr; {t("hero.scroll")}
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
          ].map((step, i) => (
            <div key={step.num} className={`flex gap-8 md:gap-10 py-9 opacity-0 animate-fade-up`} style={{ animationDelay: `${i * 150}ms` }}>
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

      {/* Ad: between sections */}
      <div className="max-w-[640px] mx-auto px-6 md:px-10">
        <AdBanner slot="landing" format="horizontal" />
      </div>

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
            to: t("hero.sample1to"),
            body: t("hero.sample1body"),
            emotion: t("hero.sample1emotion"),
            reply: t("hero.sample1reply"),
            replyCount: 12,
            likes: 891,
          },
          {
            id: "DL-0041",
            to: t("hero.sample2to"),
            body: t("hero.sample2body"),
            emotion: t("hero.sample2emotion"),
            reply: t("hero.sample2reply"),
            replyCount: 34,
            likes: 2103,
          },
          {
            id: "DL-0040",
            to: t("hero.sample3to"),
            body: t("hero.sample3body"),
            emotion: t("hero.sample3emotion"),
            reply: t("hero.sample3reply"),
            replyCount: 8,
            likes: 567,
          },
        ].map((letter, i) => (
          <article
            key={letter.id}
            className={`border-t border-card-border py-10 opacity-0 animate-fade-up`}
            style={{ animationDelay: `${i * 200}ms` }}
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
                {t("hero.strangerReplied")}
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
                &#9993; {letter.replyCount}{t("letters.replyCount")}
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
          className="font-mono text-[13px] tracking-wider bg-blue text-white px-9 py-3.5 hover:bg-blue/80 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {t("hero.cta")} &rarr;
        </Link>
      </section>
    </>
  );
}
