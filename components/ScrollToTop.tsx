"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

export function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 800);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-5 right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface/95 text-ink-2 backdrop-blur transition-colors hover:border-line-strong hover:text-ink sm:right-6"
      aria-label="맨 위로"
    >
      <Icon name="arrowUp" className="h-4 w-4" />
    </button>
  );
}
