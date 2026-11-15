import { Logo } from "@/components/layout/Logo";
import { BUSINESS } from "@/lib/business";
import { formatRepairNumber } from "@/lib/invoice-number";
import type { RepairOrder } from "@/generated/prisma/client";

export function RepairDocument({ order }: { order: RepairOrder & { createdBy?: { name: string } | null } }) {
  const estCost = order.estimatedCost ? Number(order.estimatedCost) : null;
  const advance = Number(order.advancePaid) || 0;
  const balance = estCost !== null ? Math.max(estCost - advance, 0) : null;

  return (
    <div className="bg-white p-6 text-black print:p-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b-2 border-orange-600 pb-4">
        <div className="flex items-start gap-3">
          <Logo className="h-14 w-auto" />
          <div className="text-[11px] leading-snug text-black/70">
            <p className="text-base font-bold text-black">{BUSINESS.name}</p>
            <p>{BUSINESS.address}</p>
            <p>{BUSINESS.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="inline-block rounded-sm bg-orange-600 px-3 py-1 text-sm font-bold tracking-[0.15em] text-white">
            REPAIR JOB TICKET
          </p>
          <p className="mt-1 font-mono text-base font-bold text-black">
            #{formatRepairNumber(order.sequence)}
          </p>
          <p className="text-xs text-black/60">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Two Column Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-b border-black/10 pb-4 text-xs">
        <div>
          <p className="font-bold uppercase tracking-wider text-black/50">Customer</p>
          <p className="mt-1 text-sm font-bold">{order.customerName}</p>
          <p className="text-black/70 font-mono">{order.customerPhone}</p>
        </div>
        <div className="text-right">
          <p className="font-bold uppercase tracking-wider text-black/50">Device Information</p>
          <p className="mt-1 text-sm font-bold">{order.deviceBrand} {order.deviceModel}</p>
          {order.imeiOrSerial && <p className="font-mono text-black/70">IMEI: {order.imeiOrSerial}</p>}
          {order.passcode && <p className="text-black/70 font-medium">Lock / PIN: {order.passcode}</p>}
        </div>
      </div>

      {/* Repair Details */}
      <div className="mt-4 space-y-3 text-xs">
        <div className="rounded-md bg-neutral-50 p-3 border border-black/10">
          <p className="font-bold uppercase tracking-wider text-black/60">Reported Issue / Fault</p>
          <p className="mt-1 text-sm font-medium text-black">{order.faultDescription}</p>
        </div>

        {order.conditionNotes && (
          <div className="rounded-md bg-neutral-50 p-3 border border-black/10">
            <p className="font-bold uppercase tracking-wider text-black/60">Intake Physical Condition</p>
            <p className="mt-1 text-xs text-black/80">{order.conditionNotes}</p>
          </div>
        )}
      </div>

      {/* Pricing Table */}
      <div className="mt-4 rounded-md border border-black/10 p-3 text-xs">
        <div className="flex justify-between py-1 border-b border-black/5">
          <span className="text-black/60">Estimated Repair Cost</span>
          <span className="font-semibold">{estCost !== null ? `Rs. ${estCost.toFixed(2)}` : "To be quoted"}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-black/5">
          <span className="text-black/60">Advance Deposit Paid</span>
          <span className="font-semibold">Rs. {advance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1 pt-1.5 text-sm font-bold text-orange-600">
          <span>Estimated Balance Due</span>
          <span>{balance !== null ? `Rs. ${balance.toFixed(2)}` : "—"}</span>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="mt-5 space-y-1 text-[10px] text-black/60">
        <p className="font-bold text-black/80">Terms & Conditions:</p>
        <p>1. Please present this job ticket when collecting your repaired device.</p>
        <p>2. We recommend backing up your data before repair. We are not responsible for any software or data loss.</p>
        <p>3. Devices not collected within 30 days after completion notification may be disposed of to recover costs.</p>
        {order.expectedDelivery && (
          <p className="font-semibold text-black">
            Expected ready date: {new Date(order.expectedDelivery).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-2 gap-8 pt-4 border-t border-black/10 text-center text-xs">
        <div>
          <div className="h-10"></div>
          <div className="border-t border-black/30 pt-1 text-black/60">Customer Signature</div>
        </div>
        <div>
          <div className="h-10"></div>
          <div className="border-t border-black/30 pt-1 text-black/60">Authorized Staff Signature</div>
        </div>
      </div>
    </div>
  );
}

