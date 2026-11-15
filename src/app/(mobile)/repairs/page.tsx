import { auth } from "@/lib/auth";
import { getRepairOrders } from "@/lib/actions/repair";
import { AddRepairModal } from "@/components/repairs/AddRepairModal";
import { RepairList } from "@/components/repairs/RepairList";
import { Wrench, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Mobile Repairs - Hiruwa Tech & Service",
};

export default async function RepairsPage() {
  const session = await auth();
  const orders = await getRepairOrders();

  const inProgressCount = orders.filter((o) => o.status === "IN_PROGRESS" || o.status === "WAITING_PARTS").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;
  const receivedCount = orders.filter((o) => o.status === "RECEIVED").length;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">Mobile Repairs</h1>
          <p className="text-xs text-black/50 dark:text-white/50">
            Intake customer devices, track repair status & notify customers
          </p>
        </div>
        <AddRepairModal />
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center gap-2 text-black/50 dark:text-white/50">
            <Clock size={16} />
            <span className="text-xs font-semibold">New Intake</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-black dark:text-white">{receivedCount}</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Wrench size={16} />
            <span className="text-xs font-semibold">In Repair</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <CheckCircle2 size={16} />
            <span className="text-xs font-semibold">Ready for Pickup</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-orange-600 dark:text-orange-400">{readyCount}</p>
        </div>
      </div>

      {/* Orders List & Filters */}
      <RepairList initialOrders={orders} isAdmin={session?.user?.role === "ADMIN"} />
    </div>
  );
}
