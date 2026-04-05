import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "소개 | 데일리인사이트",
  description: "데일리인사이트 — 금융, 보험, 건강, IT, 부동산 생활 정보를 매일 쉽게 정리합니다.",
};

export default function AboutPage() {
  const posts = getAllPosts();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[400px] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-amber-50/40 to-pink-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative w-full max-w-5xl mx-auto px-6 pb-16 pt-36">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-stone-200/60 text-stone-500 text-xs font-medium mb-6 shadow-sm">
            <span className="text-base">📖</span>
            About Daily Insight
          </p>
          <h1 className="text-4xl lg:text-6xl font-extrabold text-stone-800 font-headline tracking-tight leading-[1.05] mb-5">
            데일리인사이트
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed max-w-xl">
            금융, 보험, 건강, IT, 부동산 —<br className="hidden lg:block" />
            생활 속 핵심 정보를 매일 쉽게 정리합니다.
          </p>
        </div>
      </section>

      {/* ── 소개 ── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">About</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-on-surface font-headline mb-6 leading-tight">
                복잡한 정보를<br />쉽게 정리합니다
              </h2>
              <div className="space-y-4 text-on-surface-variant leading-relaxed">
                <p>
                  데일리인사이트는 금융·재테크, 보험, 건강·의료, IT·테크, 부동산, 생활·자기계발 등
                  실생활에 바로 적용할 수 있는 핵심 정보를 매일 발행합니다.
                </p>
                <p>
                  검색해도 나오지 않는 핵심만, 전문가 수준의 정확한 정보를
                  누구나 이해할 수 있는 쉬운 언어로 전달하는 것이 저희의 목표입니다.
                </p>
                <p>
                  SEO 최적화된 고품질 콘텐츠를 통해 독자들에게 실질적인 가치를 제공합니다.
                </p>
              </div>
            </div>

            {/* 사이트 정보 카드 */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-amber-50/60 border border-stone-200/60 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-7">
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-extrabold shadow-sm">
                  DI
                </span>
                <div>
                  <p className="font-bold text-stone-800">데일리인사이트</p>
                  <p className="text-[11px] text-stone-400">Daily Insight</p>
                </div>
              </div>

              <div className="space-y-5 text-sm">
                {[
                  { label: "콘텐츠 분야", value: "금융·재테크 · 보험 · 건강·의료 · IT·테크 · 부동산 · 생활" },
                  { label: "콘텐츠 특징", value: "고CPC 키워드 기반, SEO 최적화, 실용 정보 중심" },
                  { label: "발행 주기", value: "매일 발행" },
                  { label: "웹사이트", value: "dailyinsight.kr" },
                  { label: "이메일", value: "contact@dailyinsight.kr" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-stone-700">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-6 border-t border-stone-200/60 flex gap-4">
                <a href="/business" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-blue-700 transition-colors">
                  서비스 보기 <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
                <a href="mailto:contact@dailyinsight.kr" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-stone-600 transition-colors">
                  문의하기 <span className="material-symbols-outlined text-xs">mail</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 핵심 가치 ── */}
      <section className="py-20 bg-stone-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">Our Values</p>
          <h2 className="text-2xl lg:text-3xl font-bold text-on-surface font-headline mb-12 leading-tight">
            데일리인사이트의 원칙
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                emoji: "✅",
                color: "bg-blue-100",
                title: "정확한 정보",
                desc: "공식 출처와 전문 자료를 기반으로 검증된 정보만을 제공합니다. 추측이나 과장 없이, 독자가 신뢰할 수 있는 콘텐츠를 만듭니다.",
              },
              {
                emoji: "💬",
                color: "bg-emerald-100",
                title: "쉬운 설명",
                desc: "전문 용어를 풀어서, 금융·보험·의료 등 어려운 주제도 누구나 이해할 수 있게 정리합니다. 핵심만 골라 담습니다.",
              },
              {
                emoji: "💡",
                color: "bg-amber-100",
                title: "실용적 가치",
                desc: "읽고 나면 바로 실행할 수 있는 팁과 가이드를 제공합니다. 이론이 아닌, 실생활에 바로 적용 가능한 콘텐츠가 핵심입니다.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-2xl bg-white ring-1 ring-stone-200/60">
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-lg">{item.emoji}</span>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface mb-0.5">{item.title}</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 콘텐츠 카테고리 ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">Categories</p>
          <h2 className="text-2xl font-bold text-on-surface font-headline mb-10">다루는 주제</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {siteConfig.categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="rounded-2xl bg-white border border-stone-200/60 p-6 hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <span className="text-3xl mb-3 block emoji-pop">{cat.emoji}</span>
                <h3 className="font-bold text-on-surface mb-2">{cat.name}</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {cat.slug === "finance" && "대출, 적금, 주식, 카드 등 금융·재테크 핵심 정보"}
                  {cat.slug === "insurance" && "실손보험, 자동차보험, 보험 비교·가입 가이드"}
                  {cat.slug === "health" && "비타민, 영양제, 다이어트, 건강 관리 실용 정보"}
                  {cat.slug === "tech" && "노트북, 스마트폰, 앱 리뷰 및 IT 활용 가이드"}
                  {cat.slug === "realestate" && "청약, 전세, 매매, 인테리어 등 부동산 정보"}
                  {cat.slug === "lifestyle" && "자격증, 자기계발, 생활 꿀팁 모음"}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 운영 현황 ── */}
      <section className="py-20 bg-stone-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">Live Status</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-on-surface font-headline mb-5 leading-tight">
                매일 업데이트되는 콘텐츠
              </h2>
              <div className="space-y-4 text-on-surface-variant leading-relaxed">
                <p>
                  데일리인사이트는 금융, 보험, 건강, IT, 부동산, 생활 등
                  실생활에 필요한 핵심 정보를 매일 새롭게 발행합니다.
                </p>
                <p>
                  각 분야 전문 키워드를 기반으로 SEO 최적화된 콘텐츠를 제공하여,
                  검색으로 쉽게 찾을 수 있는 유용한 정보를 만들어갑니다.
                </p>
              </div>
              <div className="mt-6 flex gap-4">
                <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-full hover:bg-blue-700 transition-colors shadow-md shadow-primary/20">
                  홈으로 <span className="material-symbols-outlined text-base">arrow_forward</span>
                </a>
                <a href="/posts" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-on-surface font-bold text-sm rounded-full border border-stone-200 hover:border-primary hover:text-primary transition-all">
                  전체 글 보기
                </a>
              </div>
            </div>

            {/* 수치 */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: `${posts.length}+`, label: "발행된 글", emoji: "📝" },
                  { num: "Daily", label: "업데이트", emoji: "🕐" },
                  { num: `${siteConfig.categories.length}`, label: "카테고리", emoji: "🗂️" },
                  { num: "100%", label: "SEO 최적화", emoji: "📈" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bg-white ring-1 ring-stone-200/60 p-5 text-center">
                    <span className="text-xl mb-2 block">{s.emoji}</span>
                    <p className="text-2xl font-extrabold text-on-surface font-headline">{s.num}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-amber-50/60 to-pink-50" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(59,130,246,0.06),transparent_60%)]" />
            <div className="relative p-10 lg:p-16 text-center">
              <span className="text-4xl mb-4 block">💌</span>
              <h2 className="text-2xl lg:text-3xl font-bold text-stone-800 font-headline mb-4">
                궁금한 점이 있으신가요?
              </h2>
              <p className="text-sm text-stone-500 mb-8 max-w-md mx-auto leading-relaxed">
                비즈니스 문의, 협업 제안, 또는 궁금한 점이 있으시면 편하게 연락주세요.
              </p>
              <a
                href="mailto:contact@dailyinsight.kr"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold text-sm rounded-full hover:bg-blue-700 transition-colors shadow-md shadow-primary/20"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                contact@dailyinsight.kr
              </a>
            </div>
          </div>

          <p className="mt-10 text-xs text-stone-400 text-center leading-relaxed max-w-2xl mx-auto">
            {siteConfig.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
