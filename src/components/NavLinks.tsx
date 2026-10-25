"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string; badge?: number; exact?: boolean };

export function NavLinks({ items, variant }: { items: NavItem[]; variant: "top" | "bottom" }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/"));

  if (variant === "top") {
    return (
      <ul className="flex items-center gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`relative rounded-md px-3 py-2 text-sm font-semibold ${isActive(item) ? "bg-primary-light text-primary" : "text-ink hover:text-primary"}`}
            >
              {item.label}
              {item.badge ? <span className="badge ml-1.5 bg-accent text-white">{item.badge}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive(item) ? "text-primary" : "text-muted"}`}>
            <span aria-hidden className="text-lg leading-none">{item.icon}</span>
            {item.label}
            {item.badge ? <span className="absolute right-1/4 top-1 h-2 w-2 rounded-full bg-accent" /> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
