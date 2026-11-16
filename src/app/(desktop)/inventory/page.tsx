import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { deleteProduct } from "@/lib/actions/inventory";
import { getCategories } from "@/lib/actions/catalog";
import { AddProductModal } from "@/components/inventory/AddProductModal";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { clsx } from "clsx";
import { Plus, Edit2, Trash2, PackagePlus } from "lucide-react";

async function getProducts(category?: string, search?: string) {
  const AND: Prisma.ProductWhereInput[] = [];
  if (category) AND.push({ category });
  if (search) {
    AND.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { supplier: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  return prisma.product.findMany({
    where: AND.length > 0 ? { AND } : undefined,
    include: {
      _count: { select: { units: { where: { status: "IN_STOCK" } } } },
      supplier: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; error?: string }>;
}) {
  const { category, search, error } = await searchParams;
  const [products, categories] = await Promise.all([getProducts(category, search), getCategories()]);

  return (
    <div className="space-y-4">
      {/* Responsive Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Inventory</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {products.length} {products.length === 1 ? "product" : "products"} registered
            </p>
          </div>
          <div className="sm:hidden">
            <AddProductModal />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-full sm:w-64">
            <InventorySearch />
          </div>
          <div className="hidden sm:block">
            <AddProductModal />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
          {error}
        </p>
      )}

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
        <Link
          href="/inventory"
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0",
            !category ? "bg-orange-600 text-white font-semibold" : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60 hover:bg-black/10"
          )}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/inventory?category=${encodeURIComponent(c)}`}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0",
              category === c ? "bg-orange-600 text-white font-semibold" : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60 hover:bg-black/10"
            )}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* Mobile Card List (shown on < md screens) */}
      <div className="md:hidden space-y-2.5">
        {products.map((p) => {
          const isLowStock = p._count.units <= p.lowStockThreshold;
          return (
            <div
              key={p.id}
              className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-[#121316]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/inventory/${p.id}`}
                    className="font-bold text-sm text-black dark:text-white hover:text-orange-600 transition-colors truncate block"
                  >
                    {p.brand} {p.name}
                  </Link>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                    Code: {p.sku} · {p.category}
                  </p>
                </div>
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    isLowStock
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                  )}
                >
                  {p._count.units} in stock
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-300">
                <span className="font-semibold text-black dark:text-white">
                  {p.sellingPrice ? `Rs. ${Number(p.sellingPrice).toFixed(2)}` : "—"}
                  {p.warrantyMonths > 0 ? (
                    <span className="ml-1 text-[11px] font-normal text-zinc-400">({p.warrantyMonths}m war)</span>
                  ) : null}
                </span>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/inventory/${p.id}`}
                    className="flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-500 transition-colors"
                  >
                    <PackagePlus size={14} />
                    <span>+ Units</span>
                  </Link>
                  <Link
                    href={`/inventory/${p.id}/edit`}
                    className="flex items-center gap-1 text-zinc-500 hover:text-orange-600 transition-colors"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </Link>
                  <form action={deleteProduct.bind(null, p.id)}>
                    <button
                      className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-[#121316]">
            <p className="text-sm">
              {search
                ? `No products matching "${search}"${category ? ` in "${category}"` : ""}.`
                : category
                  ? `No products in "${category}".`
                  : "No products added yet."}
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table View (shown on >= md screens) */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Barcode / Model</th>
              <th className="px-4 py-3">Selling Price</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Warranty</th>
              <th className="px-4 py-3">In stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/inventory/${p.id}`} className="font-semibold text-orange-600 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.brand}</td>
                <td className="px-4 py-3">{p.category}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3 font-medium">{p.sellingPrice ? `Rs. ${Number(p.sellingPrice).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3 text-zinc-500">{p.supplier?.name ?? "—"}</td>
                <td className="px-4 py-3">{p.warrantyMonths} mo</td>
                <td className="px-4 py-3">
                  <span className={clsx("font-semibold", p._count.units <= p.lowStockThreshold ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")}>
                    {p._count.units}
                  </span>
                  {p._count.units <= p.lowStockThreshold && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                      Low
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/inventory/${p.id}`} className="text-xs font-semibold text-orange-600 hover:underline">
                      + Units
                    </Link>
                    <Link href={`/inventory/${p.id}/edit`} className="text-xs text-zinc-500 hover:text-orange-600 transition-colors">
                      Edit
                    </Link>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <button className="text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                  {search
                    ? `No products matching "${search}"${category ? ` in "${category}"` : ""}.`
                    : category
                      ? `No products in "${category}".`
                      : "No products added yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
