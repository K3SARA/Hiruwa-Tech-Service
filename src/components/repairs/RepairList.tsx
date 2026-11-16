"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Printer, Search, ArrowRight, Trash2, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";
import { formatRepairNumber } from "@/lib/invoice-number";
import { updateRepairStatus, deleteRepairOrder } from "@/lib/actions/repair";
import { buildRepairReadyWhatsApp, buildRepairReceivedWhatsApp } from "@/lib/repair-whatsapp";
import type { RepairOrder, RepairStatus } from "@/generated/prisma/client";

const STATUS_FILTERS: { label: string; value: RepairStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Received", value: "RECEIVED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Waiting Parts", value: "WAITING_PARTS" },
  { label: "Ready", value: "READY" },
  { label: "Delivered", value: "DELIVERED" },
];

const STATUS_PILL_STYLES: Record<RepairStatus, string> = {
  RECEIVED: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60",
  WAITING_PARTS: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
  READY: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 font-bold",
  DELIVERED: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60",
};

export function RepairList({
  initialOrders,
  isAdmin,
}: {
  initialOrders: (RepairOrder & { createdBy?: { name: string } | null })[];
  isAdmin?: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = useState<RepairStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredOrders = initialOrders.filter((order) => {
    if (selectedStatus !== "ALL" && order.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const seqStr = formatRepairNumber(order.sequence).toLowerCase();
      const rawSeq = String(order.sequence);
      const match =
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        order.deviceBrand.toLowerCase().includes(q) ||
        order.deviceModel.toLowerCase().includes(q) ||
        (order.imeiOrSerial && order.imeiOrSerial.toLowerCase().includes(q)) ||
        seqStr.includes(q) ||
        rawSeq.includes(q);
      if (!match) return false;
    }
    return true;
  });

  function handleStatusChange(orderId: string, newStatus: RepairStatus) {
    startTransition(async () => {
      await updateRepairStatus(orderId, newStatus);
    });
  }

  function handleDelete(orderId: string) {
    if (!confirm("Are you sure you want to delete this repair order?")) return;
    startTransition(async () => {
      await deleteRepairOrder(orderId);
    });
  }

  return (
    <div className="space-y-3.5">
      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer, phone, device, or #REP-000001..."
          className="w-full rounded-xl border border-zinc-200/90 bg-white py-2 pl-9 pr-4 text-xs font-medium placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-800 dark:bg-[#121316] dark:text-white"
        />
      </div>

      {/* Status Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {STATUS_FILTERS.map(({ label, value }) => {
          const active = selectedStatus === value;
          const count =
            value === "ALL"
              ? initialOrders.length
              : initialOrders.filter((o) => o.status === value).length;

          return (
            <button
              key={value}
              onClick={() => setSelectedStatus(value)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
                active
                  ? "bg-orange-600 text-white font-semibold shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Ultra Neat Repair Cards List */}
      <div className="space-y-2.5">
        {filteredOrders.map((order) => {
          const estCost = order.estimatedCost ? Number(order.estimatedCost) : null;
          const advPaid = Number(order.advancePaid) || 0;
          const balance = estCost !== null ? Math.max(estCost - advPaid, 0) : null;

          const readyWaLink = buildRepairReadyWhatsApp({
            sequence: order.sequence,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deviceBrand: order.deviceBrand,
            deviceModel: order.deviceModel,
            finalCost: order.finalCost ? Number(order.finalCost) : null,
            estimatedCost: estCost,
            advancePaid: advPaid,
          });

          const receivedWaLink = buildRepairReceivedWhatsApp({
            sequence: order.sequence,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            deviceBrand: order.deviceBrand,
            deviceModel: order.deviceModel,
            faultDescription: order.faultDescription,
            estimatedCost: estCost,
            advancePaid: advPaid,
            expectedDelivery: order.expectedDelivery ? new Date(order.expectedDelivery) : null,
          });

          return (
            <div
              key={order.id}
              className="group rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md dark:border-zinc-800/90 dark:bg-[#121316]"
            >
              {/* Header: Ticket #, Date, Status Dropdown Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/repairs/${order.id}`}
                    className="font-mono text-xs font-bold text-orange-600 dark:text-orange-500 hover:underline"
                  >
                    #{formatRepairNumber(order.sequence)}
                  </Link>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    · {new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                </div>

                {/* Single Interactive Status Pill (Eliminates Duplicate Status) */}
                <select
                  disabled={isPending}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value as RepairStatus)}
                  aria-label="Change repair status"
                  className={clsx(
                    "cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-semibold border transition-all focus:outline-none focus:ring-1 focus:ring-orange-500 dark:bg-neutral-900",
                    STATUS_PILL_STYLES[order.status]
                  )}
                >
                  <option value="RECEIVED">Received</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_PARTS">Waiting Parts</option>
                  <option value="READY">Ready</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Body: Device, Customer & Cost */}
              <div className="mt-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/repairs/${order.id}`}
                    className="text-sm font-bold text-black dark:text-white hover:text-orange-600 transition-colors truncate block"
                  >
                    {order.deviceBrand} {order.deviceModel}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{order.customerName}</span>
                    <span>·</span>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="font-mono text-zinc-600 dark:text-zinc-300 hover:text-orange-600 transition-colors"
                    >
                      {order.customerPhone}
                    </a>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-black dark:text-white">
                    {order.finalCost
                      ? `Rs. ${Number(order.finalCost).toFixed(2)}`
                      : estCost !== null
                        ? `Rs. ${estCost.toFixed(2)}`
                        : "TBD"}
                  </p>
                  {balance !== null && balance > 0 ? (
                    <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      Rs. {balance.toFixed(2)} due
                    </p>
                  ) : balance === 0 ? (
                    <p className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                      ✓ Paid
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400">Est. cost</p>
                  )}
                </div>
              </div>

              {/* Issue & Lock Metadata Chips (Ultra-Clean Tags) */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <span className="text-zinc-400">Issue:</span> {order.faultDescription}
                </span>

                {order.passcode && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    🔒 {order.passcode}
                  </span>
                )}

                {order.imeiOrSerial && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 truncate max-w-[150px]">
                    IMEI: {order.imeiOrSerial}
                  </span>
                )}
              </div>

              {/* Minimal Card Footer Actions */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
                <div>
                  {order.status === "READY" && readyWaLink ? (
                    <a
                      href={readyWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400 transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp: Ready!</span>
                    </a>
                  ) : receivedWaLink ? (
                    <a
                      href={receivedWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 transition-colors"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp Slip</span>
                    </a>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/repairs/${order.id}`}
                    className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-orange-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-orange-600 dark:hover:text-white transition-colors"
                    title="View job ticket and print receipt"
                  >
                    <Printer size={13} />
                    <span>Slip</span>
                  </Link>

                  <Link
                    href={`/repairs/${order.id}`}
                    className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:border-orange-500 hover:text-orange-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-orange-400 transition-colors"
                  >
                    <span>Manage</span>
                    <ArrowRight size={12} />
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete repair job"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center text-zinc-400 dark:border-zinc-800 dark:bg-[#121316]">
            <p className="text-xs font-semibold text-black dark:text-white">No repair orders found</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {searchQuery
                ? `No orders matching "${searchQuery}"`
                : "No repair orders in this status category."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
