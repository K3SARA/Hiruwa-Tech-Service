"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle, Printer, Search, Phone, ArrowRight, Trash2 } from "lucide-react";
import { formatRepairNumber } from "@/lib/invoice-number";
import { RepairStatusBadge } from "@/components/repairs/RepairStatusBadge";
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={18} />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, phone, device, IMEI, or #REP-000001..."
          className="w-full rounded-lg border border-black/15 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-white/15 dark:bg-black"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
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
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-orange-600 text-white"
                  : "bg-black/5 text-black/60 hover:bg-black/10 dark:bg-white/10 dark:text-white/60"
              }`}
            >
              {label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
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
              className="rounded-xl border border-black/10 bg-white p-4 shadow-sm transition-all hover:border-black/20 dark:border-white/10 dark:bg-black"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-black/5 pb-3 dark:border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/repairs/${order.id}`}
                      className="font-mono text-sm font-bold text-orange-600 hover:underline"
                    >
                      #{formatRepairNumber(order.sequence)}
                    </Link>
                    <RepairStatusBadge status={order.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                    Received on {new Date(order.createdAt).toLocaleDateString()}
                    {order.createdBy && ` by ${order.createdBy.name}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    disabled={isPending}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as RepairStatus)}
                    aria-label="Change repair status"
                    className="rounded-md border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-black/80 dark:border-white/15 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="RECEIVED">Received</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_PARTS">Waiting Parts</option>
                    <option value="READY">Ready for Pickup</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  <Link
                    href={`/repairs/${order.id}`}
                    aria-label="Print or view job ticket"
                    className="rounded-md border border-black/15 p-1.5 text-black/60 hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
                    title="Print / View Job Ticket"
                  >
                    <Printer size={16} />
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(order.id)}
                      aria-label="Delete repair order"
                      className="rounded-md border border-red-500/20 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete Order"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <p className="font-semibold text-black/50 dark:text-white/50 uppercase tracking-wider text-[10px]">
                    Customer
                  </p>
                  <p className="font-bold text-sm text-black dark:text-white">{order.customerName}</p>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center gap-1 font-mono text-black/70 hover:underline dark:text-white/70"
                  >
                    <Phone size={12} />
                    {order.customerPhone}
                  </a>
                </div>

                <div>
                  <p className="font-semibold text-black/50 dark:text-white/50 uppercase tracking-wider text-[10px]">
                    Device & Lock
                  </p>
                  <p className="font-bold text-sm text-black dark:text-white">
                    {order.deviceBrand} {order.deviceModel}
                  </p>
                  <p className="text-black/60 dark:text-white/60">
                    {order.passcode ? `Lock: ${order.passcode}` : "No passcode"}
                  </p>
                  {order.imeiOrSerial && (
                    <p className="font-mono text-[11px] text-black/50 dark:text-white/50">
                      IMEI: {order.imeiOrSerial}
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-black/50 dark:text-white/50 uppercase tracking-wider text-[10px]">
                    Cost & Balance
                  </p>
                  <p className="font-medium text-black/70 dark:text-white/70">
                    Est: {estCost !== null ? `Rs. ${estCost.toFixed(2)}` : "TBD"}
                  </p>
                  {advPaid > 0 && <p className="text-black/60 dark:text-white/60">Adv: Rs. {advPaid.toFixed(2)}</p>}
                  <p className="font-bold text-sm text-orange-600">
                    Due: {balance !== null ? `Rs. ${balance.toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>

              {/* Issue Description */}
              <div className="mt-2.5 rounded-lg bg-black/5 px-3 py-2 text-xs text-black/80 dark:bg-white/5 dark:text-white/80">
                <span className="font-semibold text-black dark:text-white">Issue: </span>
                {order.faultDescription}
                {order.conditionNotes && (
                  <span className="block mt-0.5 text-black/60 dark:text-white/60">
                    Condition: {order.conditionNotes}
                  </span>
                )}
              </div>

              {/* Footer Quick Action Buttons */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="flex gap-2">
                  {order.status === "READY" && readyWaLink && (
                    <a
                      href={readyWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
                    >
                      <MessageCircle size={14} />
                      WhatsApp Customer: Ready!
                    </a>
                  )}

                  {order.status === "RECEIVED" && receivedWaLink && (
                    <a
                      href={receivedWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md bg-black/5 px-3 py-1.5 text-xs font-semibold text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/80"
                    >
                      <MessageCircle size={14} />
                      Send Slip
                    </a>
                  )}
                </div>

                <Link
                  href={`/repairs/${order.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
                >
                  Manage Details & Slip
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-xl border border-dashed border-black/15 p-8 text-center text-sm text-black/40 dark:border-white/15 dark:text-white/40">
            No repair orders found. Click &quot;New Repair Job&quot; to intake a device.
          </div>
        )}
      </div>
    </div>
  );
}
