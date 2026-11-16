"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanBarcode, ShoppingCart, Wrench, Package, LayoutDashboard } from "lucide-react";
import { clsx } from "clsx";

interface MobileNavProps {
  role?: "ADMIN" | "SALES";
}

export function MobileNav({ role = "SALES" }: MobileNavProps) {
  const pathname = usePathname();

  const tabs =
    role === "ADMIN"
      ? [
          { href: "/pos", label: "Billing", icon: ShoppingCart },
          { href: "/repairs", label: "Repairs", icon: Wrench },
          { href: "/inventory", label: "Inventory", icon: Package },
          { href: "/stock", label: "Stock", icon: ScanBarcode },
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : [
          { href: "/pos", label: "Billing", icon: ShoppingCart },
          { href: "/repairs", label: "Repairs", icon: Wrench },
          { href: "/stock", label: "Stock Check", icon: ScanBarcode },
        ];

  return (
    <nav
      className={clsx(
        "no-print grid border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#121316] shadow-md",
        role === "ADMIN" ? "grid-cols-5" : "grid-cols-3"
      )}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors select-none",
              active
                ? "text-orange-600 font-semibold"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
