"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/write", label: "write" },
    { href: "/letters", label: "letters" },
    { href: "/daily", label: "daily" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-between items-center px-6 md:px-10 py-6 z-50 bg-gradient-to-b from-bg via-bg/80 to-transparent">
      <Link
        href="/"
        className="font-mono text-sm tracking-[3px] lowercase text-accent hover:text-accent-bright transition-colors"
      >
        deadletter<span className="text-stamp-red">.</span>
      </Link>

      <ul className="flex gap-6 md:gap-8">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`font-mono text-[11px] tracking-[2px] uppercase transition-colors ${
                pathname === link.href
                  ? "text-accent"
                  : "text-dim hover:text-fg"
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
