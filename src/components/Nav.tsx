"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";

export default function Nav() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 모바일 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const links = [
    { href: "/write", label: t("nav.write") },
    { href: "/letters", label: t("nav.letters") },
    { href: "/daily", label: t("nav.daily") },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-bg/95 backdrop-blur-md border-b border-card-border/50 py-4"
            : "bg-gradient-to-b from-bg via-bg/80 to-transparent py-6"
        }`}
      >
        <div className="max-w-[1100px] mx-auto flex justify-between items-center px-6 md:px-10">
          <Link
            href="/"
            className="font-mono text-sm tracking-[3px] lowercase text-accent hover:text-accent-bright transition-colors"
          >
            deadletter<span className="text-stamp-red">.</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex gap-8">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`font-mono text-[11px] tracking-[2px] uppercase transition-colors relative ${
                      pathname === link.href
                        ? "text-accent"
                        : "text-dim hover:text-fg"
                    }`}
                  >
                    {link.label}
                    {pathname === link.href && (
                      <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-accent/50" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 border-l border-dim/20 pl-6">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded transition-all ${
                    lang === l.value
                      ? "text-accent-bright bg-card-bg"
                      : "text-dim hover:text-fg"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-[5px] p-2 cursor-pointer"
            aria-label="Menu"
          >
            <span className={`w-5 h-px bg-accent transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
            <span className={`w-5 h-px bg-accent transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-px bg-accent transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] z-50 bg-bg border-l border-card-border transform transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="pt-20 px-8 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`font-mono text-[12px] tracking-[3px] uppercase py-4 border-b border-card-border transition-colors ${
                pathname === link.href
                  ? "text-accent"
                  : "text-dim hover:text-fg"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex gap-3 pt-8">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => {
                  setLang(l.value);
                  setMobileOpen(false);
                }}
                className={`font-mono text-[11px] px-3 py-1.5 border transition-all cursor-pointer ${
                  lang === l.value
                    ? "text-accent-bright border-accent/40 bg-card-bg"
                    : "text-dim border-card-border hover:text-fg"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
