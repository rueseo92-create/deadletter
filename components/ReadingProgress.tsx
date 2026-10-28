"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = document.querySelector("article");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      setProgress(Math.min(100, Math.max(0, (-rect.top / total) * 100)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (progress <= 0) return null;

  return (
    <div className="fixed left-0 top-0 z-[60] h-[2px] w-full" aria-hidden="true">
      <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
    </div>
  );
}
