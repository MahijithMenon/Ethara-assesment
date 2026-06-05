"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/customers", label: "Customers" },
  { href: "/orders", label: "Orders" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm text-white">
            IO
          </span>
          <span>Inventory & Orders</span>
        </Link>

        <nav className="hidden gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          aria-label="Toggle navigation"
          className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 sm:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>
      </div>

      {open ? (
        <nav className="border-t border-slate-100 bg-white sm:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
