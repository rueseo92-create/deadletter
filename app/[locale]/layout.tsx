import { Metadata } from "next";
import Script from "next/script";
import { siteConfig } from "@/lib/config";
import {
  getDictionary,
  localizedHref,
  htmlLangs,
  ogLocales,
  locales,
  localeNames,
  defaultLocale,
  type Locale,
  type Dictionary,
} from "@/lib/i18n";
import { ScrollToTop } from "@/components/ScrollToTop";
import { MobileNav } from "@/components/MobileNav";
import { HeaderWrapper } from "@/components/HeaderWrapper";

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
        zh: `${siteConfig.url}/zh`,
        ja: `${siteConfig.url}/ja`,
        es: `${siteConfig.url}/es`,
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

const navKeyMap: Record<string, string> = {
  "/": "home",
  "/categories/side-hustle": "sideHustle",
  "/categories/ai-tools": "aiTools",
  "/categories/ai-news": "aiNews",
  "/categories/marketing": "marketing",
  "/business": "agency",
  "/about": "about",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = (params.locale || defaultLocale) as Locale;
  const dict = await getDictionary(locale);

  const navItems = siteConfig.nav.map((item) => {
    const key = navKeyMap[item.href] || "home";
    return {
      href: localizedHref(item.href, locale),
      label: (dict.nav as Record<string, string>)[key] || item.label,
    };
  });

  return (
    <html lang={htmlLangs[locale]} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4F46E5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
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
      <body className="bg-background text-on-surface antialiased font-body">
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1902054355965964"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />

        {/* Header */}
        <HeaderWrapper>
          <div className="flex justify-between items-center h-16 px-6 lg:px-12 max-w-7xl mx-auto">
            <a
              href={localizedHref("/", locale)}
              className="flex items-center gap-2.5 group"
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-600 text-white text-xs font-extrabold shadow-sm group-hover:shadow-glow transition-shadow duration-300">
                AI
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-headline">
                브리핑
              </span>
            </a>

            <nav className="hidden lg:flex items-center">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="relative px-4 py-2 text-[13px] font-medium text-slate-500 hover:text-primary transition-colors duration-200 after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0.5 after:bg-primary after:rounded-full hover:after:w-5 after:transition-all after:duration-300"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <a
                href={localizedHref("/search", locale)}
                className="p-2.5 rounded-xl text-slate-500 hover:text-primary hover:bg-primary-50 transition-all duration-200"
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-[22px]">search</span>
              </a>
              <MobileNav
                items={navItems}
                searchHref={localizedHref("/search", locale)}
              />
            </div>
          </div>
        </HeaderWrapper>

        <main className="min-h-screen">{children}</main>

        <ScrollToTop />

        {/* Footer */}
        <footer className="relative mt-24 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            {/* Main footer content */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-16">
              {/* Brand */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 text-white text-[10px] font-extrabold">
                    AI
                  </span>
                  <span className="text-lg font-extrabold text-slate-900 font-headline">브리핑</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  {siteConfig.description}
                </p>
              </div>

              {/* Quick Links */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">카테고리</h4>
                <ul className="space-y-2.5">
                  {siteConfig.categories.map((cat) => (
                    <li key={cat.slug}>
                      <a
                        href={localizedHref(`/categories/${cat.slug}`, locale)}
                        className="text-sm text-slate-500 hover:text-primary transition-colors duration-200"
                      >
                        {cat.emoji} {cat.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">리소스</h4>
                <ul className="space-y-2.5">
                  <li>
                    <a href={localizedHref("/posts", locale)} className="text-sm text-slate-500 hover:text-primary transition-colors duration-200">
                      {dict.category?.allPosts || "전체 글"}
                    </a>
                  </li>
                  <li>
                    <a href={localizedHref("/about", locale)} className="text-sm text-slate-500 hover:text-primary transition-colors duration-200">
                      {dict.nav?.about || "소개"}
                    </a>
                  </li>
                  <li>
                    <a href={localizedHref("/business", locale)} className="text-sm text-slate-500 hover:text-primary transition-colors duration-200">
                      {dict.nav?.agency || "대행 서비스"}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">정보</h4>
                <ul className="space-y-2.5">
                  <li>
                    <a href={localizedHref("/privacy", locale)} className="text-sm text-slate-500 hover:text-primary transition-colors duration-200">
                      {dict.footer.privacyPolicy}
                    </a>
                  </li>
                  <li>
                    <a href="/sitemap.xml" className="text-sm text-slate-500 hover:text-primary transition-colors duration-200">
                      {dict.footer.sitemap}
                    </a>
                  </li>
                  <li>
                    <a href="/feed.xml" className="text-sm text-slate-500 hover:text-primary transition-colors duration-200">
                      {dict.footer.rss}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Newsletter mini */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">구독</h4>
                <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                  매주 AI 트렌드를 이메일로 받아보세요.
                </p>
                <a
                  href="#newsletter"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
                >
                  구독하기
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-100 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
              </p>
              <p className="text-[11px] text-slate-400 text-center sm:text-right max-w-xl leading-relaxed">
                {siteConfig.disclaimer}
                {siteConfig.coupang.enabled && (
                  <> &middot; {dict.coupang.disclaimer}</>
                )}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
