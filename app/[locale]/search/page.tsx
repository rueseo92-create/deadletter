import { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { CategoryOverview } from "@/components/CategoryOverview";
import { Icon } from "@/components/Icon";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "검색",
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string; tag?: string };
}) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);

  const query = searchParams.q?.trim() || "";
  const tag = searchParams.tag?.trim() || "";
  // 보관 글은 검색에서도 제외 (getAllPosts 기본 동작)
  const allPosts = getAllPosts(locale as "ko" | "en");

  const tagCounts: Record<string, number> = {};
  allPosts.forEach((p) => p.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const popularTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);

  const hasSearch = query.length > 0 || tag.length > 0;
  const results = hasSearch
    ? allPosts.filter((post) => {
        const q = query.toLowerCase();
        const matchesQuery =
          !query ||
          post.title.toLowerCase().includes(q) ||
          post.description.toLowerCase().includes(q) ||
          post.tags.some((t) => t.toLowerCase().includes(q));
        const matchesTag = !tag || post.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
        return matchesQuery && matchesTag;
      })
    : [];

  return (
    <div className="mx-auto max-w-page px-4 pb-10 pt-10 sm:px-6 sm:pt-14">
      <header className="max-w-2xl">
        <h1 className="text-[1.9rem] font-bold tracking-[-0.03em] text-ink sm:text-[2.3rem]">{dict.search.title}</h1>
        <p className="mt-2 text-[15px] text-ink-3">{dict.search.description}</p>
      </header>

      <form action={lh("/search")} method="GET" role="search" className="mt-7 max-w-2xl">
        <label htmlFor="search-q" className="sr-only">
          {dict.search.title}
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={dict.search.placeholder}
              className="h-12 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-[15px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="submit"
            className="h-12 flex-shrink-0 rounded-lg bg-ink px-5 text-[15px] font-semibold text-bg hover:opacity-90"
          >
            {dict.search.button}
          </button>
        </div>
      </form>

      {popularTags.length > 0 && (
        <section aria-labelledby="popular-tags" className="mt-8 max-w-3xl">
          <h2 id="popular-tags" className="eyebrow mb-3">
            {dict.search.popularKeywords}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {popularTags.map((t) => (
              <li key={t}>
                <a
                  href={lh(`/search?tag=${encodeURIComponent(t)}`)}
                  className="chip"
                  aria-current={tag === t ? "page" : undefined}
                >
                  #{t}
                  <span className="text-[11px] opacity-60">{tagCounts[t]}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 border-t border-line pt-8">
        {hasSearch ? (
          <>
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-2">
              <p aria-live="polite">
                {query && (
                  <>
                    &ldquo;<strong className="text-ink">{query}</strong>&rdquo;
                  </>
                )}
                {query && tag && " + "}
                {tag && (
                  <>
                    {dict.search.tag}: <strong className="text-accent">#{tag}</strong>
                  </>
                )}
                <span className="ml-1.5">{dict.search.results.replace("{n}", String(results.length))}</span>
              </p>
              <a href={lh("/search")} className="text-[13px] text-ink-3 underline underline-offset-2 hover:text-ink">
                {dict.search.reset}
              </a>
            </div>
            {results.length > 0 ? (
              <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((post) => (
                  <PostCard key={post.slug} post={post} locale={locale} as="h2" />
                ))}
              </div>
            ) : (
              <EmptyBlock title={dict.search.noResults} desc={allPosts.length === 0 ? dict.home.noPostsDesc : dict.search.noResultsDesc} />
            )}
          </>
        ) : (
          <EmptyBlock
            title={allPosts.length === 0 ? dict.home.noPosts : dict.search.initialTitle}
            desc={
              allPosts.length === 0
                ? dict.home.noPostsDesc
                : dict.search.initialDesc.replace("{n}", String(allPosts.length))
            }
          />
        )}

        {allPosts.length === 0 && (
          <div className="mt-10">
            <CategoryOverview locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="py-10 text-center">
      <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-subtle text-ink-3">
        <Icon name="search" className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[16px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[14px] text-ink-3">{desc}</p>
    </div>
  );
}
