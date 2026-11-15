import { buildWhatsAppLink } from "@/lib/whatsapp";
import { formatRepairNumber } from "@/lib/invoice-number";
import { BUSINESS } from "@/lib/business";

export function buildRepairReceivedWhatsApp(order: {
  sequence: number;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  faultDescription: string;
  estimatedCost: number | null;
  advancePaid: number;
  expectedDelivery: Date | null;
}): string | null {
  const lines = [
    `*${BUSINESS.name}*`,
    `🔧 *Repair Job Received*`,
    ``,
    `Dear ${order.customerName},`,
    `We have received your device for repair.`,
    ``,
    `*Job ID:* #${formatRepairNumber(order.sequence)}`,
    `*Device:* ${order.deviceBrand} ${order.deviceModel}`,
    `*Reported Issue:* ${order.faultDescription}`,
  ];

  if (order.estimatedCost) {
    lines.push(`*Estimated Cost:* Rs. ${order.estimatedCost.toFixed(2)}`);
  }
  if (order.advancePaid > 0) {
    lines.push(`*Advance Paid:* Rs. ${order.advancePaid.toFixed(2)}`);
  }
  if (order.expectedDelivery) {
    lines.push(`*Expected Ready:* ${new Date(order.expectedDelivery).toLocaleDateString()}`);
  }

  lines.push(
    ``,
    `We will notify you once your device is ready for collection.`,
    `📞 Hotline: ${BUSINESS.phone}`,
    `📍 Address: ${BUSINESS.address}`
  );

  return buildWhatsAppLink(order.customerPhone, lines.join("\n"));
}

export function buildRepairReadyWhatsApp(order: {
  sequence: number;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  finalCost: number | null;
  estimatedCost: number | null;
  advancePaid: number;
}): string | null {
  const total = order.finalCost ?? order.estimatedCost ?? 0;
  const balance = Math.max(total - order.advancePaid, 0);

  const lines = [
    `*${BUSINESS.name}*`,
    `✅ *Your Device is Ready for Pickup!*`,
    ``,
    `Dear ${order.customerName},`,
    `Your *${order.deviceBrand} ${order.deviceModel}* has been successfully repaired and is ready for collection.`,
    ``,
    `*Job ID:* #${formatRepairNumber(order.sequence)}`,
    `*Total Amount:* Rs. ${total.toFixed(2)}`,
  ];

  if (order.advancePaid > 0) {
    lines.push(`*Advance Paid:* Rs. ${order.advancePaid.toFixed(2)}`);
  }
  lines.push(`*Balance Due:* Rs. ${balance.toFixed(2)}`);

  lines.push(
    ``,
    `Please bring your job ticket or Job ID when collecting your device.`,
    `📞 Hotline: ${BUSINESS.phone}`,
    `📍 Address: ${BUSINESS.address}`
  );

  return buildWhatsAppLink(order.customerPhone, lines.join("\n"));
}
