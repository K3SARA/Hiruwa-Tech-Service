import { BUSINESS } from "@/lib/business";
import { buildWhatsAppLink } from "@/lib/whatsapp";

interface BillMessageItem {
  name: string;
  brand: string;
  serialNumber?: string;
  salePrice: number;
  warrantyMonths?: number;
}

export function buildBillWhatsAppLink(args: {
  phone: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  items: BillMessageItem[];
}): string | null {
  const lines = [
    `*${BUSINESS.name}*`,
    `Invoice: ${args.invoiceNumber}`,
    `📍 ${BUSINESS.address}`,
    `📞 ${BUSINESS.phone}`,
    "",
    "Items:",
    ...args.items.map((i) => {
      const serialPart = i.serialNumber && i.serialNumber !== "—" ? ` (SN: ${i.serialNumber})` : "";
      return `• ${i.brand} ${i.name}${serialPart} — Rs. ${i.salePrice.toFixed(2)}`;
    }),
    "",
    `*Total: Rs. ${args.total.toFixed(2)}*`,
  ];

  if (args.balanceDue > 0.005) {
    lines.push(`*Balance Due: Rs. ${args.balanceDue.toFixed(2)}*`);
  }

  lines.push("", "Thank you for shopping with us!");

  return buildWhatsAppLink(args.phone, lines.join("\n"));
}
