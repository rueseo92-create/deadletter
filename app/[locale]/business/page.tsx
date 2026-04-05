import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { getAllPosts } from "@/lib/posts";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";
import InquiryForm from "@/components/InquiryForm";

export const metadata: Metadata = {
  title: "대행 서비스 | 데일리인사이트",
  description: "블로그 구축, 콘텐츠 제작, SEO 최적화, 수익화 컨설팅 — 전문가가 직접 대행해드립니다.",
};

export default async function BusinessPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const posts = getAllPosts();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[520px] lg:min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-amber-50/40 to-pink-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-32 lg:py-40 w-full">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-stone-200/60 text-stone-500 text-xs font-medium mb-8 shadow-sm">
              <span className="text-base">🤝</span>
              콘텐츠 대행 서비스
            </p>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-stone-800 leading-[1.1] tracking-tight font-headline mb-6">
              고품질 콘텐츠,<br />전문가가 대신.
            </h1>
            <div className="space-y-4 text-stone-500 text-lg leading-relaxed max-w-xl">
              <p>
                블로그 구축부터 SEO 최적화, 콘텐츠 제작, 수익화까지 —
                검증된 전문가가 직접 운영해드립니다.
              </p>
              <p className="text-stone-800 font-semibold text-xl">
                데일리인사이트가 증거입니다.
              </p>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-primary/20 text-sm"
              >
                서비스 살펴보기
                <span className="material-symbols-outlined text-base">arrow_downward</span>
              </a>
              <a
                href="#inquiry"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors border border-stone-200/80 text-sm"
              >
                <span className="material-symbols-outlined text-base">send</span>
                바로 견적 요청
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm text-primary font-bold mb-3 tracking-wider uppercase">Services</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline mb-4">
              이런 걸 대신 해드려요
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              데일리인사이트에 직접 적용하고 검증한 노하우를 기반으로 합니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                emoji: "✏️",
                title: "콘텐츠 제작 대행",
                diy: "직접 키워드 리서치하고 글 쓰기",
                agency: "고CPC 키워드 기반 SEO 최적화 콘텐츠를 매일 발행해드립니다",
                link: "/posts",
              },
              {
                emoji: "🔍",
                title: "SEO 최적화",
                diy: "구글 서치 콘솔, 스키마 마크업 직접 세팅",
                agency: "사이트 전체 기술적 SEO 분석 후 최적화 적용해드립니다",
                link: "/posts",
              },
              {
                emoji: "🌐",
                title: "블로그 / 웹사이트 구축",
                diy: "Next.js + Vercel 직접 배포",
                agency: "기획부터 디자인, 개발, 배포, 도메인 연결까지 통째로 만들어드립니다",
                link: "/posts",
              },
              {
                emoji: "💰",
                title: "수익화 세팅",
                diy: "애드센스 승인, 쿠팡 파트너스 직접 연동",
                agency: "광고 최적 배치, 제휴마케팅 상품 매칭까지 수익 극대화 세팅",
                link: "/posts",
              },
            ].map((item) => (
              <div key={item.title} className="group rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300 bg-white">
                <div className="p-6 lg:p-7">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="text-xl">{item.emoji}</span>
                    </div>
                    <h3 className="font-extrabold text-on-surface text-lg font-headline">{item.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-stone-50 border border-stone-100 p-3">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">직접 하기</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{item.diy}</p>
                      <a href={lh(item.link)} className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold mt-2 hover:underline">
                        가이드 보기 <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                      </a>
                    </div>
                    <div className="rounded-lg bg-blue-50/60 border border-blue-100/60 p-3">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">대행 맡기기</p>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{item.agency}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-amber-50/40 to-stone-50" />
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-3xl mb-3 block">🏆</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-stone-800 font-headline mb-3">
              증거요? 지금 보고 계세요.
            </h2>
            <p className="text-stone-500 text-sm">
              이 블로그 자체가 저희 노하우로 만든 결과물입니다.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              { num: `${posts.length}`, label: "발행된 글", emoji: "📝" },
              { num: "Daily", label: "콘텐츠 발행", emoji: "🕐" },
              { num: `${siteConfig.categories.length}`, label: "전문 카테고리", emoji: "🗂️" },
              { num: "100%", label: "SEO 최적화율", emoji: "📈" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white ring-1 ring-stone-200/60 shadow-card p-6 lg:p-8 text-center">
                <span className="text-2xl mb-3 block">{s.emoji}</span>
                <p className="text-3xl lg:text-4xl font-extrabold text-stone-800 font-headline">{s.num}</p>
                <p className="text-xs text-stone-400 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm text-primary font-bold mb-3 tracking-wider uppercase">Process</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline mb-4">
              진행은 이렇게 됩니다
            </h2>
            <p className="text-on-surface-variant">간단합니다. 클릭 몇 번이면 시작됩니다.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                emoji: "👆",
                title: "서비스 선택 & 견적 요청",
                desc: "원하는 서비스와 예산 범위를 클릭하고, 이메일만 입력하면 끝.",
                detail: "아래 견적 요청 폼에서 30초면 완료됩니다.",
              },
              {
                step: "02",
                emoji: "📋",
                title: "분석 & 제안",
                desc: "현재 상태를 분석하고, 맞춤 제안서를 드려요.",
                detail: "견적 + 직접 하시려면 이렇게 하세요 가이드도 같이 드려요.",
              },
              {
                step: "03",
                emoji: "🔧",
                title: "구축 & 세팅",
                desc: "합의된 범위대로 작업합니다. 중간중간 진행 상황 공유드려요.",
                detail: "블로그 구축, SEO 적용, 콘텐츠 발행 세팅 등.",
              },
              {
                step: "04",
                emoji: "🚀",
                title: "운영 & 인수인계",
                desc: "완성된 시스템을 넘겨드리고, 직접 운영할 수 있게 가이드해드려요.",
                detail: "인수인계 후에도 1개월 무료 지원.",
              },
            ].map((item) => (
              <div key={item.step} className="group rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-lg transition-all duration-300 bg-white">
                <div className="p-6 pt-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="text-lg">{item.emoji}</span>
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 tracking-wider">STEP {item.step}</span>
                  </div>
                  <h3 className="font-extrabold text-on-surface font-headline mb-2">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-2">{item.desc}</p>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 보충 설명 */}
          <div className="mt-12 grid sm:grid-cols-3 gap-4">
            {[
              { emoji: "⏱️", title: "소요 기간", desc: "간단한 블로그 세팅은 1~2주, 풀 세팅은 2~4주 정도 걸려요." },
              { emoji: "🔄", title: "수정 & 피드백", desc: "작업 중 피드백 반영은 무제한이에요. 만족하실 때까지 조정합니다." },
              { emoji: "🛟", title: "사후 지원", desc: "인수인계 후 1개월간 무료 지원. 이후에도 유지보수 계약이 가능해요." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-stone-50/80 border border-stone-200/80 p-5">
                <span className="text-lg mb-2 block">{item.emoji}</span>
                <h4 className="text-sm font-bold text-on-surface mb-1">{item.title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry Form ── */}
      <section id="inquiry" className="py-24 bg-stone-50/50 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm text-primary font-bold mb-3 tracking-wider uppercase">견적 요청</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline mb-4">
              클릭만으로 견적 요청 완료
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              서비스와 예산을 선택하고 이메일만 입력하면 맞춤 견적을 보내드립니다.
            </p>
          </div>

          <InquiryForm />
        </div>
      </section>
    </div>
  );
}
