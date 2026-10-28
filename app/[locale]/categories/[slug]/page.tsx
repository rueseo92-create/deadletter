import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostsByCategory } from "@/lib/posts";
import { siteConfig, getCategory, categoryName, categoryDescription } from "@/lib/config";
import { PostCard } from "@/components/PostCard";
import { CategoryOverview } from "@/components/CategoryOverview";
import { CategoryBadge, Icon } from "@/components/Icon";
import { getDictionary, localizedHref, locales, defaultLocale, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => siteConfig.categories.map((cat) => ({ locale, slug: cat.slug })));
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const category = getCategory(params.slug);
  if (!category) return {};
  const locale = (params.locale || defaultLocale) as Locale;
  return {
    title: categoryName(category, locale),
    description: `${categoryDescription(category, locale)} — ${siteConfig.name}`,
  };
}

export default async function CategoryPage({ params }: { params: { locale: string; slug: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const en = locale === "en";

  // 이전 주제(finance 등) 카테고리 URL은 404
  const category = getCategory(params.slug);
  if (!category) notFound();

  const posts = getPostsByCategory(params.slug, locale as "ko" | "en");
  const [lead, ...rest] = posts;

  return (
    <div data-category={params.slug}>
      <header className="border-b border-line">
        <div className="mx-auto max-w-page px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <nav aria-label={en ? "Breadcrumb" : "현재 위치"}>
            <ol className="flex items-center gap-1.5 text-[13px] text-ink-3">
              <li>
                <a href={lh("/")} className="hover:text-ink">
                  {en ? "Home" : "홈"}
                </a>
              </li>
              <li aria-hidden="true">
                <Icon name="chevronRight" className="h-3 w-3" />
              </li>
              <li aria-current="page">{categoryName(category, locale)}</li>
            </ol>
          </nav>
          <div className="mt-6 flex items-start gap-4">
            <CategoryBadge icon={category.icon} size="lg" />
            <div className="min-w-0">
              <h1 className="text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[2.3rem]">
                {categoryName(category, locale)}
              </h1>
              <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">{categoryDescription(category, locale)}</p>
              <p className="mt-2 text-[13px] text-ink-3">
                {posts.length > 0 ? dict.category.postsCount.replace("{n}", String(posts.length)) : en ? "No posts yet" : "첫 글 준비 중"}
              </p>
            </div>
          </div>

          <nav aria-label={en ? "Topics" : "주제"} className="-mx-4 mt-8 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <ul className="flex gap-2">
              <li>
                <a href={lh("/posts")} className="chip">
                  {dict.category.all}
                </a>
              </li>
              {siteConfig.categories.map((cat) => (
                <li key={cat.slug}>
                  <a
                    href={lh(`/categories/${cat.slug}`)}
                    className="chip"
                    aria-current={cat.slug === params.slug ? "page" : undefined}
                  >
                    {categoryName(cat, locale)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12">
        {lead ? (
          <>
            <PostCard post={lead} variant="feature" locale={locale} showCategory={false} as="h2" />
            {rest.length > 0 && (
              <div className="mt-12 grid gap-x-7 gap-y-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <PostCard key={post.slug} post={post} locale={locale} showCategory={false} as="h2" />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-dashed border-line-strong px-5 py-12 text-center sm:py-16">
              <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name={category.icon} className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-[1.2rem] font-bold tracking-[-0.02em] text-ink">
                {en ? "Our first post is on the way" : "첫 글을 준비 중입니다"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-3">
                {en
                  ? `The first ${category.nameEn} post that passes our review panel will appear here.`
                  : `${category.name} 주제의 첫 글이 검수 패널을 통과하면 이곳에 올라옵니다.`}
              </p>
              <a
                href={`${lh("/")}#newsletter`}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-[14px] font-semibold text-bg hover:opacity-90"
              >
                <Icon name="mail" className="h-4 w-4" />
                {en ? "Get notified" : "새 글 알림 받기"}
              </a>
            </div>
            <section aria-labelledby="other-topics" className="mt-14">
              <h2 id="other-topics" className="mb-5 text-[1.1rem] font-bold text-ink">
                {en ? "Other topics" : "다른 주제 둘러보기"}
              </h2>
              <CategoryOverview locale={locale} exclude={category.slug} columns={3} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
