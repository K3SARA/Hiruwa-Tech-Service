"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanBarcode, ShoppingCart, Wrench } from "lucide-react";
import { clsx } from "clsx";

const TABS = [
  { href: "/pos", label: "Billing", icon: ShoppingCart },
  { href: "/repairs", label: "Repairs", icon: Wrench },
  { href: "/stock", label: "Stock Check", icon: ScanBarcode },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="no-print grid grid-cols-3 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#121316]">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
              active
                ? "text-orange-600 font-semibold"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
