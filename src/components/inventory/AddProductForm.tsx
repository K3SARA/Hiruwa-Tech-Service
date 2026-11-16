"use client";

import { useActionState, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { createProduct, type ActionResult } from "@/lib/actions/inventory";
import { SupplierCombobox } from "@/components/inventory/SupplierCombobox";
import { ProductNameInput } from "@/components/inventory/ProductNameInput";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { generateShopBarcode } from "@/lib/barcode";

const initialState: ActionResult = {};

export function AddProductForm() {
  const [state, formAction, isPending] = useActionState(createProduct, initialState);
  const [formKey, setFormKey] = useState(0);
  const [sku, setSku] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // When form resets on success, also clear the controlled SKU field
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setFormKey((k) => k + 1);
      setSku("");
    }
  }

  function handleBarcodeScan(code: string): { success: boolean; message: string } {
    const trimmed = code.trim();
    if (!trimmed) return { success: false, message: "Empty barcode scanned" };
    setSku(trimmed);
    return { success: true, message: `Assigned barcode: ${trimmed}` };
  }

  function handleAutoAssign() {
    const generated = generateShopBarcode();
    setSku(generated);
  }

  return (
    <>
      <form key={formKey} action={formAction} className="space-y-3">
        <ProductNameInput />
        <input
          name="brand"
          placeholder="Brand (e.g. Apple, Samsung, Anker)"
          required
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
        />
        <input
          name="category"
          placeholder="Category (e.g. Display, Battery, Cable, Phone)"
          required
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
        />

        {/* Barcode / Model Number Field with Camera Scan & Auto-generate */}
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

        <input
          name="sellingPrice"
          type="number"
          step="0.01"
          min="0"
          placeholder="Selling price (Rs.)"
          required
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
        />
        <input
          name="warrantyMonths"
          type="number"
          min="0"
          placeholder="Warranty (months — 0 for accessories)"
          required
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
        />
        <input
          name="lowStockThreshold"
          type="number"
          min="0"
          defaultValue={3}
          placeholder="Low stock alert at (units)"
          required
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
        />

        <SupplierCombobox />

        {state.error && <p className="text-xs font-medium text-amber-600 dark:text-amber-400">{state.error}</p>}
        {state.success && <p className="text-xs text-green-600">{state.success}</p>}

        <button
          disabled={isPending}
          className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-orange-500 transition-colors cursor-pointer"
        >
          {isPending ? "Adding product..." : "Add product to inventory"}
        </button>
      </form>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
        title="Scan Item Barcode for Inventory"
      />
    </>
  );
}
