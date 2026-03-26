"use client";

import { useLanguage } from "@/components/LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-card-border">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-dim/60 tracking-wider">
            deadletter<span className="text-stamp-red/60">.</span>
          </span>
          <span className="w-px h-3 bg-card-border hidden md:block" />
          <span className="font-mono text-[10px] text-dim/40 tracking-wider">
            {t("footer.copyright")}
          </span>
        </div>
        <span className="font-display text-[13px] italic text-dim/50">
          {t("footer.quote")}
        </span>
      </div>
    </footer>
  );
}
