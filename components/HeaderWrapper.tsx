"use client";

import { useEffect, useState } from "react";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header sticky top-0 z-50 w-full border-b transition-colors duration-200 ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      {children}
    </header>
  );
}
