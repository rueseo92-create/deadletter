import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AD_CONFIG } from "@/lib/ads";

export const metadata: Metadata = {
  title: "deadletter — unsent letters",
  description:
    "Write a letter that will never be delivered. A stranger will read it and reply.",
  openGraph: {
    title: "deadletter — unsent letters",
    description: "Write a letter that will never be delivered. A stranger will read it and reply.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {AD_CONFIG.enabled && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>
        <LanguageProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
