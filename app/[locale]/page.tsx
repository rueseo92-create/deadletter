import { getAllPosts } from "@/lib/posts";
import { siteConfig, categoryName, categoryDescription } from "@/lib/config";
import { PostCard } from "@/components/PostCard";
import { CoupangLinkAd } from "@/components/CoupangAd";
import NewsletterForm from "@/components/NewsletterForm";
import { CategoryBadge, Icon } from "@/components/Icon";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

const PROCESS_STEPS = [
  { title: "원문부터 확인", desc: "공식 발표·문서·원문 기사를 먼저 모읍니다." },
  { title: "AI 보조 초안", desc: "구조화와 요약은 AI가, 판단과 편집은 사람이 합니다." },
  { title: "슬롭 킬러 검수", desc: "10인 검수 패널의 기준을 통과한 글만 발행합니다." },
  { title: "출처 공개", desc: "모든 글 하단에 참고한 원문 링크를 남깁니다." },
];

export default async function Home({ params }: { params: { locale: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const en = locale === "en";

  const posts = getAllPosts(locale as "ko" | "en");
  const [featured, ...rest] = posts;
  const recent = rest.slice(0, 6);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-page gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <p className="eyebrow">{siteConfig.nameEn} · {en ? "Practical AI media" : "AI 실전 미디어"}</p>
            <h1 className="mt-4 text-[2rem] font-bold leading-[1.25] tracking-[-0.035em] text-ink sm:text-[2.6rem] lg:text-[2.95rem]">
              {en ? (
                <>
                  AI automation, side hustles &amp; news —{" "}
                  <span className="text-ink-3">verified and organized.</span>
                </>
              ) : (
                <>
                  AI 자동화 · AI 부업 · AI 뉴스,
                  <br />
                  <span className="text-ink-3">검증해서 정리합니다.</span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-[1.75] text-ink-2 sm:text-[17px]">
              {en
                ? "From the flood of AI news and tools, we pick only what you can actually use — with sources."
                : "매일 쏟아지는 AI 소식과 도구 중 실제로 써먹을 수 있는 것만 골라, 원문 출처와 함께 정리합니다."}
            </p>
            <nav aria-label={en ? "Topics" : "주제"} className="mt-7">
              <ul className="flex flex-wrap gap-2">
                {siteConfig.categories.map((cat) => (
                  <li key={cat.slug}>
                    <a href={lh(`/categories/${cat.slug}`)} className="chip">
                      <Icon name={cat.icon} className="h-3.5 w-3.5 text-accent" />
                      {categoryName(cat, locale)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <aside
            aria-labelledby="process-title"
            className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:col-span-5 lg:self-end"
          >
            <div className="flex items-center gap-2">
              <Icon name="shield" className="h-4 w-4 text-accent" />
              <h2 id="process-title" className="text-[14px] font-semibold text-ink">
                {en ? "How every post is made" : "세로AI의 발행 원칙"}
              </h2>
            </div>
            <ol className="mt-4 space-y-3.5">
              {PROCESS_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-[1px] inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-subtle text-[11px] font-semibold tabular-nums text-ink-2">
                    {i + 1}
                  </span>
                  <p className="text-[14px] leading-relaxed text-ink-3">
                    <span className="font-semibold text-ink">{step.title}</span> — {step.desc}
                  </p>
                </li>
              ))}
            </ol>
            <a
              href={lh("/about")}
              className="link-arrow mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink"
            >
              {en ? "About our process" : "운영 방식 자세히 보기"}
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </a>
          </aside>
        </div>
      </section>

      {/* ── 최신 ── */}
      <section aria-labelledby="latest-title" className="mx-auto max-w-page px-4 py-12 sm:px-6 sm:py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <h2 id="latest-title" className="text-[1.35rem] font-bold tracking-[-0.025em] text-ink">
            {en ? "Latest" : "최신 글"}
          </h2>
          {posts.length > 1 && (
            <a href={lh("/posts")} className="link-arrow inline-flex items-center gap-1 text-[14px] font-medium text-ink-2 hover:text-ink">
              {en ? "All posts" : "전체 글"} <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {featured ? (
          <>
            <PostCard post={featured} variant="feature" locale={locale} />
            {recent.length > 0 && (
              <div className="mt-12 grid gap-x-7 gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((post) => (
                  <PostCard key={post.slug} post={post} locale={locale} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-line-strong px-5 py-12 text-center sm:px-10 sm:py-16">
            <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Icon name="sparkle" className="h-5 w-5" />
            </span>
            <p className="mt-5 text-[1.25rem] font-bold tracking-[-0.02em] text-ink">{dict.home.noPosts}</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-3">
              {en
                ? "SERO AI is relaunching around four AI topics. The first post that passes our review panel is coming soon."
                : "세로AI는 AI 자동화·부업·뉴스·도구 네 가지 주제로 새롭게 시작합니다. 검수 패널을 통과한 첫 글이 곧 올라옵니다."}
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <a
                href="#newsletter"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[14px] font-semibold text-bg hover:opacity-90"
              >
                <Icon name="mail" className="h-4 w-4" />
                {en ? "Get notified" : "새 글 알림 받기"}
              </a>
              <a
                href={lh("/about")}
                className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-[14px] font-medium text-ink-2 hover:border-line-strong hover:text-ink"
              >
                {en ? "How we work" : "운영 방식 보기"}
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ── 주제별 ── */}
      <section aria-labelledby="topics-title" className="border-t border-line">
        <div className="mx-auto max-w-page px-4 py-12 sm:px-6 sm:py-14">
          <h2 id="topics-title" className="mb-8 text-[1.35rem] font-bold tracking-[-0.025em] text-ink">
            {en ? "By topic" : "주제별로 보기"}
          </h2>
          <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
            {siteConfig.categories.map((cat) => {
              const catPosts = posts.filter((p) => p.category === cat.slug);
              const top = catPosts.slice(0, 4);
              return (
                <section key={cat.slug} aria-labelledby={`cat-${cat.slug}`}>
                  <div className="flex items-center gap-3 border-b border-ink pb-3">
                    <CategoryBadge icon={cat.icon} size="sm" />
                    <h3 id={`cat-${cat.slug}`} className="flex-1 text-[16px] font-bold text-ink">
                      <a href={lh(`/categories/${cat.slug}`)} className="hover:text-accent">
                        {categoryName(cat, locale)}
                      </a>
                    </h3>
                    {catPosts.length > 0 && (
                      <a
                        href={lh(`/categories/${cat.slug}`)}
                        className="link-arrow inline-flex items-center gap-1 text-[13px] text-ink-3 hover:text-ink"
                        aria-label={`${categoryName(cat, locale)} ${en ? "all" : "전체 보기"}`}
                      >
                        {catPosts.length} <Icon name="arrowRight" className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="mt-3 text-[14px] text-ink-3">{categoryDescription(cat, locale)}</p>
                  {top.length > 0 ? (
                    <ul className="mt-1 divide-y divide-line">
                      {top.map((post) => (
                        <li key={post.slug}>
                          <PostCard post={post} variant="row" locale={locale} showCategory={false} as="h4" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 rounded-lg bg-subtle px-4 py-3.5 text-[13.5px] text-ink-3">
                      {en ? "First post in preparation." : "아직 발행된 글이 없습니다 — 첫 글을 준비 중입니다."}
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 쿠팡 (1슬롯) ── */}
      {siteConfig.coupang.enabled && (
        <div className="mx-auto max-w-page px-4 sm:px-6">
          <CoupangLinkAd
            keywords={["AI 활용 도서", "로지텍 MX Keys S 키보드", "LG 울트라와이드 모니터", "USB 콘덴서 마이크"]}
            title={dict.home.coupangTitle}
          />
        </div>
      )}

      {/* ── 뉴스레터 ── */}
      <section id="newsletter" aria-labelledby="newsletter-title" className="mx-auto max-w-page scroll-mt-24 px-4 pt-14 sm:px-6">
        <div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-10 md:grid-cols-2 md:items-center md:gap-10">
          <div>
            <p className="eyebrow">Newsletter</p>
            <h2 id="newsletter-title" className="mt-2 text-[1.45rem] font-bold tracking-[-0.025em] text-ink">
              {dict.home.newsletter}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{dict.home.newsletterDesc}</p>
          </div>
          <div>
            <NewsletterForm placeholder={dict.home.emailPlaceholder} buttonText={dict.home.subscribe} />
            <p className="mt-3 text-[12.5px] text-ink-3">{dict.home.noSpam}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
