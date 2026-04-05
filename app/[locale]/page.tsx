import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/config";
import { PostCard } from "@/components/PostCard";
import { CoupangLinkAd, CoupangSidebarAd } from "@/components/CoupangAd";
import NewsletterForm from "@/components/NewsletterForm";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

const catStyles: Record<string, { bg: string; iconBg: string; text: string }> = {
  finance:    { bg: "bg-blue-50", iconBg: "bg-blue-100", text: "text-blue-600" },
  insurance:  { bg: "bg-emerald-50", iconBg: "bg-emerald-100", text: "text-emerald-600" },
  health:     { bg: "bg-pink-50", iconBg: "bg-pink-100", text: "text-pink-600" },
  tech:       { bg: "bg-violet-50", iconBg: "bg-violet-100", text: "text-violet-600" },
  realestate: { bg: "bg-amber-50", iconBg: "bg-amber-100", text: "text-amber-600" },
  lifestyle:  { bg: "bg-orange-50", iconBg: "bg-orange-100", text: "text-orange-600" },
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
          HERO — Warm & Friendly
          ═══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Warm background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-amber-50/30 to-transparent" />
        {/* Soft blobs */}
        <div className="absolute top-[5%] left-[10%] w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-amber-200/20 rounded-full blur-[90px]" />
        <div className="absolute top-[30%] right-[25%] w-[250px] h-[250px] bg-pink-200/15 rounded-full blur-[80px]" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-blue-100 shadow-sm mb-8">
              <span className="text-lg">📚</span>
              <span className="text-[13px] font-semibold text-stone-600">매일 업데이트되는 생활 핵심 정보</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-[1.1] tracking-tight font-headline mb-6">
              복잡한 정보,{" "}
              <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-violet-500 bg-clip-text text-transparent">
                쉽고 재미있게
              </span>
            </h1>

            <p className="text-lg text-stone-500 leading-relaxed max-w-xl mx-auto mb-10">
              {dict.meta.siteDescription}
            </p>

            {/* Quick stats */}
            <div className="inline-flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/70 border border-stone-100 shadow-sm mb-10">
              {[
                { emoji: "📝", label: `${posts.length}+ 글` },
                { emoji: "📅", label: "매일 발행" },
                { emoji: "🏷️", label: `${siteConfig.categories.length}개 주제` },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-6">
                  {i > 0 && <div className="w-px h-5 bg-stone-200" />}
                  <div className="flex items-center gap-2">
                    <span className="text-base">{stat.emoji}</span>
                    <span className="text-sm font-semibold text-stone-600">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-center gap-4">
              <a
                href="#latest"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary text-white font-bold text-sm rounded-full shadow-soft hover:shadow-soft-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                둘러보기
                <span className="material-symbols-outlined text-base group-hover:translate-y-0.5 transition-transform duration-300">arrow_downward</span>
              </a>
              <a
                href={lh("/posts")}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-stone-700 font-semibold text-sm rounded-full border border-stone-200 hover:border-primary hover:text-primary hover:shadow-sm transition-all duration-200"
              >
                전체 글 보기
              </a>
            </div>
          </div>

          {/* Featured card (if exists) */}
          {featured && (
            <div className="mt-16 max-w-2xl mx-auto">
              <a
                href={lh(`/posts/${featured.slug}`)}
                className="group block rounded-3xl bg-white border border-stone-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    NEW
                  </span>
                  <span className="text-xs text-stone-400">{featured.date}</span>
                </div>
                <h2 className="text-lg font-bold text-stone-800 group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-2 font-headline">
                  {featured.title}
                </h2>
                <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
                  {featured.description}
                </p>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORY PILLS
          ═══════════════════════════════════════════ */}
      <section className="relative z-20 pb-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar snap-pills py-4">
            <a
              href={lh("/")}
              className="flex-shrink-0 px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm shadow-sm transition-all duration-200"
            >
              {dict.home.all}
            </a>
            {siteConfig.categories.map((cat) => (
              <a
                key={cat.slug}
                href={lh(`/categories/${cat.slug}`)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white border border-stone-200 text-sm font-medium text-stone-600 shadow-sm hover:bg-primary hover:text-white hover:border-primary hover:scale-[1.02] transition-all duration-200"
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
      <section id="newsletter" className="mb-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="rounded-3xl bg-gradient-to-r from-blue-500 via-blue-600 to-violet-500 p-7 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(255,255,255,0.12),transparent_60%)]" />
            <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💌</span>
                  <h3 className="text-xl font-extrabold text-white font-headline">{dict.home.newsletter}</h3>
                </div>
                <p className="text-sm text-white/60">{dict.home.newsletterDesc}</p>
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
      <section id="latest" className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-stone-900 font-headline">최신 인사이트</h2>
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
                  <div className="text-6xl mb-5">📝</div>
                  <h2 className="text-xl font-bold text-stone-900 mb-2 font-headline">{dict.home.noPosts}</h2>
                  <p className="text-stone-500 text-sm">{dict.home.noPostsDesc}</p>
                </div>
              )}

              {hasMore && (
                <div className="mt-16 text-center">
                  <a
                    href={lh("/posts")}
                    className="group inline-flex items-center gap-2.5 px-10 py-4 bg-white text-stone-700 font-bold text-sm rounded-full border border-stone-200 hover:border-primary hover:text-primary hover:shadow-soft transition-all duration-300"
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
              <div className="rounded-2xl bg-white border border-stone-100 p-5 shadow-card">
                <h4 className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-4">
                  <span>🔥</span> {dict.home.popularKeywords}
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
                        className="px-3 py-1.5 rounded-full bg-stone-50 border border-stone-100 text-xs font-medium text-stone-500 hover:border-primary hover:text-primary hover:bg-blue-50 transition-all duration-200"
                      >
                        #{tag}
                      </a>
                    ))}
                </div>
              </div>

              {siteConfig.coupang.enabled && (
                <CoupangSidebarAd keywords={["종합비타민 추천", "가성비 노트북", "로지텍 MX Master 3S", "에어팟 프로 2세대", "독서등 추천"]} />
              )}

              {/* About */}
              <div className="rounded-2xl bg-white border border-stone-100 p-5 shadow-card">
                <h4 className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-3">
                  <span>💡</span> {dict.home.aboutThisBlog}
                </h4>
                <ul className="space-y-2.5 text-xs text-stone-500 leading-relaxed">
                  {dict.home.aboutItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-primary text-sm mt-0.5 flex-shrink-0">✓</span>
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
      <section className="py-20 bg-gradient-to-b from-stone-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <span className="text-3xl mb-3 block">🗂️</span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-stone-900 font-headline">관심 있는 주제를 골라보세요</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {siteConfig.categories.map((cat) => {
              const catPosts = posts.filter((p) => p.category === cat.slug);
              const style = catStyles[cat.slug] || catStyles["finance"];
              return (
                <a
                  key={cat.slug}
                  href={lh(`/categories/${cat.slug}`)}
                  className={`group relative rounded-3xl overflow-hidden p-6 lg:p-7 ${style.bg} border border-white/60 card-lift`}
                >
                  <div className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center mb-4`}>
                    <span className="text-2xl emoji-pop">{cat.emoji}</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-bold text-stone-800 font-headline mb-1">{cat.name}</h3>
                  <p className={`text-xs ${style.text} font-medium`}>{catPosts.length}개의 글</p>
                  <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="material-symbols-outlined text-stone-400 text-sm">arrow_outward</span>
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
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: "📝", num: `${posts.length}+`, label: "발행된 글" },
              { emoji: "🏷️", num: `${siteConfig.categories.length}`, label: "콘텐츠 카테고리" },
              { emoji: "📅", num: "매일", label: "새 글 발행" },
              { emoji: "🎯", num: "100%", label: "SEO 최적화" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-5 rounded-2xl bg-white border border-stone-100 shadow-card">
                <span className="text-2xl mb-2 block">{stat.emoji}</span>
                <p className="text-2xl font-extrabold text-stone-900 font-headline">{stat.num}</p>
                <p className="text-xs text-stone-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BUSINESS CTA
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text */}
            <div>
              <span className="text-3xl mb-4 block">🤝</span>
              <h2 className="text-3xl lg:text-[2.5rem] font-extrabold text-stone-900 font-headline mb-5 leading-[1.15] tracking-tight">
                콘텐츠 제작,
                <br />대행해드려요
              </h2>
              <p className="text-stone-500 leading-relaxed max-w-md mb-8">
                고품질 콘텐츠 제작, SEO 최적화, 블로그 운영 대행 —
                전문가가 직접 관리해드립니다.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={lh("/business")}
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-full shadow-soft hover:shadow-soft-lg transition-all duration-300"
                >
                  서비스 살펴보기
                  <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </a>
                <a
                  href="mailto:contact@dailyinsight.kr"
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
                >
                  문의하기
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Service cards */}
            <div className="rounded-3xl bg-white border border-stone-100 p-7 lg:p-9 shadow-card">
              <div className="space-y-5">
                {[
                  { emoji: "✏️", title: "콘텐츠 제작 대행", desc: "SEO 최적화된 전문 콘텐츠 발행" },
                  { emoji: "🔍", title: "SEO 최적화", desc: "기술적 SEO 분석 및 전면 적용" },
                  { emoji: "🌐", title: "블로그/웹사이트 구축", desc: "기획부터 배포까지 원스톱" },
                  { emoji: "💰", title: "수익화 컨설팅", desc: "애드센스 · 제휴마케팅 최적 세팅" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div>
                      <h4 className="text-sm font-bold text-stone-800">{item.title}</h4>
                      <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{item.desc}</p>
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
