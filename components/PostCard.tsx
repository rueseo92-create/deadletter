import type { PostMeta } from "@/lib/posts";
import { getCategory } from "@/lib/config";
import { localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

interface PostCardProps {
  post: PostMeta;
  compact?: boolean;
  featured?: boolean;
  locale?: Locale;
}

const difficultyColor: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50",
  intermediate: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50",
  advanced: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50",
};

const diffLabels: Record<Locale, Record<string, string>> = {
  ko: { beginner: "입문", intermediate: "중급", advanced: "심화" },
  en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
};

export function PostCard({ post, compact, featured, locale = defaultLocale }: PostCardProps) {
  const category = getCategory(post.category);
  const lh = (path: string) => localizedHref(path, locale);
  const dl = diffLabels[locale] || diffLabels.ko;

  /* ── Featured: full-width horizontal ── */
  if (featured) {
    return (
      <a
        href={lh(`/posts/${post.slug}`)}
        className="group block overflow-hidden rounded-3xl bg-white ring-1 ring-stone-200/60 card-lift"
      >
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative md:w-[48%] aspect-[16/10] md:aspect-auto overflow-hidden bg-stone-50">
            {post.thumbnail ? (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full min-h-[280px] bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
                <span className="text-7xl opacity-20">{category?.emoji || "📝"}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {category && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-stone-700 shadow-sm ring-1 ring-black/[0.04]">
                <span>{category.emoji}</span>
                {category.name}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 p-7 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2.5 mb-4">
              <time className="text-xs text-stone-400 font-medium">{post.date}</time>
              {post.difficulty && (
                <>
                  <span className="w-1 h-1 bg-stone-200 rounded-full" />
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${difficultyColor[post.difficulty] || ""}`}>
                    {dl[post.difficulty] || post.difficulty}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-xl lg:text-2xl font-extrabold text-stone-800 group-hover:text-primary transition-colors duration-300 leading-snug font-headline mb-3 line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-stone-500 line-clamp-3 leading-relaxed mb-6">
              {post.description}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:gap-2.5 transition-all duration-300">
              자세히 읽기
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </span>
          </div>
        </div>
      </a>
    );
  }

  /* ── Compact: sidebar / list ── */
  if (compact) {
    return (
      <a
        href={lh(`/posts/${post.slug}`)}
        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-all duration-300"
      >
        {post.thumbnail ? (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-stone-50 ring-1 ring-black/[0.04]">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-gradient-to-br from-blue-50 to-amber-50 flex items-center justify-center ring-1 ring-black/[0.04]">
            <span className="text-lg opacity-40">{category?.emoji || "📝"}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-stone-700 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h3>
          <time className="mt-1.5 block text-xs text-stone-400">{post.date}</time>
        </div>
      </a>
    );
  }

  /* ── Standard: grid card ── */
  return (
    <a
      href={lh(`/posts/${post.slug}`)}
      className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/60 card-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-50">
        {post.thumbnail ? (
          <>
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
            <span className="text-5xl opacity-15">{category?.emoji || "📝"}</span>
          </div>
        )}
        {category && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-bold text-stone-700 shadow-sm ring-1 ring-black/[0.04]">
            <span>{category.emoji}</span>
            {category.name}
          </span>
        )}
      </div>

      <div className="p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3">
          {post.difficulty && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${difficultyColor[post.difficulty] || ""}`}>
              {dl[post.difficulty] || post.difficulty}
            </span>
          )}
          <time className="text-xs text-stone-400 ml-auto">{post.date}</time>
        </div>
        <h3 className="text-base lg:text-[17px] font-bold text-stone-800 group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-snug font-headline mb-2.5">
          {post.title}
        </h3>
        <p className="text-[13px] text-stone-500 line-clamp-2 leading-relaxed">
          {post.description}
        </p>
      </div>
    </a>
  );
}
