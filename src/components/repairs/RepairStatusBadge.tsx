import { clsx } from "clsx";
import type { RepairStatus } from "@/generated/prisma/client";

const CONFIG: Record<RepairStatus, { label: string; className: string }> = {
  RECEIVED: {
    label: "Received",
    className: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  },
  WAITING_PARTS: {
    label: "Waiting Parts",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
  READY: {
    label: "Ready for Pickup",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 font-bold",
  },
  DELIVERED: {
    label: "Delivered / Closed",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
};

export function RepairStatusBadge({ status }: { status: RepairStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.RECEIVED;
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
      {cfg.label}
    </span>
  );
}

