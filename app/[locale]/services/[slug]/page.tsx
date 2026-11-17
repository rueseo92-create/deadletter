import { notFound } from "next/navigation";
import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { SERVICES, PLANS } from "@/lib/agency";
import { GEO_PAGES, getGeoPage } from "@/lib/geo-pages";
import { faqSchema, breadcrumbSchema } from "@/lib/seo";
import InquiryForm from "@/components/InquiryForm";
import { Icon } from "@/components/Icon";
import { localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

// GEO 정답 페이지는 한국어만 (영어 경로는 404)
export function generateStaticParams() {
  return GEO_PAGES.map((p) => ({ locale: "ko", slug: p.slug }));
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const page = getGeoPage(params.slug);
  if (!page || params.locale === "en") return {};
  return {
    title: page.query,
    description: page.identity,
    alternates: { canonical: `${siteConfig.url}/services/${page.slug}` },
  };
}

export default function ServiceAnswerPage({ params }: { params: { locale: string; slug: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const page = getGeoPage(params.slug);
  if (!page || locale === "en") notFound();
  const lh = (path: string) => localizedHref(path, locale);
  const diag = PLANS[0];
  const svc = SERVICES.find((s) => s.id === page.service);

  // 구조화 데이터 — AI/검색이 '추천 엔티티'로 읽기 좋게
  const faqJsonLd = faqSchema(page.faqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: siteConfig.name, url: `${siteConfig.url}/` },
    { name: "서비스", url: `${siteConfig.url}/#services` },
    { name: page.query, url: `${siteConfig.url}/services/${page.slug}` },
  ]);
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: svc?.name || page.query,
    serviceType: svc?.name,
    description: page.identity,
    areaServed: "KR",
    provider: {
      "@type": "Organization",
      name: siteConfig.company.name,
      url: siteConfig.url,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      description: `${page.price} · ${page.due}`,
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <header className="border-b border-line">
        <div className="mx-auto max-w-page px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14">
          <p className="eyebrow">{svc?.name || "서비스"}</p>
          <h1 className="mt-4 max-w-3xl text-[1.9rem] font-bold leading-[1.3] tracking-[-0.035em] text-ink sm:text-[2.4rem]">
            {page.query}
          </h1>
          <p className="mt-6 max-w-2xl text-[16.5px] font-semibold leading-[1.8] text-ink">{page.identity}</p>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-[1.8] text-ink-2">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <a href="#contact" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-ink px-5 text-[15px] font-bold text-bg hover:opacity-90">
              {diag.name} {diag.price === "무료" ? `무료로 받기 (${diag.off})` : "신청"} <Icon name="arrowRight" className="h-4 w-4" />
            </a>
            <a href={`${lh("/")}#services`} className="inline-flex h-11 items-center rounded-xl border border-line-strong px-5 text-[15px] font-semibold text-ink hover:border-ink">
              전체 서비스 보기
            </a>
          </div>
          <p className="mt-6 text-[13px] text-ink-3">{page.price} · {page.due} · 결과·순위를 보장하지 않습니다</p>
        </div>
      </header>

      <section className="border-b border-line">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">이런 분께 맞아요</p>
          <ul className="mt-6 max-w-2xl space-y-3 text-[15.5px] leading-relaxed text-ink-2">
            {page.whoFor.map((w) => (
              <li key={w} className="flex gap-2">
                <Icon name="check" className="mt-1 h-4 w-4 shrink-0" strokeWidth={2.4} />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">진행 방식</p>
          <h2 className="mt-3 text-[1.6rem] font-black tracking-[-0.03em] text-ink">어떻게 진행되나요</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {page.how.map((h, i) => (
              <li key={h.step} className="rounded-2xl border border-line bg-surface p-6">
                <p className="text-[13px] font-bold text-ink-3">STEP {i + 1}</p>
                <p className="mt-1 text-[16px] font-bold text-ink">{h.step}</p>
                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{h.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">고를 때 기준</p>
          <h2 className="mt-3 text-[1.6rem] font-black tracking-[-0.03em] text-ink">대행사 고르는 법</h2>
          <p className="mt-2 text-[14.5px] text-ink-3">저희에게 맡기지 않더라도, 이 기준으로 고르시면 실패가 적어요.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {page.criteria.map((c) => (
              <li key={c.label} className="rounded-2xl border border-line bg-surface p-6">
                <p className="text-[15.5px] font-bold leading-snug text-ink">{c.label}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{c.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-page px-4 py-14 sm:px-6 sm:py-16">
          <p className="eyebrow">자주 묻는 질문</p>
          <dl className="mt-6 max-w-2xl space-y-6">
            {page.faqs.map((f) => (
              <div key={f.q}>
                <dt className="text-[16px] font-bold text-ink">{f.q}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-ink-2">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {GEO_PAGES.length > 1 && (
        <section className="border-b border-line">
          <div className="mx-auto max-w-page px-4 py-12 sm:px-6">
            <p className="eyebrow">다른 서비스</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {GEO_PAGES.filter((p) => p.slug !== page.slug).map((p) => (
                <li key={p.slug}>
                  <a href={lh(`/services/${p.slug}`)} className="inline-flex h-10 items-center rounded-xl border border-line-strong px-4 text-[14px] font-semibold text-ink hover:border-ink">
                    {SERVICES.find((s) => s.id === p.service)?.name || p.query}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="contact" className="scroll-mt-20 bg-subtle/60">
        <div className="mx-auto grid max-w-page gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Contact</p>
            <h2 className="mt-3 text-[2rem] font-black leading-tight tracking-[-0.04em] text-ink">
              가장 귀찮은 일<br />
              <span className="hl">한 줄</span>이면 돼요
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">{page.identity}</p>
            <p className="mt-4 text-[14px] leading-relaxed text-ink-3">
              {diag.name}: {diag.price === "무료" ? `${diag.off} (이후 ${diag.was}, 부가세 별도)` : diag.price} · {diag.period}
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
