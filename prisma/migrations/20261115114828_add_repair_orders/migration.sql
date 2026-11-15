-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'WAITING_PARTS', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "RepairOrder" (
    "id" TEXT NOT NULL,
    "sequence" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deviceBrand" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "imeiOrSerial" TEXT,
    "passcode" TEXT,
    "faultDescription" TEXT NOT NULL,
    "conditionNotes" TEXT,
    "estimatedCost" DECIMAL(10,2),
    "advancePaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalCost" DECIMAL(10,2),
    "status" "RepairStatus" NOT NULL DEFAULT 'RECEIVED',
    "technicianNotes" TEXT,
    "expectedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "RepairOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepairOrder_sequence_key" ON "RepairOrder"("sequence");

-- CreateIndex
CREATE INDEX "RepairOrder_status_idx" ON "RepairOrder"("status");

-- CreateIndex
CREATE INDEX "RepairOrder_customerPhone_idx" ON "RepairOrder"("customerPhone");

-- CreateIndex
CREATE INDEX "RepairOrder_deviceBrand_idx" ON "RepairOrder"("deviceBrand");

-- AddForeignKey
ALTER TABLE "RepairOrder" ADD CONSTRAINT "RepairOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
