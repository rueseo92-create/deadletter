"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * 본문(#article-body)의 h2/h3 로 목차를 만든다.
 * - variant="sidebar": xl 이상에서 오른쪽 sticky 목차
 * - variant="inline":  xl 미만에서 접히는 목차
 */
export function TableOfContents({
  variant = "sidebar",
  title = "목차",
}: {
  variant?: "sidebar" | "inline";
  title?: string;
}) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const article = document.getElementById("article-body");
    if (!article) return;

    const els = Array.from(article.querySelectorAll<HTMLElement>("h2, h3"));
    const items: TocItem[] = els.map((el, i) => {
      if (!el.id) el.id = `heading-${i}`;
      return { id: el.id, text: el.textContent || "", level: el.tagName === "H2" ? 2 : 3 };
    });
    setHeadings(items);

    if (variant !== "sidebar") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -65% 0px", threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [variant]);

  if (headings.length < 3) return null;

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  if (variant === "inline") {
    const h2s = headings.filter((h) => h.level === 2);
    return (
      <details className="group mb-10 rounded-lg border border-line bg-surface xl:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[14px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span>
            {title} <span className="ml-1 font-normal text-ink-3">{h2s.length}</span>
          </span>
          <Icon name="chevronDown" className="h-4 w-4 text-ink-3 transition-transform group-open:rotate-180" />
        </summary>
        <ol className="space-y-1 border-t border-line px-4 py-3 text-[14px]">
          {h2s.map((h, i) => (
            <li key={h.id} className="flex gap-2.5">
              <span className="w-5 flex-shrink-0 text-right tabular-nums text-ink-3">{i + 1}</span>
              <a href={`#${h.id}`} onClick={(e) => go(e, h.id)} className="text-ink-2 hover:text-ink">
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </details>
    );
  }

  return (
    <nav aria-label={title} className="text-[13px]">
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-0.5 border-l border-line">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => go(e, h.id)}
              aria-current={activeId === h.id ? "location" : undefined}
              className={`-ml-px block border-l py-1 leading-snug transition-colors ${
                h.level === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === h.id
                  ? "border-accent font-medium text-ink"
                  : "border-transparent text-ink-3 hover:text-ink-2"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
