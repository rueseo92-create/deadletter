"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import type { CategoryIcon } from "@/lib/config";

interface MobileNavProps {
  items: { href: string; label: string; icon?: CategoryIcon; description?: string }[];
  extraItems?: { href: string; label: string }[];
  searchHref: string;
  searchLabel?: string;
}

export function MobileNav({ items, extraItems = [], searchHref, searchLabel = "검색" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-subtle hover:text-ink md:hidden"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 animate-fade-in bg-bg md:hidden"
        >
          <nav
            aria-label="모바일 메뉴"
            className="mx-auto flex h-full max-w-page flex-col overflow-y-auto px-4 pb-8 pt-2"
          >
            <ul className="divide-y divide-line border-b border-line">
              {items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 py-4 text-ink"
                  >
                    {item.icon && (
                      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                        <Icon name={item.icon} className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold">{item.label}</span>
                      {item.description && (
                        <span className="mt-0.5 block text-[13px] text-ink-3">{item.description}</span>
                      )}
                    </span>
                    <Icon name="chevronRight" className="h-4 w-4 flex-shrink-0 text-ink-3" />
                  </a>
                </li>
              ))}
            </ul>
            {extraItems.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-ink-2">
                {extraItems.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} onClick={() => setOpen(false)} className="hover:text-ink">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a
              href={searchHref}
              onClick={() => setOpen(false)}
              className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-[14px] text-ink-3"
            >
              <Icon name="search" className="h-4 w-4" />
              {searchLabel}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
