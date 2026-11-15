"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteInvoice } from "@/lib/actions/pos";

export function DeleteInvoiceButton({ invoiceId, redirectAfter }: { invoiceId: string; redirectAfter?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm("Delete this invoice? Its sold item(s) will be returned to stock. This cannot be undone.")) return;
    startTransition(async () => {
      await deleteInvoice(invoiceId);
      if (redirectAfter) router.push(redirectAfter);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="no-print flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50/50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-orange-400 dark:hover:text-orange-400 dark:hover:bg-zinc-800 transition-colors"
    >
      <Trash2 size={14} />
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
