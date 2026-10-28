import { siteConfig, categoryName, categoryDescription } from "@/lib/config";
import { localizedHref, type Locale } from "@/lib/i18n";
import { CategoryBadge, Icon } from "@/components/Icon";

/** 4개 주제 소개 카드 — 빈 상태, 소개 페이지 등에서 사용 */
export function CategoryOverview({
  locale,
  counts,
  exclude,
  columns = 4,
}: {
  locale: Locale;
  counts?: Record<string, number>;
  exclude?: string;
  columns?: 2 | 3 | 4;
}) {
  const cats = siteConfig.categories.filter((c) => c.slug !== exclude);
  const grid =
    columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <ul className={`grid gap-3 ${grid}`}>
      {cats.map((cat) => (
        <li key={cat.slug}>
          <a
            href={localizedHref(`/categories/${cat.slug}`, locale)}
            className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong sm:p-5"
          >
            <div className="flex items-center justify-between">
              <CategoryBadge icon={cat.icon} />
              <Icon
                name="arrowRight"
                className="h-4 w-4 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </div>
            <p className="card-title mt-4 text-[16px] font-semibold text-ink">{categoryName(cat, locale)}</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">{categoryDescription(cat, locale)}</p>
            {counts && (
              <p className="mt-auto pt-4 text-[12px] text-ink-3">
                {counts[cat.slug] ? `${counts[cat.slug]}개의 글` : "첫 글 준비 중"}
              </p>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
