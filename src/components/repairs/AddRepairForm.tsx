"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { MessageCircle, Printer, CheckCircle2 } from "lucide-react";
import { createRepairOrder, type ActionResult } from "@/lib/actions/repair";
import { formatRepairNumber } from "@/lib/invoice-number";
import { buildRepairReceivedWhatsApp } from "@/lib/repair-whatsapp";

const COMMON_BRANDS = ["Apple", "Samsung", "Xiaomi", "Vivo", "Oppo", "Huawei", "OnePlus", "Realme"];
const COMMON_FAULTS = [
  "Display / Touch Broken",
  "Battery Replacement",
  "Charging Port Issue",
  "No Power / Dead Device",
  "Water Damage",
  "Mic / Speaker Problem",
  "Camera Issue",
  "Software / Unlocking",
];

const initialState: ActionResult<{ id: string; sequence: number }> = {};

export function AddRepairForm({ onCreated }: { onCreated?: () => void }) {
  const [state, formAction, isPending] = useActionState(createRepairOrder, initialState);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [faultText, setFaultText] = useState("");

  const [createdOrderData, setCreatedOrderData] = useState<{
    id: string;
    sequence: number;
    phone: string;
    name: string;
    brand: string;
    model: string;
    fault: string;
    est: number;
    adv: number;
  } | null>(null);

  // If order was created, render success screen with 1-click WhatsApp and Print Ticket buttons
  if (state.success && state.data) {
    const waLink = buildRepairReceivedWhatsApp({
      sequence: state.data.sequence,
      customerName: createdOrderData?.name ?? "Customer",
      customerPhone: createdOrderData?.phone ?? "",
      deviceBrand: createdOrderData?.brand ?? "",
      deviceModel: createdOrderData?.model ?? "",
      faultDescription: createdOrderData?.fault ?? "",
      estimatedCost: createdOrderData?.est ?? null,
      advancePaid: createdOrderData?.adv ?? 0,
      expectedDelivery: null,
    });

    return (
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h3 className="text-base font-bold text-black dark:text-white">Repair Order Created!</h3>
          <p className="font-mono text-sm font-semibold text-orange-600">
            #{formatRepairNumber(state.data.sequence)}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <MessageCircle size={18} />
              Send Job Slip via WhatsApp
            </a>
          )}

          <Link
            href={`/repairs/${state.data.id}`}
            className="flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-black/80 dark:bg-white dark:text-black"
          >
            <Printer size={18} />
            View & Print Job Slip
          </Link>

          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            className="mt-2 text-xs text-black/60 hover:underline dark:text-white/60"
          >
            Create Another Repair Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        setCreatedOrderData({
          id: "",
          sequence: 0,
          name: String(formData.get("customerName") || ""),
          phone: String(formData.get("customerPhone") || ""),
          brand: String(formData.get("deviceBrand") || ""),
          model: String(formData.get("deviceModel") || ""),
          fault: String(formData.get("faultDescription") || ""),
          est: Number(formData.get("estimatedCost")) || 0,
          adv: Number(formData.get("advancePaid")) || 0,
        });
        formAction(formData);
        if (onCreated) onCreated();
      }}
      className="space-y-4"
    >
      {/* Customer Info */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Customer Details</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Customer Name *</label>
            <input
              name="customerName"
              placeholder="e.g. Kasun Silva"
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Mobile Number (WhatsApp) *</label>
            <input
              name="customerPhone"
              type="tel"
              placeholder="077 123 4567"
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
        </div>
      </div>

      {/* Device Details */}
      <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Device Info</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Brand *</label>
            <input
              name="deviceBrand"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              placeholder="e.g. Apple, Samsung"
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
            {/* Quick Brand Pills */}
            <div className="mt-1 flex flex-wrap gap-1">
              {COMMON_BRANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70"
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Model *</label>
            <input
              name="deviceModel"
              placeholder="e.g. iPhone 13 Pro, Redmi Note 12"
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">IMEI / Serial Number</label>
            <input
              name="imeiOrSerial"
              placeholder="15-digit IMEI or serial"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm font-mono dark:border-white/15 dark:bg-black"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">PIN / Unlock Code / Pattern</label>
            <input
              name="passcode"
              placeholder="e.g. 1234 or Pattern or No Lock"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
        </div>
      </div>

      {/* Fault & Condition */}
      <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Fault & Intake State</p>
        <div>
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Reported Issue / Fault *</label>
          <textarea
            name="faultDescription"
            value={faultText}
            onChange={(e) => setFaultText(e.target.value)}
            rows={2}
            required
            placeholder="Describe what the customer wants repaired..."
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
          {/* Quick Fault Pills */}
          <div className="mt-1 flex flex-wrap gap-1">
            {COMMON_FAULTS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFaultText((prev) => (prev ? `${prev}, ${f}` : f))}
                className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/70"
              >
                + {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-black/60 dark:text-white/60">Intake Physical Condition</label>
          <input
            name="conditionNotes"
            placeholder="e.g. Screen scratched, back glass intact, camera lens clean"
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </div>
      </div>

      {/* Pricing & Estimates */}
      <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
        <p className="text-xs font-bold uppercase tracking-wider text-black/50 dark:text-white/50">Estimates & Delivery</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Estimated Cost (Rs.)</label>
            <input
              name="estimatedCost"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Advance Paid (Rs.)</label>
            <input
              name="advancePaid"
              type="number"
              step="0.01"
              min="0"
              defaultValue={0}
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-black/60 dark:text-white/60">Promised Date</label>
            <input
              name="expectedDelivery"
              type="date"
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            />
          </div>
        </div>
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:opacity-40"
      >
        {isPending ? "Creating Job Ticket..." : "Accept Device & Create Job Ticket"}
      </button>
    </form>
  );
}

