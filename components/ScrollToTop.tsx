"use client";

import { useEffect, useState } from "react";

export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 500);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-sm ring-1 ring-slate-200/60 shadow-card flex items-center justify-center text-slate-400 hover:text-primary hover:ring-primary/30 hover:shadow-card-hover transition-all duration-300"
      aria-label="Scroll to top"
    >
      <span className="material-symbols-outlined text-lg">keyboard_arrow_up</span>
    </button>
  );
}
