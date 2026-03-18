"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";

export default function Nav() {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();

  const links = [
    { href: "/write", label: t("nav.write") },
    { href: "/letters", label: t("nav.letters") },
    { href: "/daily", label: t("nav.daily") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 md:px-10 py-6 z-50 bg-gradient-to-b from-bg via-bg/80 to-transparent">
      <Link
        href="/"
        className="font-mono text-sm tracking-[3px] lowercase text-accent hover:text-accent-bright transition-colors"
      >
        deadletter<span className="text-stamp-red">.</span>
      </Link>

      <div className="flex items-center gap-6 md:gap-8">
        <ul className="flex gap-6 md:gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`font-mono text-[11px] tracking-[2px] uppercase transition-colors ${
                  pathname === link.href
                    ? "text-accent"
                    : "text-dim hover:text-fg"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 border-l border-dim/20 pl-4 ml-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`font-mono text-[10px] transition-colors ${
                lang === l.value
                  ? "text-accent-bright"
                  : "text-dim hover:text-fg"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
