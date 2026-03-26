"use client";

import { useState, useEffect } from "react";
import { translate, detectLang } from "@/lib/translate";
import { useLanguage } from "@/components/LanguageProvider";

interface TranslatedTextProps {
  text: string;
  className?: string;
}

export default function TranslatedText({ text, className = "" }: TranslatedTextProps) {
  const { t, lang } = useLanguage();
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const sourceLang = detectLang(text);
  // 사용자 언어와 원문 언어가 같은 경우 → 변환 불필요
  const targetLang = (lang === "ja" ? "ja" : lang === "zh" ? "zh" : lang === "en" ? "en" : "ko") as "ko" | "en" | "ja" | "zh";
  const needsTranslation = sourceLang !== targetLang;

  useEffect(() => {
    if (!needsTranslation) {
      setTranslated(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    translate(text, sourceLang, targetLang).then((result) => {
      if (!cancelled) {
        setTranslated(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [text, sourceLang, targetLang, needsTranslation]);

  // 번역 불필요 → 원문 그대로
  if (!needsTranslation) {
    return (
      <div className={className}>
        &ldquo;{text}&rdquo;
      </div>
    );
  }

  // 번역 중
  if (loading && !translated) {
    return (
      <div>
        <div className={`${className} opacity-50`}>
          &ldquo;{text}&rdquo;
        </div>
        <span className="font-mono text-[9px] tracking-wider text-dim mt-2 inline-block">
          {t("translate.translating")}
        </span>
      </div>
    );
  }

  // 번역 완료
  return (
    <div>
      {/* 메인 텍스트: 번역된 텍스트 (또는 원문 토글 시 원문) */}
      <div className={className}>
        &ldquo;{showOriginal ? text : (translated || text)}&rdquo;
      </div>

      {/* 원문 보기 토글 */}
      {translated && translated !== text && (
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="font-mono text-[9px] tracking-wider text-dim hover:text-accent transition-colors mt-2 cursor-pointer"
        >
          {showOriginal ? t("translate.showTranslation") : t("translate.showOriginal")}
        </button>
      )}
    </div>
  );
}
