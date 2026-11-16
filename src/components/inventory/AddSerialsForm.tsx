"use client";

import { useActionState, useState } from "react";
import { clsx } from "clsx";
import { Camera, Sparkles, Trash2 } from "lucide-react";
import { addInventoryUnits, generateInventoryUnits, type ActionResult } from "@/lib/actions/inventory";
import { BarcodeScannerModal } from "@/components/pos/BarcodeScannerModal";
import { generateShopBarcode } from "@/lib/barcode";

const initialState: ActionResult = {};

export function AddSerialsForm({ productId }: { productId: string }) {
  const [mode, setMode] = useState<"serials" | "quantity">("serials");
  const [serialsText, setSerialsText] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [serialsState, serialsAction, isAddingSerials] = useActionState(addInventoryUnits, initialState);
  const [quantityState, quantityAction, isGenerating] = useActionState(generateInventoryUnits, initialState);

  const state = mode === "serials" ? serialsState : quantityState;

  // Clear serials text when units are successfully saved
  const [handledState, setHandledState] = useState(serialsState);
  if (serialsState !== handledState) {
    setHandledState(serialsState);
    if (serialsState.success) {
      setSerialsText("");
    }
  }

  const serialsList = serialsText
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  function handleBarcodeScan(code: string): { success: boolean; message: string } {
    const trimmed = code.trim();
    if (!trimmed) return { success: false, message: "Empty barcode scanned." };

    if (serialsList.includes(trimmed)) {
      return { success: false, message: `Barcode "${trimmed}" is already scanned in this batch!` };
    }

    const updated = serialsText.trim() ? `${serialsText.trim()}\n${trimmed}` : trimmed;
    setSerialsText(updated);
    return {
      success: true,
      message: `✓ Scanned (${serialsList.length + 1}): ${trimmed}`,
    };
  }

  function handleAutoGenerateSingle() {
    const newBarcode = generateShopBarcode("SN");
    const updated = serialsText.trim() ? `${serialsText.trim()}\n${newBarcode}` : newBarcode;
    setSerialsText(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode("serials")}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors",
            mode === "serials" ? "bg-orange-600 text-white" : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60"
          )}
        >
          Scan / enter serial barcodes
        </button>
        <button
          type="button"
          onClick={() => setMode("quantity")}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors",
            mode === "quantity" ? "bg-orange-600 text-white" : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60"
          )}
        >
          No serial numbers — by quantity
        </button>
      </div>

      {mode === "serials" ? (
        <form action={serialsAction} className="space-y-3">
          <input type="hidden" name="productId" value={productId} />

          {/* Controls Bar above textarea */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-black/70 dark:text-white/70">
                Unit Barcodes / Serials
              </span>
              {serialsList.length > 0 && (
                <span className="rounded-full bg-orange-600/10 px-2 py-0.5 text-[11px] font-semibold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  {serialsList.length} {serialsList.length === 1 ? "unit" : "units"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1 rounded-md bg-orange-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors cursor-pointer"
                title="Scan serial barcodes using mobile camera"
              >
                <Camera size={13} />
                <span>Camera Scan</span>
              </button>
              <button
                type="button"
                onClick={handleAutoGenerateSingle}
                className="flex items-center gap-1 rounded-md border border-black/15 bg-black/5 px-2 py-1 text-xs font-medium text-black/80 hover:bg-black/10 dark:border-white/15 dark:bg-white/10 dark:text-white/80 transition-colors cursor-pointer"
                title="Auto-generate a unique serial barcode"
              >
                <Sparkles size={13} className="text-orange-500" />
                <span>+1 Auto</span>
              </button>
              {serialsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSerialsText("")}
                  className="rounded-md p-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear list"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <textarea
            name="serialNumbers"
            value={serialsText}
            onChange={(e) => setSerialsText(e.target.value)}
            required
            rows={4}
            placeholder="Scan with camera above, or type one serial / barcode per line"
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm font-mono dark:border-white/15 dark:bg-black"
          />

          <div className="flex gap-2">
            <input
              name="location"
              placeholder="Shelf / bin location (e.g. Shelf A-2)"
              className="w-1/2 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
            <input
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Cost price (Rs.)"
              className="w-1/2 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>

          <button
            disabled={isAddingSerials}
            className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-orange-500 transition-colors cursor-pointer"
          >
            {isAddingSerials ? "Saving units..." : `Add ${serialsList.length > 0 ? `${serialsList.length} ` : ""}serial units to stock`}
          </button>
        </form>
      ) : (
        <form action={quantityAction} className="space-y-2">
          <input type="hidden" name="productId" value={productId} />
          <p className="text-xs text-black/50 dark:text-white/50">
            For items with no manufacturer serial (cables, hardware, screen protectors) — each unit is
            tracked and sellable via the product&apos;s assigned barcode.
          </p>
          <input
            name="quantity"
            type="number"
            min="1"
            max="500"
            required
            placeholder="Quantity received"
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
          <div className="flex gap-2">
            <input
              name="location"
              placeholder="Shelf / bin location"
              className="w-1/2 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
            <input
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="Cost price (Rs.)"
              className="w-1/2 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
          <button
            disabled={isGenerating}
            className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-orange-500 transition-colors cursor-pointer"
          >
            {isGenerating ? "Adding..." : "Add units to stock"}
          </button>
        </form>
      )}

      {state.error && <p className="text-xs text-amber-600 dark:text-amber-400">{state.error}</p>}
      {state.success && <p className="text-xs text-green-600">{state.success}</p>}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
        title="Batch Scan Unit Barcodes"
      />
    </div>
  );
}
