import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/config";
import { PostCard } from "@/components/PostCard";
import { getDictionary, localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

export default async function PostsPage({ params }: { params: { locale: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const posts = getAllPosts(locale as "ko" | "en");

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6 lg:px-12">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">library_books</span>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-headline">{dict.category.allPosts}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{dict.category.postsCount.replace("{n}", String(posts.length))}</p>
          </div>
        </div>
      </header>

      {/* Category filter pills */}
      <section className="mb-10">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 no-scrollbar">
          <a
            href={lh("/posts")}
            className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-sm shadow-md shadow-primary/15 whitespace-nowrap transition-all"
          >
            {dict.category.all}
          </a>
          {siteConfig.categories.map((cat) => (
            <a
              key={cat.slug}
              href={lh(`/categories/${cat.slug}`)}
              className="px-5 py-2.5 rounded-full bg-white border border-slate-200/80 text-sm font-medium text-slate-500 hover:bg-primary hover:text-white hover:border-primary hover:shadow-md hover:shadow-primary/15 transition-all duration-200 whitespace-nowrap"
            >
              {cat.emoji} {cat.name}
            </a>
          ))}
        </div>
      </section>

      {/* Posts grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-primary text-3xl">article</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-headline">{dict.home.noPosts}</h2>
          <p className="text-sm text-slate-500">아직 작성된 글이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
