export function formatInvoiceNumber(sequence: number): string {
  return `INV-${String(sequence).padStart(6, "0")}`;
}

export function formatRepairNumber(sequence: number): string {
  return `REP-${String(sequence).padStart(6, "0")}`;
}
