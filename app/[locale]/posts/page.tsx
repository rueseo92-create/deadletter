import { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { siteConfig, categoryName } from "@/lib/config";
import { PostCard } from "@/components/PostCard";
import { CategoryOverview } from "@/components/CategoryOverview";
import { Icon } from "@/components/Icon";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "전체 글",
  description: `${siteConfig.name}의 업무 자동화 · AI 마케팅 · AI 뉴스 · AI 도구 인사이트 전체 목록`,
};

export default async function PostsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const en = locale === "en";
  const posts = getAllPosts(locale as "ko" | "en");

  return (
    <div>
      <header className="border-b border-line">
        <div className="mx-auto max-w-page px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <p className="eyebrow">{siteConfig.nameEn}</p>
          <h1 className="mt-3 text-[1.9rem] font-bold tracking-[-0.03em] text-ink sm:text-[2.3rem]">
            {dict.category.allPosts}
          </h1>
          <p className="mt-2 text-[14px] text-ink-3">
            {posts.length > 0
              ? dict.category.postsCount.replace("{n}", String(posts.length))
              : en
              ? "No posts yet"
              : "첫 글 준비 중"}
          </p>
          <nav aria-label={en ? "Topics" : "주제"} className="-mx-4 mt-7 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
            <ul className="flex gap-2">
              <li>
                <a href={lh("/posts")} className="chip" aria-current="page">
                  {dict.category.all}
                </a>
              </li>
              {siteConfig.categories.map((cat) => (
                <li key={cat.slug}>
                  <a href={lh(`/categories/${cat.slug}`)} className="chip">
                    {categoryName(cat, locale)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-12">
        {posts.length > 0 ? (
          <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} locale={locale} as="h2" />
            ))}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-dashed border-line-strong px-5 py-12 text-center sm:py-16">
              <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name="sparkle" className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-[1.2rem] font-bold tracking-[-0.02em] text-ink">{dict.home.noPosts}</h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-3">{dict.home.noPostsDesc}</p>
            </div>
            <div className="mt-12">
              <CategoryOverview locale={locale} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
