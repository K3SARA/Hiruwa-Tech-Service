import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInvoiceNumber } from "@/lib/invoice-number";
import { CompletedBillsList, type CompletedBill } from "@/components/pos/CompletedBillsList";
import { ArrowLeft, ShoppingCart, Plus } from "lucide-react";

async function getCompletedBills(): Promise<CompletedBill[]> {
  const invoices = await prisma.invoice.findMany({
    take: 150,
    orderBy: { date: "desc" },
    include: {
      items: {
        include: {
          inventoryUnit: {
            include: {
              product: {
                select: { name: true, brand: true },
              },
            },
          },
        },
      },
      createdBy: {
        select: { name: true },
      },
    },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: formatInvoiceNumber(inv.sequence),
    sequence: inv.sequence,
    date: inv.date.toISOString(),
    customerName: inv.customerName,
    customerPhone: inv.customerPhone,
    vehicleNumber: inv.vehicleNumber,
    totalAmount: Number(inv.totalAmount),
    amountPaid: Number(inv.amountPaid),
    balanceDue: Math.max(Number(inv.totalAmount) - Number(inv.amountPaid), 0),
    soldBy: inv.createdBy?.name ?? null,
    items: inv.items.map((item) => ({
      id: item.id,
      name: item.inventoryUnit.product.name,
      brand: item.inventoryUnit.product.brand,
      serialNumber: item.inventoryUnit.serialNumber,
      salePrice: Number(item.salePrice),
      warrantyMonths: item.warrantyMonths,
    })),
  }));
}

export default async function BillsPage() {
  const bills = await getCompletedBills();

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-black dark:text-white">Completed Bills</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">View, search, print receipts, and share on WhatsApp</p>
        </div>

        <Link
          href="/pos"
          className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-500 transition-colors"
        >
          <ShoppingCart size={14} />
          <span>New Bill</span>
        </Link>
      </div>

      {/* Interactive Bills List */}
      <CompletedBillsList initialBills={bills} />
    </div>
  );
}

