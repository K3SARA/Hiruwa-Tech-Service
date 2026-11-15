import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getRepairOrder } from "@/lib/actions/repair";
import { RepairDocument } from "@/components/repairs/RepairDocument";
import { formatRepairNumber } from "@/lib/invoice-number";
import { buildRepairReadyWhatsApp, buildRepairReceivedWhatsApp } from "@/lib/repair-whatsapp";
import { RepairDetailActions } from "./RepairDetailActions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getRepairOrder(id);
  if (!order) return { title: "Repair Order Not Found" };
  return {
    title: `Repair Job #${formatRepairNumber(order.sequence)} - Hiruwa Tech & Service`,
  };
}

export default async function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getRepairOrder(id);

  if (!order) {
    notFound();
  }

  const estCost = order.estimatedCost ? Number(order.estimatedCost) : null;
  const advPaid = Number(order.advancePaid) || 0;

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
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10">
        <Link
          href="/repairs"
          className="flex items-center gap-1.5 text-xs font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to all repairs
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {order.status === "READY" && readyWaLink && (
            <a
              href={readyWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm"
            >
              <MessageCircle size={15} />
              WhatsApp: Ready for Pickup
            </a>
          )}

          {receivedWaLink && (
            <a
              href={receivedWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-black/5 px-3 py-2 text-xs font-semibold text-black/70 hover:bg-black/10 dark:bg-white/10 dark:text-white/80"
            >
              <MessageCircle size={15} />
              WhatsApp: Job Slip
            </a>
          )}

          <RepairDetailActions orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black print:border-none print:shadow-none">
        <RepairDocument order={order} />
      </div>
    </div>
  );
}
