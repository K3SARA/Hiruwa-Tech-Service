"use client";

import { useState } from "react";
import { Plus, X, Wrench } from "lucide-react";
import { AddRepairForm } from "@/components/repairs/AddRepairForm";

export function AddRepairModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-orange-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-orange-500 shadow-sm transition-colors"
      >
        <Plus size={16} />
        New Repair Job
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 sm:pt-16">
          <div className="w-full max-w-xl rounded-xl border border-black/10 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400">
                  <Wrench size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-black dark:text-white">New Repair Intake</h2>
                  <p className="text-xs text-black/50 dark:text-white/50">Accept customer device & print claim ticket</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1.5 text-black/50 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <AddRepairForm onCreated={() => {}} />
          </div>
        </div>
      )}
    </>
  );
}

