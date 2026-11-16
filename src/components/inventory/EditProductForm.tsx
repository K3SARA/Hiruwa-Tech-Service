"use client";

import { useActionState, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { updateProduct, type ActionResult } from "@/lib/actions/inventory";
import { SupplierCombobox } from "@/components/inventory/SupplierCombobox";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { generateShopBarcode } from "@/lib/barcode";

const initialState: ActionResult = {};

export function EditProductForm({
  product,
}: {
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    sku: string;
    sellingPrice: number | null;
    warrantyMonths: number;
    lowStockThreshold: number;
    supplierId: string | null;
    supplierName: string;
  };
}) {
  const boundAction = updateProduct.bind(null, product.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const [sku, setSku] = useState(product.sku);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  function handleBarcodeScan(code: string): { success: boolean; message: string } {
    const trimmed = code.trim();
    if (!trimmed) return { success: false, message: "Empty barcode scanned" };
    setSku(trimmed);
    return { success: true, message: `Updated barcode: ${trimmed}` };
  }

  function handleAutoAssign() {
    const generated = generateShopBarcode();
    setSku(generated);
  }

  return (
    <>
      <form action={formAction} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">Name</label>
          <input
            name="name"
            defaultValue={product.name}
            placeholder="Name"
            required
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">Brand</label>
          <input
            name="brand"
            defaultValue={product.brand}
            placeholder="Brand"
            required
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">Category</label>
          <input
            name="category"
            defaultValue={product.category}
            placeholder="Category"
            required
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-black/70 dark:text-white/70">
              Barcode / Model (SKU)
            </label>
            <span className="text-[11px] text-black/40 dark:text-white/40">
              Used for camera billing
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              name="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Scan barcode or enter model number"
              required
              className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm font-mono dark:border-white/15 dark:bg-black"
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex shrink-0 items-center gap-1 rounded-md bg-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors cursor-pointer"
              title="Scan barcode with camera"
            >
              <Camera size={14} />
              <span>Scan</span>
            </button>
            <button
              type="button"
              onClick={handleAutoAssign}
              className="flex shrink-0 items-center gap-1 rounded-md border border-black/15 bg-black/5 px-2.5 py-2 text-xs font-medium text-black/80 hover:bg-black/10 dark:border-white/15 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 transition-colors cursor-pointer"
              title="Auto-assign unique barcode"
            >
              <Sparkles size={14} className="text-orange-500" />
              <span>Auto</span>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">Selling price (Rs.)</label>
          <input
            name="sellingPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product.sellingPrice ?? ""}
            placeholder="Selling price (Rs.)"
            required
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">Warranty (months)</label>
          <input
            name="warrantyMonths"
            type="number"
            min="0"
            defaultValue={product.warrantyMonths}
            placeholder="Warranty (months)"
            required
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">Low stock alert threshold</label>
          <input
            name="lowStockThreshold"
            type="number"
            min="0"
            defaultValue={product.lowStockThreshold}
            placeholder="Low stock alert at (units)"
            required
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>

        <SupplierCombobox initialSupplierId={product.supplierId} initialSupplierName={product.supplierName} />

        {state.error && <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{state.error}</p>}

        <button
          disabled={isPending}
          className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-orange-500 transition-colors cursor-pointer"
        >
          {isPending ? "Saving changes..." : "Save changes"}
        </button>
      </form>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
        title="Update Product Barcode"
      />
    </>
  );
}
