"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, MessageCircle, Printer, ArrowUpRight, Receipt, Calendar, CreditCard, User, Phone, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";
import { buildBillWhatsAppLink } from "@/lib/invoice-whatsapp";

export type BillItem = {
  id: string;
  name: string;
  brand: string;
  serialNumber: string;
  salePrice: number;
  warrantyMonths: number;
};

export type CompletedBill = {
  id: string;
  invoiceNumber: string;
  sequence: number;
  date: string; // ISO string
  customerName: string;
  customerPhone: string;
  vehicleNumber: string | null;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  soldBy: string | null;
  items: BillItem[];
};

interface CompletedBillsListProps {
  initialBills: CompletedBill[];
}

export function CompletedBillsList({ initialBills }: CompletedBillsListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "credit">("all");

  // Today's date check string
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter bills based on search & filter tabs
  const filteredBills = useMemo(() => {
    return initialBills.filter((bill) => {
      // Tab filter
      if (filter === "today") {
        const billDay = bill.date.slice(0, 10);
        if (billDay !== todayStr) return false;
      } else if (filter === "credit") {
        if (bill.balanceDue <= 0.005) return false;
      }

      // Search query
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const matchInv = bill.invoiceNumber.toLowerCase().includes(q) || String(bill.sequence).includes(q);
      const matchName = bill.customerName.toLowerCase().includes(q);
      const matchPhone = bill.customerPhone.toLowerCase().includes(q);
      const matchVehicle = bill.vehicleNumber?.toLowerCase().includes(q) ?? false;
      const matchItems = bill.items.some(
        (i) => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q) || i.serialNumber.toLowerCase().includes(q)
      );

      return matchInv || matchName || matchPhone || matchVehicle || matchItems;
    });
  }, [initialBills, search, filter, todayStr]);

  // Overall metrics
  const stats = useMemo(() => {
    const todayBills = initialBills.filter((b) => b.date.slice(0, 10) === todayStr);
    const todayRevenue = todayBills.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalCredit = initialBills.reduce((acc, b) => acc + b.balanceDue, 0);
    const creditCount = initialBills.filter((b) => b.balanceDue > 0.005).length;

    return {
      todayCount: todayBills.length,
      todayRevenue,
      totalCredit,
      creditCount,
      totalCount: initialBills.length,
    };
  }, [initialBills, todayStr]);

  // Clean date formatter
  function formatBillTime(isoDate: string) {
    const d = new Date(isoDate);
    const isToday = isoDate.slice(0, 10) === todayStr;
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Today, ${timeStr}`;

    const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${dateStr}, ${timeStr}`;
  }

  return (
    <div className="space-y-3.5">
      {/* Ultra Minimal Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-[#121316]">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Today&apos;s Sales</p>
          <p className="mt-1 text-sm font-bold tracking-tight text-black dark:text-white truncate">
            Rs. {stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{stats.todayCount} {stats.todayCount === 1 ? "bill" : "bills"}</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-[#121316]">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Total Bills</p>
          <p className="mt-1 text-sm font-bold tracking-tight text-black dark:text-white">
            {stats.totalCount}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Recorded</p>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-white p-3 dark:border-zinc-800 dark:bg-[#121316]">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Credit Due</p>
          <p className={clsx("mt-1 text-sm font-bold tracking-tight truncate", stats.totalCredit > 0 ? "text-amber-600 dark:text-amber-400" : "text-black dark:text-white")}>
            Rs. {stats.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">{stats.creditCount} pending</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by bill #, customer name, or phone..."
          className="w-full rounded-xl border border-zinc-200/90 bg-white py-2 pl-9 pr-8 text-xs font-medium placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-zinc-800 dark:bg-[#121316] dark:text-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Minimal Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
            filter === "all"
              ? "bg-orange-600 text-white font-semibold shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          All ({initialBills.length})
        </button>
        <button
          onClick={() => setFilter("today")}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
            filter === "today"
              ? "bg-orange-600 text-white font-semibold shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          Today ({stats.todayCount})
        </button>
        <button
          onClick={() => setFilter("credit")}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer",
            filter === "credit"
              ? "bg-amber-600 text-white font-semibold shadow-sm"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          Credit / Due ({stats.creditCount})
        </button>
      </div>

      {/* Bills Cards List */}
      <div className="space-y-2.5">
        {filteredBills.map((bill) => {
          const isPaid = bill.balanceDue <= 0.005;
          const whatsAppLink = buildBillWhatsAppLink({
            phone: bill.customerPhone,
            invoiceNumber: bill.invoiceNumber,
            total: bill.totalAmount,
            balanceDue: bill.balanceDue,
            items: bill.items,
          });

          return (
            <div
              key={bill.id}
              className="group rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md dark:border-zinc-800/90 dark:bg-[#121316]"
            >
              {/* Card Header: Invoice #, Time, Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-500">
                    {bill.invoiceNumber}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    · {formatBillTime(bill.date)}
                  </span>
                </div>

                {isPaid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400 border border-green-500/20">
                    <CheckCircle2 size={11} />
                    Paid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <Clock size={11} />
                    Rs. {bill.balanceDue.toFixed(2)} due
                  </span>
                )}
              </div>

              {/* Customer Details */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-black dark:text-white truncate">
                    {bill.customerName || "Walk-in Customer"}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {bill.customerPhone ? `📞 ${bill.customerPhone}` : "No phone provided"}
                    {bill.vehicleNumber ? ` · 🚗 ${bill.vehicleNumber}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-black dark:text-white">
                    Rs. {bill.totalAmount.toFixed(2)}
                  </p>
                  {bill.soldBy && (
                    <p className="text-[10px] text-zinc-400">By {bill.soldBy}</p>
                  )}
                </div>
              </div>

              {/* Items Preview Chips */}
              {bill.items.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
                  {bill.items.slice(0, 3).map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {item.brand} {item.name}
                      {item.serialNumber && item.serialNumber !== "—" && (
                        <span className="text-[9px] text-zinc-400 font-mono">({item.serialNumber})</span>
                      )}
                    </span>
                  ))}
                  {bill.items.length > 3 && (
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      +{bill.items.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Card Footer Actions */}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
                <span className="text-[11px] text-zinc-400">
                  {bill.items.length} {bill.items.length === 1 ? "item" : "items"}
                </span>

                <div className="flex items-center gap-2">
                  {whatsAppLink && (
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400 transition-colors"
                      title="Send WhatsApp receipt"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <Link
                    href={`/pos/invoice/${bill.id}`}
                    className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-orange-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-orange-600 dark:hover:text-white transition-colors"
                  >
                    <Printer size={13} />
                    <span>View & Print</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredBills.length === 0 && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center dark:border-zinc-800 dark:bg-[#121316]">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Receipt size={20} />
            </div>
            <p className="mt-2 text-xs font-semibold text-black dark:text-white">No bills found</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {search
                ? `No matching completed bills for "${search}"`
                : filter === "today"
                  ? "No bills issued today yet."
                  : filter === "credit"
                    ? "No pending credit bills."
                    : "No completed bills yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
