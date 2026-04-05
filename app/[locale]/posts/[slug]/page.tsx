import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPost, getAllPosts, getAllSlugs, getRelatedPosts } from "@/lib/posts";
import { siteConfig, getCategory } from "@/lib/config";
import { breadcrumbSchema, articleSchema, faqSchema, ogImageUrl } from "@/lib/seo";
import { PostCard } from "@/components/PostCard";
import { SourceCard } from "@/components/SourceCard";
import { CoupangLinkAd } from "@/components/CoupangAd";
import { AdSense } from "@/components/AdSense";
import { ReadingProgress } from "@/components/ReadingProgress";
import { TableOfContents } from "@/components/TableOfContents";
import { ShareButtons } from "@/components/ShareButtons";
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
    alternates: {
      canonical: url,
      languages: {
        ko: `${siteConfig.url}/posts/${meta.slug}`,
        en: `${siteConfig.url}/en/posts/${meta.slug}`,
        zh: `${siteConfig.url}/zh/posts/${meta.slug}`,
        ja: `${siteConfig.url}/ja/posts/${meta.slug}`,
        es: `${siteConfig.url}/es/posts/${meta.slug}`,
      },
    },
  };
}

function estimateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((koreanChars / 500 + words / 200) / 2));
}

export default async function PostPage({ params }: { params: { locale: string; slug: string } }) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);

  const post = getPost(params.slug);
  if (!post) notFound();

  const { meta, content } = post;
  const related = getRelatedPosts(params.slug);
  const category = getCategory(meta.category);
  const readingTime = estimateReadingTime(content);

  const allPosts = getAllPosts(locale as "ko" | "en");
  const currentIdx = allPosts.findIndex((p) => p.slug === params.slug);
  const prevPost = currentIdx < allPosts.length - 1 ? allPosts[currentIdx + 1] : null;
  const nextPost = currentIdx > 0 ? allPosts[currentIdx - 1] : null;

  const lp = locale === defaultLocale ? "" : `/${locale}`;
  const postUrl = `${siteConfig.url}${lp}/posts/${meta.slug}`;

  const diffConfig: Record<string, { label: string; color: string }> = {
    beginner: { label: dict.post.beginner, color: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50" },
    intermediate: { label: dict.post.intermediate, color: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50" },
    advanced: { label: dict.post.advanced, color: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50" },
  };
  const diff = meta.difficulty ? diffConfig[meta.difficulty] : null;

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <ReadingProgress />
      <TableOfContents />

      <article className="pt-28 pb-24" data-category={meta.category}>
        {/* Breadcrumbs */}
        <nav className="max-w-4xl mx-auto px-6 mb-8">
          <ol className="flex items-center gap-1.5 text-sm text-stone-400">
            <li>
              <a href={lh("/")} className="hover:text-primary transition-colors p-1">
                <span className="material-symbols-outlined text-base">home</span>
              </a>
            </li>
            <li><span className="material-symbols-outlined text-[10px] text-stone-300">chevron_right</span></li>
            {category && (
              <>
                <li>
                  <a href={lh(`/categories/${meta.category}`)} className="hover:text-primary transition-colors">
                    {category.emoji} {category.name}
                  </a>
                </li>
                <li><span className="material-symbols-outlined text-[10px] text-stone-300">chevron_right</span></li>
              </>
            )}
            <li className="text-stone-600 font-medium truncate max-w-[200px]">{meta.title}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="max-w-4xl mx-auto px-6 mb-12">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {category && (
              <a
                href={lh(`/categories/${meta.category}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary text-xs font-bold hover:bg-primary-100 transition-colors"
              >
                <span>{category.emoji}</span>{category.name}
              </a>
            )}
            {diff && <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${diff.color}`}>{diff.label}</span>}
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-[2.75rem] font-extrabold text-stone-900 leading-[1.15] tracking-[-0.02em] mb-6 font-headline">
            {meta.title}
          </h1>

          {/* Description */}
          <p className="text-lg text-stone-500 leading-relaxed mb-8 max-w-2xl">
            {meta.description}
          </p>

          {/* TL;DR */}
          {meta.tldr && (
            <div className="flex items-start gap-3.5 rounded-2xl bg-primary-50/60 p-6 border border-primary-100/50 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-base">bolt</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-primary mb-1.5 uppercase tracking-[0.15em]">TL;DR</p>
                <p className="text-sm text-stone-700 leading-relaxed">{meta.tldr}</p>
              </div>
            </div>
          )}

          {/* Meta + Share */}
          <div className="flex items-center justify-between py-5 border-y border-stone-100">
            <div className="flex items-center gap-4 text-sm text-stone-400">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                <time>{meta.date}</time>
              </div>
              <span className="w-1 h-1 bg-stone-200 rounded-full" />
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                <span>{readingTime}{dict.post.readingTime}</span>
              </div>
              <span className="w-1 h-1 bg-stone-200 rounded-full hidden sm:block" />
              <span className="font-medium text-stone-500 hidden sm:inline">{siteConfig.author}</span>
            </div>
            <ShareButtons url={postUrl} title={meta.title} description={meta.description} />
          </div>
        </header>

        {/* Hero image */}
        {meta.thumbnail && (
          <div className="max-w-5xl mx-auto px-6 mb-14">
            <div className="rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/[0.04]">
              <img src={meta.thumbnail} alt={meta.title} className="w-full object-cover max-h-[500px]" />
            </div>
          </div>
        )}

        {/* Article body */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose max-w-none">
            <MDXRemote source={content} options={{ mdxOptions: { remarkPlugins: [[remarkGfm, { singleTilde: false }]] } }} />
          </div>
        </div>

        {/* AdSense */}
        <div className="max-w-4xl mx-auto px-6 mt-14">
          <AdSense slot="auto" format="auto" />
        </div>

        {/* Coupang */}
        {siteConfig.coupang.enabled && (
          <div className="max-w-4xl mx-auto px-6 mt-12">
            <CoupangLinkAd
              keywords={(() => {
                const tagMap = siteConfig.coupang.tagProductMap;
                const matched = meta.tags.map((tag) => { const key = Object.keys(tagMap).find((k) => tag.includes(k) || k.includes(tag)); return key ? tagMap[key] : null; }).filter((v): v is string => v !== null);
                const catDefaults = siteConfig.coupang.productKeywords[meta.category] || siteConfig.coupang.productKeywords["finance"];
                return Array.from(new Set([...matched, ...catDefaults])).slice(0, 4);
              })()}
              title={dict.post.coupangReaderTitle}
            />
          </div>
        )}

        {/* Sources */}
        {meta.sources && meta.sources.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 mt-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-base">link</span>
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 font-headline">{dict.post.references}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {meta.sources.map((source, i) => <SourceCard key={i} source={source} />)}
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <div className="max-w-4xl mx-auto px-6 mt-12">
          <div className="flex items-start gap-3.5 rounded-2xl bg-stone-50 p-5 ring-1 ring-stone-100">
            <span className="material-symbols-outlined text-stone-400 text-lg mt-0.5">info</span>
            <div className="text-xs text-stone-400 leading-relaxed space-y-1">
              <p>{siteConfig.disclaimer}</p>
              {siteConfig.coupang.enabled && <p>{dict.coupang.disclaimer}</p>}
            </div>
          </div>
        </div>

        {/* Tags */}
        {meta.tags.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 mt-10">
            <div className="flex flex-wrap gap-2">
              {meta.tags.map((tag) => (
                <a
                  key={tag}
                  href={lh(`/search?tag=${encodeURIComponent(tag)}`)}
                  className="px-4 py-2 rounded-full bg-stone-50 ring-1 ring-stone-100 text-sm text-stone-500 hover:ring-primary hover:text-primary hover:bg-primary-50 transition-all duration-200"
                >
                  #{tag}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Coupang bottom */}
        {siteConfig.coupang.enabled && (
          <div className="max-w-4xl mx-auto px-6 mt-10">
            <CoupangLinkAd keywords={["삼성 갤럭시북4 프로", "맥북 에어 M3", "로지텍 MX Master 3S", "LG 울트라와이드 모니터"]} title={dict.post.coupangDevTitle} />
          </div>
        )}

        {/* Prev / Next */}
        {(prevPost || nextPost) && (
          <nav className="max-w-4xl mx-auto px-6 mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPost ? (
                <a
                  href={lh(`/posts/${prevPost.slug}`)}
                  className="group flex items-start gap-3 p-5 rounded-2xl border border-stone-100 hover:border-primary/20 hover:bg-primary-50/30 transition-all duration-300"
                >
                  <span className="material-symbols-outlined text-stone-300 group-hover:text-primary mt-0.5 transition-colors">arrow_back</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-stone-400 mb-1.5 uppercase tracking-wider font-semibold">Previous</p>
                    <p className="text-sm font-bold text-stone-700 truncate group-hover:text-primary transition-colors">{prevPost.title}</p>
                  </div>
                </a>
              ) : <div />}
              {nextPost ? (
                <a
                  href={lh(`/posts/${nextPost.slug}`)}
                  className="group flex items-start gap-3 p-5 rounded-2xl border border-stone-100 hover:border-primary/20 hover:bg-primary-50/30 transition-all duration-300 text-right sm:justify-end"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] text-stone-400 mb-1.5 uppercase tracking-wider font-semibold">Next</p>
                    <p className="text-sm font-bold text-stone-700 truncate group-hover:text-primary transition-colors">{nextPost.title}</p>
                  </div>
                  <span className="material-symbols-outlined text-stone-300 group-hover:text-primary mt-0.5 transition-colors">arrow_forward</span>
                </a>
              ) : <div />}
            </div>
          </nav>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 mt-24 pt-14 border-t border-stone-100">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-extrabold text-stone-900 font-headline">{dict.post.relatedPosts}</h2>
              <a href={lh("/posts")} className="group text-sm text-primary font-bold hover:underline flex items-center gap-1">
                {dict.post.viewAll}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => <PostCard key={p.slug} post={p} locale={locale} />)}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
