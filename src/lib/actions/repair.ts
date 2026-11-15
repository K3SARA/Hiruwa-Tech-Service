"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { RepairStatus } from "@/generated/prisma/client";

const CreateRepairSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerPhone: z.string().trim().min(9, "Valid phone number is required"),
  deviceBrand: z.string().trim().min(1, "Device brand is required"),
  deviceModel: z.string().trim().min(1, "Device model is required"),
  imeiOrSerial: z.string().trim().optional(),
  passcode: z.string().trim().optional(),
  faultDescription: z.string().trim().min(1, "Fault description is required"),
  conditionNotes: z.string().trim().optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
  advancePaid: z.coerce.number().min(0).default(0),
  expectedDelivery: z.string().optional(),
});

export type ActionResult<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
};

export async function createRepairOrder(
  _prevState: ActionResult<{ id: string; sequence: number }>,
  formData: FormData
): Promise<ActionResult<{ id: string; sequence: number }>> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in to take repair orders." };
  }

  const raw = {
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    deviceBrand: formData.get("deviceBrand"),
    deviceModel: formData.get("deviceModel"),
    imeiOrSerial: formData.get("imeiOrSerial") || undefined,
    passcode: formData.get("passcode") || undefined,
    faultDescription: formData.get("faultDescription"),
    conditionNotes: formData.get("conditionNotes") || undefined,
    estimatedCost: formData.get("estimatedCost") || undefined,
    advancePaid: formData.get("advancePaid") || 0,
    expectedDelivery: formData.get("expectedDelivery") || undefined,
  };

  const parsed = CreateRepairSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form input." };
  }

  try {
    const order = await prisma.repairOrder.create({
      data: {
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        deviceBrand: parsed.data.deviceBrand,
        deviceModel: parsed.data.deviceModel,
        imeiOrSerial: parsed.data.imeiOrSerial,
        passcode: parsed.data.passcode,
        faultDescription: parsed.data.faultDescription,
        conditionNotes: parsed.data.conditionNotes,
        estimatedCost: parsed.data.estimatedCost ?? null,
        advancePaid: parsed.data.advancePaid,
        expectedDelivery: parsed.data.expectedDelivery ? new Date(parsed.data.expectedDelivery) : null,
        createdById: session.user.id,
      },
    });

    revalidatePath("/repairs");
    return { success: true, data: { id: order.id, sequence: order.sequence } };
  } catch (err) {
    console.error("Failed to create repair order:", err);
    return { error: "Failed to create repair order. Please try again." };
  }
}

export async function updateRepairStatus(
  orderId: string,
  status: RepairStatus,
  technicianNotes?: string,
  finalCost?: number
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "You must be signed in." };
  }

  try {
    await prisma.repairOrder.update({
      where: { id: orderId },
      data: {
        status,
        ...(technicianNotes !== undefined ? { technicianNotes } : {}),
        ...(finalCost !== undefined ? { finalCost } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
    });

    revalidatePath("/repairs");
    revalidatePath(`/repairs/${orderId}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to update repair order status:", err);
    return { error: "Failed to update status." };
  }
}

export async function getRepairOrders(filter?: {
  search?: string;
  status?: RepairStatus;
}) {
  const where: Record<string, unknown> = {};

  if (filter?.status) {
    where.status = filter.status;
  }

  if (filter?.search) {
    const q = filter.search.trim();
    // Check if searching by repair number e.g. REP-000005 or 5
    const repNumMatch = q.match(/^(?:REP-)?0*(\d+)$/i);
    if (repNumMatch) {
      where.sequence = parseInt(repNumMatch[1], 10);
    } else {
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q } },
        { deviceBrand: { contains: q, mode: "insensitive" } },
        { deviceModel: { contains: q, mode: "insensitive" } },
        { imeiOrSerial: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  return prisma.repairOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });
}

export async function getRepairOrder(id: string) {
  return prisma.repairOrder.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { name: true },
      },
    },
  });
}

export async function deleteRepairOrder(orderId: string): Promise<ActionResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { error: "Only admins can delete repair orders." };
  }

  try {
    await prisma.repairOrder.delete({
      where: { id: orderId },
    });
    revalidatePath("/repairs");
    return { success: true };
  } catch (err) {
    console.error("Failed to delete repair order:", err);
    return { error: "Failed to delete repair order." };
  }
}

