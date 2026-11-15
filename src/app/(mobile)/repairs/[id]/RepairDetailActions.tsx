"use client";

import { useTransition } from "react";
import { Printer } from "lucide-react";
import { updateRepairStatus } from "@/lib/actions/repair";
import type { RepairStatus } from "@/generated/prisma/client";

export function RepairDetailActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: RepairStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: RepairStatus) {
    startTransition(async () => {
      await updateRepairStatus(orderId, newStatus);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        disabled={isPending}
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value as RepairStatus)}
        aria-label="Update repair status"
        className="rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-black dark:border-white/15 dark:bg-neutral-900 dark:text-white"
      >
        <option value="RECEIVED">Received</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="WAITING_PARTS">Waiting Parts</option>
        <option value="READY">Ready for Pickup</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>

      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-md bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-500 shadow-sm"
      >
        <Printer size={15} />
        Print Job Slip (A5)
      </button>
    </div>
  );
}

