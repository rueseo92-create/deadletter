import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { SERVICES, PLANS } from "@/lib/agency";
import { INDUSTRIES, getIndustry } from "@/lib/industries";
import InquiryForm from "@/components/InquiryForm";
import { Icon } from "@/components/Icon";
import { localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

// 업종별 랜딩은 한국어만 (영어 경로는 404)
export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ locale: "ko", industry: i.slug }));
}

export function generateMetadata({ params }: { params: { locale: string; industry: string } }): Metadata {
  const ind = getIndustry(params.industry);
  if (!ind || params.locale === "en") return {};
  return {
    title: `${ind.name} 사장님을 위한 AI 자동화`,
    description: `${ind.name}에서 매일 반복하는 일을 버튼 한 번으로. ${siteConfig.name} ${siteConfig.studio}가 대신 세팅해 드립니다.`,
    alternates: { canonical: `${siteConfig.url}/for/${ind.slug}` },
  };
}

export default function IndustryPage({ params }: { params: { locale: string; industry: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const ind = getIndustry(params.industry);
  if (!ind || locale === "en") notFound();
  const lh = (path: string) => localizedHref(path, locale);
  const diag = PLANS[0];
  const svc = (id: string) => SERVICES.find((s) => s.id === id);

  return (
    <div>
      <header className="border-b border-line">
        <div className="mx-auto max-w-page px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
          <p className="eyebrow">For {ind.name}</p>
          <h1 className="mt-4 max-w-3xl text-[1.9rem] font-bold leading-[1.3] tracking-[-0.035em] text-ink sm:text-[2.4rem]">
            {ind.title}
          </h1>
          <p className="mt-6 max-w-2xl text-[16.5px] leading-[1.8] text-ink-2">{ind.lead}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a href="#contact" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-ink px-5 text-[15px] font-bold text-bg hover:opacity-90">
              {diag.name} {diag.price === "무료" ? `무료로 받기 (${diag.off})` : "신청"} <Icon name="arrowRight" className="h-4 w-4" />
            </a>
            <a href={`${lh("/")}#services`} className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-[15px] font-semibold text-ink hover:border-ink">
              전체 서비스 보기
            </a>
          </div>
        </div>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">이런 일부터 줄여요</p>
          <h2 className="mt-3 text-[1.6rem] font-black tracking-[-0.03em] text-ink">{ind.name}에서 자주 듣는 반복 업무</h2>
          <p className="mt-2 text-[14.5px] text-ink-3">아래는 예시예요. 실제로 무엇을 만들지는 30분 상담에서 사장님 가게에 맞춰 정합니다.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {ind.tasks.map((t) => {
              const s = svc(t.service);
              return (
                <li key={t.pain} className="rounded-2xl border border-line bg-surface p-6">
                  <p className="text-[15.5px] font-bold leading-snug text-ink">“{t.pain}”</p>
                  <p className="mt-3 flex gap-2 text-[14.5px] leading-relaxed text-ink-2">
                    <Icon name="check" className="mt-1 h-4 w-4 shrink-0" strokeWidth={2.4} />
                    <span>{t.fix}</span>
                  </p>
                  {s && (
                    <p className="mt-4 text-[13px] text-ink-3">
                      {s.name} · {s.from}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">먼저 확인하는 것</p>
          <h2 className="mt-3 text-[1.6rem] font-black tracking-[-0.03em] text-ink">필요 없는 건 만들지 않아요</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-[15px] leading-relaxed text-ink-2">
            {ind.checks.map((c) => (
              <li key={c} className="flex gap-2">
                <Icon name="shield" className="mt-1 h-4 w-4 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
            <li className="flex gap-2">
              <Icon name="shield" className="mt-1 h-4 w-4 shrink-0" />
              <span>매출·방문자 수를 약속하지 않아요. 할 수 있는 것과 없는 것부터 솔직하게 말씀드려요.</span>
            </li>
          </ul>
        </div>
      </section>

      <section id="contact" className="scroll-mt-20 bg-subtle/60">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Contact</p>
            <h2 className="mt-3 text-[2rem] font-black leading-tight tracking-[-0.04em] text-ink">
              가장 귀찮은 일
              <br />
              <span className="hl">한 줄</span>이면 돼요
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">
              업종 칸에 “{ind.label}”라고 적어 주시면 위 예시를 기준으로 이야기를 시작할게요.
            </p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-3">
              {diag.name}: {diag.price === "무료" ? `${diag.off} (이후 ${diag.was})` : diag.price} · {diag.period}
            </p>
          </div>
          <div className="lg:col-span-7">
            <InquiryForm services={SERVICES.map((s) => ({ id: s.id, name: s.name }))} email={siteConfig.email} />
          </div>
        </div>
      </section>
    </div>
  );
}
