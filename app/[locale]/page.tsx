import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/config";
import { PostCard } from "@/components/PostCard";
import { CoupangLinkAd, CoupangSidebarAd } from "@/components/CoupangAd";
import NewsletterForm from "@/components/NewsletterForm";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

const catColors: Record<string, { bg: string; gradient: string; icon: string }> = {
  "ai-news":      { bg: "from-indigo-500 to-indigo-600", gradient: "from-indigo-500/10 to-indigo-500/5", icon: "neurology" },
  "side-hustle":  { bg: "from-emerald-500 to-emerald-600", gradient: "from-emerald-500/10 to-emerald-500/5", icon: "trending_up" },
  "ai-tools":     { bg: "from-cyan-500 to-cyan-600", gradient: "from-cyan-500/10 to-cyan-500/5", icon: "construction" },
  marketing:      { bg: "from-amber-500 to-amber-600", gradient: "from-amber-500/10 to-amber-500/5", icon: "campaign" },
};

export default async function Home({ params }: { params: { locale: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);

  const posts = getAllPosts(locale as "ko" | "en");
  const featured = posts[0];
  const leadStory = posts[1];
  const gridPosts = posts.slice(2, 8);
  const hasMore = posts.length > 8;

  return (
    <div>
      {/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[94vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a20] via-[#120f30] to-[#0a0e1f]" />
        {/* Ambient orbs */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-indigo-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-violet-500/[0.05] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-cyan-500/[0.04] rounded-full blur-[80px]" />
        {/* Grain */}
        <div className="grain absolute inset-0" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-0">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-20 items-center">
            {/* Left: Brand message */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-px bg-gradient-to-r from-indigo-400/60 to-transparent" />
                <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-indigo-400/70">AI Briefing</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold text-white leading-[0.92] tracking-[-0.02em] font-headline mb-8">
                AI의 오늘을
                <br />
                <span className="bg-gradient-to-r from-white via-indigo-200 to-indigo-300 bg-clip-text text-transparent animate-gradient">
                  한눈에.
                </span>
              </h1>

              <p className="text-lg text-white/40 leading-relaxed max-w-md mb-12">
                {dict.meta.siteDescription}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-10 lg:gap-12 mb-14">
                {[
                  { num: `${posts.length}+`, label: "Articles" },
                  { num: "Daily", label: "Updates" },
                  { num: `${siteConfig.categories.length}`, label: "Topics" },
                ].map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-10 lg:gap-12">
                    {i > 0 && <div className="w-px h-8 bg-white/[0.06] -ml-10 lg:-ml-12" />}
                    <div>
                      <p className="text-2xl font-extrabold text-white font-headline tracking-tight">{stat.num}</p>
                      <p className="text-[10px] text-white/25 mt-1 tracking-[0.15em] uppercase">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a
                href="#latest"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-[#0c0a20] font-bold text-sm rounded-full hover:shadow-glow-lg transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                브리핑 시작하기
                <span className="material-symbols-outlined text-base group-hover:translate-y-0.5 transition-transform duration-300">arrow_downward</span>
              </a>
            </div>

            {/* Right: Featured card */}
            {featured && (
              <div className="lg:col-span-2">
                <a
                  href={lh(`/posts/${featured.slug}`)}
                  className="group block rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] p-7 lg:p-8 hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-500 shadow-[0_8px_48px_rgba(0,0,0,0.3)]"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/15 text-indigo-300 text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                    {dict.home.latest}
                  </div>
                  <h2 className="text-xl lg:text-[1.375rem] font-bold text-white/90 leading-snug font-headline group-hover:text-white transition-colors duration-300 mb-4 line-clamp-3">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-white/30 leading-relaxed line-clamp-2 mb-6">
                    {featured.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-white/25">
                    <span>{featured.date}</span>
                    <span className="w-1 h-1 bg-white/15 rounded-full" />
                    <span className="text-indigo-300/50">{featured.category}</span>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/[0.04] flex items-center gap-2 text-xs font-semibold text-indigo-300/50 group-hover:text-indigo-300 transition-colors">
                    읽어보기
                    <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
          <span className="text-[10px] text-white/15 tracking-[0.2em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/15 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORY PILLS
          ═══════════════════════════════════════════ */}
      <section className="relative z-20 -mt-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar snap-pills py-4">
            <a
              href={lh("/")}
              className="flex-shrink-0 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm shadow-md shadow-primary/15 transition-all duration-200"
            >
              {dict.home.all}
            </a>
            {siteConfig.categories.map((cat) => (
              <a
                key={cat.slug}
                href={lh(`/categories/${cat.slug}`)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-slate-200/80 text-sm font-medium text-slate-600 shadow-sm hover:bg-primary hover:text-white hover:border-primary hover:shadow-lg hover:shadow-primary/15 hover:scale-[1.02] transition-all duration-200"
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          NEWSLETTER CTA
          ═══════════════════════════════════════════ */}
      <section id="newsletter" className="mt-14 mb-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-7 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="absolute inset-0 grain" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-extrabold text-white font-headline mb-2">{dict.home.newsletter}</h3>
                <p className="text-sm text-white/50">{dict.home.newsletterDesc}</p>
              </div>
              <NewsletterForm
                placeholder={dict.home.emailPlaceholder}
                buttonText={dict.home.subscribe}
              />
            </div>
          </div>
        </div>
      </section>

      {siteConfig.coupang.enabled && (
        <div className="max-w-7xl mx-auto px-6 lg:px-12 my-6">
          <CoupangLinkAd
            keywords={["삼성 갤럭시북4 프로 노트북", "로지텍 MX Keys S 키보드", "LG 울트라와이드 모니터", "에어팟 프로 2세대"]}
            title={dict.home.coupangTitle}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          EDITORIAL CONTENT GRID
          ═══════════════════════════════════════════ */}
      <section id="latest" className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section header */}
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-primary/70 mb-2">Latest Articles</p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-headline">최신 브리핑</h2>
            </div>
            <a href={lh("/posts")} className="group text-sm font-semibold text-primary hover:text-primary-700 transition-colors flex items-center gap-1">
              {dict.home.viewAllPosts}
              <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </a>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {leadStory && (
                <div className="mb-10">
                  <PostCard post={leadStory} featured locale={locale} />
                </div>
              )}

              {gridPosts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridPosts.map((post) => (
                    <PostCard key={post.slug} post={post} locale={locale} />
                  ))}
                </div>
              )}

              {posts.length === 0 && (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
                    <span className="material-symbols-outlined text-primary text-3xl">article</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2 font-headline">{dict.home.noPosts}</h2>
                  <p className="text-slate-500 text-sm">{dict.home.noPostsDesc}</p>
                </div>
              )}

              {hasMore && (
                <div className="mt-16 text-center">
                  <a
                    href={lh("/posts")}
                    className="group inline-flex items-center gap-2.5 px-10 py-4 bg-white text-slate-800 font-bold text-sm rounded-full border border-slate-200 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                  >
                    {dict.home.viewAllPosts}
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </a>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-[300px] flex-shrink-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Tags */}
              <div className="rounded-2xl bg-white ring-1 ring-slate-200/60 p-5">
                <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-4">
                  {dict.home.popularKeywords}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {posts
                    .flatMap((p) => p.tags)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .slice(0, 12)
                    .map((tag) => (
                      <a
                        key={tag}
                        href={lh(`/search?tag=${encodeURIComponent(tag)}`)}
                        className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-medium text-slate-500 hover:border-primary hover:text-primary hover:bg-primary-50 transition-all duration-200"
                      >
                        #{tag}
                      </a>
                    ))}
                </div>
              </div>

              {siteConfig.coupang.enabled && (
                <CoupangSidebarAd keywords={["챗GPT 활용법 도서", "삼성 갤럭시북4 프로 노트북", "로지텍 MX Master 3S", "LG 울트라와이드 모니터 34인치", "에어팟 프로 2세대"]} />
              )}

              {/* About */}
              <div className="rounded-2xl bg-white ring-1 ring-slate-200/60 p-5">
                <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-400 mb-3">
                  {dict.home.aboutThisBlog}
                </h4>
                <ul className="space-y-2.5 text-xs text-slate-500 leading-relaxed">
                  {dict.home.aboutItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-primary text-sm mt-0.5 flex-shrink-0">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORY SHOWCASE
          ═══════════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-primary/70 mb-2">Explore Topics</p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-headline">관심 있는 주제를 골라보세요</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {siteConfig.categories.map((cat) => {
              const catPosts = posts.filter((p) => p.category === cat.slug);
              const colors = catColors[cat.slug] || catColors["ai-news"];
              return (
                <a
                  key={cat.slug}
                  href={lh(`/categories/${cat.slug}`)}
                  className="group relative rounded-3xl overflow-hidden h-48 lg:h-56 card-lift"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6">
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 origin-bottom-left">{cat.emoji}</span>
                    <h3 className="text-lg font-extrabold text-white font-headline">{cat.name}</h3>
                    <p className="text-[11px] text-white/50 mt-1 tracking-wide">{catPosts.length}개의 글</p>
                  </div>
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <span className="material-symbols-outlined text-white text-sm">arrow_outward</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST BAR
          ═══════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20">
            {[
              { num: `${posts.length}+`, label: "발행된 글", icon: "article" },
              { num: `${siteConfig.categories.length}`, label: "콘텐츠 카테고리", icon: "category" },
              { num: "24/7", label: "자동 발행", icon: "schedule" },
              { num: "100%", label: "SEO 최적화", icon: "trending_up" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-12 lg:gap-20">
                {i > 0 && <div className="w-px h-12 bg-slate-100 -ml-12 lg:-ml-20 hidden sm:block" />}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-primary text-xl">{stat.icon}</span>
                  </div>
                  <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 font-headline tracking-tight">{stat.num}</p>
                  <p className="text-xs text-slate-400 mt-1.5 tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BUSINESS CTA
          ═══════════════════════════════════════════ */}
      <section className="py-24 lg:py-28 bg-gradient-to-b from-white to-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Text */}
            <div>
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-primary/70 mb-4">For Business</p>
              <h2 className="text-3xl lg:text-[2.75rem] font-extrabold text-slate-900 font-headline mb-6 leading-[1.1] tracking-tight">
                직접 하기
                <br />어려우시다면
              </h2>
              <p className="text-slate-500 leading-relaxed max-w-md mb-10">
                AI 블로그 구축, SEO 최적화, 콘텐츠 자동화 — 이 블로그에서 방법을 다 알려드리지만,
                바쁘시면 저희가 대신 해드립니다.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={lh("/business")}
                  className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-bold text-sm rounded-full hover:bg-primary-600 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25"
                >
                  서비스 살펴보기
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </a>
                <a
                  href="mailto:contact@seroai.xyz"
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
                >
                  또는 바로 문의하기
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Service cards */}
            <div className="rounded-3xl bg-white ring-1 ring-slate-200/60 p-8 lg:p-10 shadow-card">
              <div className="space-y-6">
                {[
                  { icon: "edit_note", title: "AI 블로그 자동화", desc: "매일 SEO 최적화된 글 자동 발행" },
                  { icon: "travel_explore", title: "SEO 최적화", desc: "기술적 SEO 분석 및 전면 적용" },
                  { icon: "web", title: "웹사이트 구축", desc: "기획부터 배포까지 원스톱" },
                  { icon: "smart_toy", title: "AI 파이프라인", desc: "크롤링 → 생성 → 발행 전체 자동화" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
