import { auth } from "@/lib/auth";
import { StockSearch } from "@/components/pos/StockSearch";
import { AddProductModal } from "@/components/inventory/AddProductModal";

export default async function StockPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">Stock Check</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Search and verify inventory items</p>
        </div>
        {isAdmin && <AddProductModal />}
      </div>
      <StockSearch />
    </div>
  );
}
