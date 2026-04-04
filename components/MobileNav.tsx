"use client";

import { useState, useEffect } from "react";

interface MobileNavProps {
  items: { href: string; label: string }[];
  searchHref: string;
}

export function MobileNav({ items, searchHref }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2.5 rounded-xl text-slate-500 hover:text-primary hover:bg-primary-50 transition-all duration-200 lg:hidden"
        aria-label="Open menu"
      >
        <span className="material-symbols-outlined text-[22px]">menu</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden animate-fade-in"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-white z-[70] shadow-2xl lg:hidden flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-600 text-white text-[9px] font-extrabold">
                  AI
                </span>
                <span className="text-sm font-bold text-slate-900 font-headline">브리핑</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
              {items.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary transition-all duration-200"
                  onClick={() => setOpen(false)}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
              <a
                href={searchHref}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-50 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary transition-all duration-200"
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">search</span>
                검색
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}
