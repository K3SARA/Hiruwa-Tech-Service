import Link from "next/link";
import { Receipt } from "lucide-react";
import { CartPanel } from "@/components/pos/CartPanel";
import { getLowStockProducts } from "@/lib/actions/inventory";
import { LowStockAlert } from "@/components/inventory/LowStockAlert";

export default async function PosPage() {
  const lowStockProducts = await getLowStockProducts();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-base font-bold">Billing</h1>
        <Link
          href="/bills"
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:border-orange-500 hover:text-orange-600 dark:border-zinc-800 dark:bg-[#121316] dark:text-zinc-300 dark:hover:text-orange-400 transition-colors"
        >
          <Receipt size={14} className="text-orange-600" />
          <span>Completed Bills</span>
        </Link>
      </div>
      <div className="mb-4">
        <LowStockAlert items={lowStockProducts} />
      </div>
      <CartPanel />
    </div>
  );
}
