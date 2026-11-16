"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FileBarChart, ShieldCheck, Truck, ShoppingCart, Wrench, X, Receipt } from "lucide-react";
import { clsx } from "clsx";
import { BUSINESS } from "@/lib/business";
import { Logo } from "@/components/layout/Logo";
import { useSidebar } from "@/components/layout/SidebarProvider";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Billing", icon: ShoppingCart },
  { href: "/bills", label: "Completed Bills", icon: Receipt },
  { href: "/repairs", label: "Repairs", icon: Wrench },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/warranty", label: "Warranty Claims", icon: ShieldCheck },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Overlay backdrop — visible when sidebar is open, click to close */}
      <div
        className={clsx(
          "no-print fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "no-print fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-[#121316]",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <Logo className="h-9 w-auto" />
            <div>
              <p className="text-sm font-bold leading-tight text-black dark:text-white">{BUSINESS.name}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close sidebar"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-orange-600 text-white font-semibold shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
