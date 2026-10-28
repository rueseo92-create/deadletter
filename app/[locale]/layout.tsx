import { Metadata } from "next";
import Script from "next/script";
import { siteConfig, categoryName, categoryDescription } from "@/lib/config";
import {
  getDictionary,
  localizedHref,
  htmlLangs,
  ogLocales,
  locales,
  defaultLocale,
  type Locale,
} from "@/lib/i18n";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MobileNav } from "@/components/MobileNav";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Wordmark } from "@/components/Wordmark";
import { Icon } from "@/components/Icon";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: dict.meta.defaultTitle,
      template: `%s | ${siteConfig.name}`,
    },
    description: dict.meta.siteDescription,
    openGraph: {
      type: "website",
      locale: ogLocales[locale],
      url: siteConfig.url,
      siteName: siteConfig.name,
      title: dict.meta.defaultTitle,
      description: dict.meta.siteDescription,
    },
    twitter: { card: "summary_large_image" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: `${siteConfig.url}${locale === defaultLocale ? "" : `/${locale}`}`,
      languages: {
        ko: siteConfig.url,
        en: `${siteConfig.url}/en`,
        "x-default": siteConfig.url,
      },
      types: {
        "application/rss+xml": `${siteConfig.url}/feed.xml`,
      },
    },
    verification: {
      google: "vlp5CU9LiT8K6iu4FQfca9Lkva_pUbd_xSkYeT60Hmc",
      other: {
        "naver-site-verification": "ccdc01cefc8b43cddda74be5174b84462ffe5e43",
      },
    },
  };
}

function JsonLd({ locale }: { locale: Locale }) {
  const lp = locale === defaultLocale ? "" : `/${locale}`;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description: siteConfig.description,
      inLanguage: htmlLangs[locale],
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteConfig.url}${lp}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/favicon.svg`,
      description: siteConfig.description,
      sameAs: [
        siteConfig.social.instagram ? `https://www.instagram.com/${siteConfig.social.instagram}` : null,
        siteConfig.social.twitter ? `https://twitter.com/${siteConfig.social.twitter}` : null,
      ].filter(Boolean),
    },
  ];
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);
  const lh = (path: string) => localizedHref(path, locale);
  const en = locale === "en";

  const navItems = siteConfig.categories.map((cat) => ({
    href: lh(`/categories/${cat.slug}`),
    label: categoryName(cat, locale),
    icon: cat.icon,
    description: categoryDescription(cat, locale),
  }));

  return (
    <html lang={htmlLangs[locale]} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FCFCFB" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0C0C0E" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <meta name="google-adsense-account" content="ca-pub-1902054355965964" />
        <JsonLd locale={locale} />
        {siteConfig.analytics.gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.analytics.gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${siteConfig.analytics.gaId}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1902054355965964"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        <a href="#main" className="skip-link">
          {en ? "Skip to content" : "본문으로 건너뛰기"}
        </a>

        <HeaderWrapper>
          <div className="mx-auto flex h-[var(--header-h)] max-w-page items-center justify-between gap-4 px-4 sm:px-6">
            <a href={lh("/")} className="-ml-1 rounded px-1 py-1" aria-label={`${siteConfig.name} ${en ? "home" : "홈"}`}>
              <Wordmark />
            </a>

            <nav aria-label={en ? "Categories" : "카테고리"} className="hidden md:block">
              <ul className="flex items-center gap-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="rounded-md px-3 py-2 text-[14px] font-medium text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex items-center gap-1">
              <a
                href={lh("/search")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
                aria-label={en ? "Search" : "검색"}
              >
                <Icon name="search" className="h-[18px] w-[18px]" />
              </a>
              <MobileNav
                items={navItems}
                extraItems={[
                  { href: lh("/posts"), label: en ? "All posts" : "전체 글" },
                  { href: lh("/about"), label: dict.nav?.about || "소개" },
                ]}
                searchHref={lh("/search")}
                searchLabel={en ? "Search" : "검색어를 입력하세요"}
              />
            </div>
          </div>
        </HeaderWrapper>

        <main id="main" className="min-h-[60vh]">
          {children}
        </main>

        <ScrollToTop />

        <footer className="mt-24 border-t border-line">
          <div className="mx-auto max-w-page px-4 py-12 sm:px-6">
            <div className="grid gap-10 md:grid-cols-12">
              <div className="md:col-span-5">
                <Wordmark />
                <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-ink-3">
                  {en ? dict.meta.siteDescription : siteConfig.tagline}
                </p>
              </div>
              <nav aria-label={en ? "Categories" : "카테고리"} className="md:col-span-3">
                <p className="eyebrow mb-3">{en ? "Topics" : "주제"}</p>
                <ul className="space-y-2 text-[14px]">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="text-ink-2 hover:text-ink">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <nav aria-label={en ? "Site" : "사이트"} className="md:col-span-4">
                <p className="eyebrow mb-3">{en ? "Site" : "사이트"}</p>
                <ul className="space-y-2 text-[14px]">
                  <li><a href={lh("/posts")} className="text-ink-2 hover:text-ink">{en ? "All posts" : "전체 글"}</a></li>
                  <li><a href={lh("/about")} className="text-ink-2 hover:text-ink">{dict.nav?.about || "소개"}</a></li>
                  <li><a href={lh("/privacy")} className="text-ink-2 hover:text-ink">{dict.footer.privacyPolicy}</a></li>
                  <li>
                    <a href="/feed.xml" className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
                      <Icon name="rss" className="h-3.5 w-3.5" /> {dict.footer.rss}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <div className="mt-12 space-y-2 border-t border-line pt-6 text-[12px] leading-relaxed text-ink-3">
              <p>{siteConfig.disclaimer}</p>
              {siteConfig.coupang.enabled && <p>{siteConfig.coupang.disclaimer}</p>}
              <p className="pt-2">
                &copy; {new Date().getFullYear()} {siteConfig.name} ({siteConfig.nameEn})
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
