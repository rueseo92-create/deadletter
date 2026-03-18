"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-card-border max-w-[900px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row justify-between items-center gap-3">
      <span className="font-mono text-[10px] text-dim tracking-wider">
        {t("footer.copyright")}
      </span>
      <span className="font-display text-[13px] italic text-dim">
        {t("footer.quote")}
      </span>
    </footer>
  );
}
