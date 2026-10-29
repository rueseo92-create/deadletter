import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  getPost,
  getAllPosts,
  getAllSlugs,
  getRelatedPosts,
  formatDate,
  isoDate,
  estimateReadingTime,
} from "@/lib/posts";
import { siteConfig, getCategory, categoryName } from "@/lib/config";
import { breadcrumbSchema, articleSchema, faqSchema, ogImageUrl } from "@/lib/seo";
import { PostCard } from "@/components/PostCard";
import { SourceCard } from "@/components/SourceCard";
import { CoupangLinkAd } from "@/components/CoupangAd";
import { AdSense } from "@/components/AdSense";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TableOfContents } from "@/components/TableOfContents";
import { ShareButtons } from "@/components/ShareButtons";
import { ServiceCta } from "@/components/ServiceCta";
import { mdxComponents } from "@/components/MdxComponents";
import { Icon } from "@/components/Icon";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getDictionary, localizedHref, locales, defaultLocale, type Locale } from "@/lib/i18n";

export const dynamicParams = true;

export function generateStaticParams() {
  const slugs = getAllSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export function generateMetadata({ params }: { params: { locale: string; slug: string } }): Metadata {
  const locale = (params.locale || defaultLocale) as Locale;
  const post = getPost(params.slug);
  if (!post) return {};
  const { meta } = post;
  const lp = locale === defaultLocale ? "" : `/${locale}`;
  const url = `${siteConfig.url}${lp}/posts/${meta.slug}`;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url,
      type: "article",
      publishedTime: meta.date,
      authors: [siteConfig.author],
      tags: meta.tags,
      images: [{ url: meta.thumbnail || ogImageUrl(meta.title, meta.category), width: 1200, height: 630, alt: meta.title }],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
    // 이전 주제(보관) 글은 URL은 유지하되 검색 색인에서 제외
    ...(meta.archived
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
    alternates: {
      canonical: url,
      languages: {
        ko: `${siteConfig.url}/posts/${meta.slug}`,
        en: `${siteConfig.url}/en/posts/${meta.slug}`,
      },
    },
  };
}

export default async function PostPage({ params }: { params: { locale: string; slug: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const en = locale === "en";

  const post = getPost(params.slug);
  if (!post) notFound();

  const { meta, content } = post;
  const archived = meta.archived;
  const related = getRelatedPosts(params.slug);
  const category = getCategory(meta.category);
  const readingTime = estimateReadingTime(content);

  // 이전/다음 글 — 운영 중인 글끼리만
  const allPosts = archived ? [] : getAllPosts(locale as "ko" | "en");
  const currentIdx = allPosts.findIndex((p) => p.slug === params.slug);
  const prevPost = currentIdx >= 0 && currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? allPosts[currentIdx - 1] : null;

  const lp = locale === defaultLocale ? "" : `/${locale}`;
  const postUrl = `${siteConfig.url}${lp}/posts/${meta.slug}`;

  const articleJsonLd = articleSchema(meta);
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: dict.post.home, url: siteConfig.url },
    ...(category ? [{ name: category.name, url: `${siteConfig.url}/categories/${meta.category}` }] : []),
    { name: meta.title, url: `${siteConfig.url}/posts/${meta.slug}` },
  ]);

  const faqs: { question: string; answer: string }[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const qMatch = lines[i].match(/^###\s*Q\d*[:.]?\s*(.+)/);
    if (qMatch && i + 1 < lines.length) {
      const aMatch = lines[i + 1].match(/^A\d*[:.]?\s*(.+)/);
      if (aMatch) faqs.push({ question: qMatch[1].trim(), answer: aMatch[1].trim() });
    }
  }
  const faqJsonLd = faqs.length > 0 ? faqSchema(faqs) : null;

  const coupangKeywords = (() => {
    const tagMap = siteConfig.coupang.tagProductMap;
    const matched = meta.tags
      .map((tag) => {
        const key = Object.keys(tagMap).find((k) => tag.includes(k) || k.includes(tag));
        return key ? tagMap[key] : null;
      })
      .filter((v): v is string => v !== null);
    const catDefaults =
      siteConfig.coupang.productKeywords[meta.category] || siteConfig.coupang.productKeywords["ai-tools"];
    return Array.from(new Set([...matched, ...catDefaults])).slice(0, 4);
  })();

  const review = meta.review;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <ReadingProgress />

      <div className="mx-auto max-w-page px-4 pt-6 sm:px-6 sm:pt-10 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,42.5rem)_minmax(0,1fr)] xl:gap-12">
        <div aria-hidden="true" className="hidden xl:block" />

        <article className="mx-auto w-full min-w-0 max-w-[42.5rem]" data-category={meta.category}>
          {archived && (
            <div
              role="note"
              className="mb-8 flex items-start gap-3 rounded-lg border border-line bg-subtle px-4 py-3.5 text-[14px] leading-relaxed text-ink-2"
            >
              <Icon name="archive" className="mt-[3px] h-4 w-4 flex-shrink-0 text-ink-3" />
              <p>
                <strong className="font-semibold text-ink">이전 주제의 보관 글입니다.</strong>{" "}
                세로AI는 현재 업무 자동화·AI 마케팅·AI 뉴스·AI 도구를 다루며, 이 글의 정보는 최신이 아닐 수 있습니다.{" "}
                <a href={lh("/")} className="whitespace-nowrap font-medium text-accent underline underline-offset-2">
                  최신 AI 글 보기
                </a>
              </p>
            </div>
          )}

          {/* Breadcrumbs */}
          <nav aria-label={en ? "Breadcrumb" : "현재 위치"} className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3">
              <li>
                <a href={lh("/")} className="hover:text-ink">
                  {dict.post.home}
                </a>
              </li>
              <li aria-hidden="true">
                <Icon name="chevronRight" className="h-3 w-3" />
              </li>
              {category ? (
                <li>
                  <a href={lh(`/categories/${meta.category}`)} className="hover:text-ink">
                    {categoryName(category, locale)}
                  </a>
                </li>
              ) : (
                <li>{en ? "Archive" : "보관 글"}</li>
              )}
            </ol>
          </nav>

          {/* Header */}
          <header>
            {category && (
              <a
                href={lh(`/categories/${meta.category}`)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
              >
                <Icon name={category.icon} className="h-3.5 w-3.5" />
                {categoryName(category, locale)}
              </a>
            )}
            <h1 className="mt-3 text-[1.8rem] font-bold leading-[1.32] tracking-[-0.032em] text-ink sm:text-[2.35rem] sm:leading-[1.28]">
              {meta.title}
            </h1>
            {meta.description && (
              <p className="mt-4 text-[17px] leading-[1.7] text-ink-2">{meta.description}</p>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-3.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-ink-3">
                <span className="font-medium text-ink-2">{siteConfig.author}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={isoDate(meta.date)}>{formatDate(meta.date)}</time>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="clock" className="h-3.5 w-3.5" />
                  {readingTime}
                  {dict.post.readingTime}
                </span>
                {review && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span
                      className="inline-flex items-center gap-1 text-ink-2"
                      title={review.score !== undefined ? `품질 점수 ${review.score}점` : undefined}
                    >
                      <Icon name="shield" className="h-3.5 w-3.5 text-accent" />
                      슬롭 킬러 검수 {review.passed}/{review.panel} 통과
                    </span>
                  </>
                )}
              </div>
              <ShareButtons url={postUrl} title={meta.title} description={meta.description} />
            </div>
          </header>

          {meta.thumbnail && (
            <figure className="mt-8 overflow-hidden rounded-xl border border-line bg-subtle">
              <img
                src={meta.thumbnail}
                alt={`${meta.title} 대표 이미지`}
                className="aspect-[16/9] w-full object-cover"
              />
            </figure>
          )}

          {meta.tldr && (
            <section aria-label="핵심 요약" className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-accent">
                <Icon name="sparkle" className="h-3.5 w-3.5" />
                {en ? "TL;DR" : "핵심 요약"}
              </p>
              <p className="mt-2.5 text-[15.5px] leading-[1.75] text-ink">{meta.tldr}</p>
            </section>
          )}

          <div className="mt-8">
            <TableOfContents variant="inline" title={en ? "Contents" : "목차"} />
          </div>

          {/* Body */}
          <div id="article-body" className="prose mt-2">
            <MDXRemote
              source={content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [[remarkGfm, { singleTilde: false }]] } }}
            />
          </div>

          {/* 광고 1: 본문 끝 */}
          <AdSense slot="auto" format="auto" />

          {/* Sources */}
          {meta.sources && meta.sources.length > 0 && (
            <section aria-labelledby="sources-title" className="mt-12">
              <h2 id="sources-title" className="text-[1.1rem] font-bold text-ink">
                {dict.post.references}
              </h2>
              <p className="mt-1 text-[13px] text-ink-3">
                {en ? "This post is based on the following sources." : "이 글은 아래 자료를 바탕으로 작성되었습니다."}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {meta.sources.map((source, i) => (
                  <SourceCard key={i} source={source} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* 상담 안내 */}
          {!en && <ServiceCta category={meta.category} homeHref={lh("/")} />}

          {/* Tags */}
          {meta.tags.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label={en ? "Tags" : "태그"}>
              {meta.tags.map((tag) => (
                <li key={tag}>
                  <a
                    href={lh(`/search?tag=${encodeURIComponent(tag)}`)}
                    className="inline-block rounded-md bg-subtle px-2.5 py-1 text-[13px] text-ink-2 transition-colors hover:text-ink"
                  >
                    #{tag}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Disclaimer + corrections */}
          <p className="mt-10 border-t border-line pt-5 text-[12.5px] leading-relaxed text-ink-3">
            {siteConfig.disclaimer} 오류를 발견하셨다면{" "}
            <a href={`mailto:${siteConfig.email}`} className="underline underline-offset-2 hover:text-ink">
              {siteConfig.email}
            </a>
            로 알려 주세요. 확인 후 정정 내역과 함께 바로잡습니다.
          </p>

          {/* 광고 2: 쿠팡 */}
          {siteConfig.coupang.enabled && (
            <CoupangLinkAd keywords={coupangKeywords} title={dict.post.coupangReaderTitle} className="mt-8" />
          )}

          {/* Prev / Next */}
          {(prevPost || nextPost) && (
            <nav aria-label={en ? "Previous and next posts" : "이전/다음 글"} className="mt-12 grid gap-3 sm:grid-cols-2">
              {prevPost ? (
                <a
                  href={lh(`/posts/${prevPost.slug}`)}
                  className="group rounded-xl border border-line p-4 transition-colors hover:border-line-strong"
                >
                  <span className="flex items-center gap-1 text-[12px] text-ink-3">
                    <Icon name="arrowLeft" className="h-3.5 w-3.5" /> {en ? "Previous" : "이전 글"}
                  </span>
                  <span className="card-title mt-1.5 line-clamp-2 block text-[14.5px] font-semibold leading-snug text-ink">
                    {prevPost.title}
                  </span>
                </a>
              ) : (
                <span className="hidden sm:block" />
              )}
              {nextPost && (
                <a
                  href={lh(`/posts/${nextPost.slug}`)}
                  className="group rounded-xl border border-line p-4 text-right transition-colors hover:border-line-strong"
                >
                  <span className="flex items-center justify-end gap-1 text-[12px] text-ink-3">
                    {en ? "Next" : "다음 글"} <Icon name="arrowRight" className="h-3.5 w-3.5" />
                  </span>
                  <span className="card-title mt-1.5 line-clamp-2 block text-[14.5px] font-semibold leading-snug text-ink">
                    {nextPost.title}
                  </span>
                </a>
              )}
            </nav>
          )}
        </article>

        <aside className="hidden xl:block" aria-label={en ? "Table of contents" : "목차"}>
          <div className="sticky top-[calc(var(--header-h)+2.5rem)] max-h-[calc(100vh-8rem)] overflow-y-auto pt-[4.5rem]">
            <TableOfContents variant="sidebar" title={en ? "Contents" : "목차"} />
          </div>
        </aside>
      </div>

      {/* Related posts (보관 글 제외) */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-title"
          className="mx-auto mt-20 max-w-page border-t border-line px-4 pt-12 sm:px-6"
        >
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="related-title" className="text-[1.25rem] font-bold tracking-[-0.02em] text-ink">
              {archived ? (en ? "Latest from SERO AI" : "세로AI의 최신 AI 글") : dict.post.relatedPosts}
            </h2>
            <a href={lh("/posts")} className="link-arrow inline-flex items-center gap-1 text-[14px] text-ink-2 hover:text-ink">
              {dict.post.viewAll} <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
