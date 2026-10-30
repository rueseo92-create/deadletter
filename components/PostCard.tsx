import type { PostMeta } from "@/lib/posts";
import { formatDate, isoDate } from "@/lib/posts";
import { getCategory, categoryName } from "@/lib/config";
import { localizedHref, defaultLocale, type Locale } from "@/lib/i18n";

type Variant = "card" | "feature" | "row";

interface PostCardProps {
  post: PostMeta;
  variant?: Variant;
  /** @deprecated variant="feature" 사용 */
  featured?: boolean;
  /** @deprecated variant="row" 사용 */
  compact?: boolean;
  locale?: Locale;
  showCategory?: boolean;
  /** 제목 태그 레벨 (섹션 구조에 맞춤) */
  as?: "h2" | "h3" | "h4";
}

function Meta({ post, locale, showCategory }: { post: PostMeta; locale: Locale; showCategory: boolean }) {
  const category = getCategory(post.category);
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-3">
      {showCategory && category && (
        <>
          <span className="font-semibold text-accent">{categoryName(category, locale)}</span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <time dateTime={isoDate(post.date)}>{formatDate(post.date)}</time>
    </p>
  );
}

export function PostCard({
  post,
  variant,
  featured,
  compact,
  locale = defaultLocale,
  showCategory = true,
  as: Heading = "h3",
}: PostCardProps) {
  const v: Variant = variant || (featured ? "feature" : compact ? "row" : "card");
  const href = localizedHref(`/posts/${post.slug}`, locale);

  if (v === "feature") {
    return (
      <a href={href} className="group grid gap-5 md:grid-cols-12 md:items-center md:gap-8">
        {post.thumbnail && (
          <div className="overflow-hidden rounded-xl border border-line bg-subtle md:col-span-7">
            <img
              src={post.thumbnail}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}
        <div className={post.thumbnail ? "md:col-span-5" : "md:col-span-12"}>
          <Meta post={post} locale={locale} showCategory={showCategory} />
          <Heading className="card-title mt-2.5 text-[1.55rem] font-bold leading-[1.32] tracking-[-0.025em] text-ink sm:text-[1.85rem]">
            {post.title}
          </Heading>
          {post.description && (
            <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink-2">{post.description}</p>
          )}
        </div>
      </a>
    );
  }

  if (v === "row") {
    return (
      <a href={href} className="group flex items-start gap-4 py-4">
        <div className="min-w-0 flex-1">
          <Heading className="card-title line-clamp-2 text-[15.5px] font-semibold leading-snug text-ink">
            {post.title}
          </Heading>
          <div className="mt-1.5">
            <Meta post={post} locale={locale} showCategory={showCategory} />
          </div>
        </div>
        {post.thumbnail && (
          <div className="hidden h-[60px] w-[90px] flex-shrink-0 overflow-hidden rounded-md border border-line bg-subtle sm:block">
            <img src={post.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
      </a>
    );
  }

  return (
    <a href={href} className="group block">
      {post.thumbnail && (
        <div className="mb-3.5 overflow-hidden rounded-lg border border-line bg-subtle">
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      )}
      <Meta post={post} locale={locale} showCategory={showCategory} />
      <Heading className="card-title mt-1.5 line-clamp-2 text-[17px] font-semibold leading-[1.45] tracking-[-0.015em] text-ink">
        {post.title}
      </Heading>
      {post.description && (
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-ink-3">{post.description}</p>
      )}
    </a>
  );
}
