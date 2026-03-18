"use client";

import { useState } from "react";
import { translate, detectLang } from "@/lib/translate";

interface TranslatedTextProps {
  text: string;
  className?: string;
}

export default function TranslatedText({ text, className = "" }: TranslatedTextProps) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const sourceLang = detectLang(text);
  const targetLang = sourceLang === "ko" ? "en" : "ko";
  const label = targetLang === "en" ? "EN" : "KO";

  async function handleToggle() {
    if (show) {
      setShow(false);
      return;
    }

    if (translated) {
      setShow(true);
      return;
    }

    setLoading(true);
    const result = await translate(text, sourceLang, targetLang);
    setTranslated(result);
    setShow(true);
    setLoading(false);
  }

  return (
    <div>
      {/* 번역 */}
      {show && translated && (
        <div className={`${className} mt-2 pt-2 border-t border-card-border/50 opacity-70`}>
          &ldquo;{translated}&rdquo;
        </div>
      )}

      {/* 토글 버튼 */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className="font-mono text-[9px] tracking-wider text-dim hover:text-accent transition-colors mt-2 cursor-pointer"
      >
        {loading ? "번역 중..." : show ? "원문만 보기" : `번역 보기 (${label})`}
      </button>
    </div>
  );
}
