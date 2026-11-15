import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const salesPassword = await bcrypt.hash("sales123", 10);

  await prisma.user.upsert({
    where: { email: "admin@hiruwa.lk" },
    update: {},
    create: {
      name: "Shop Admin",
      email: "admin@hiruwa.lk",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@hiruwa.lk" },
    update: {},
    create: {
      name: "Floor Staff",
      email: "sales@hiruwa.lk",
      passwordHash: salesPassword,
      role: "SALES",
    },
  });

  const tv = await prisma.product.upsert({
    where: { sku: "SAM-TV-43CU7000" },
    update: {},
    create: {
      name: "43\" 4K UHD Smart TV",
      brand: "Samsung",
      category: "Television",
      sku: "SAM-TV-43CU7000",
      warrantyMonths: 24,
    },
  });

  const phone = await prisma.product.upsert({
    where: { sku: "XIA-R13-128" },
    update: {},
    create: {
      name: "Redmi Note 13 (8GB / 128GB)",
      brand: "Xiaomi",
      category: "Mobile Phones",
      sku: "XIA-R13-128",
      warrantyMonths: 12,
    },
  });

  await prisma.inventoryUnit.createMany({
    skipDuplicates: true,
    data: [
      { productId: tv.id, serialNumber: "SAM-SN-0001", location: "TV-Rack-1" },
      { productId: tv.id, serialNumber: "SAM-SN-0002", location: "TV-Rack-1" },
      { productId: tv.id, serialNumber: "SAM-SN-0003", location: "TV-Rack-1" },
      { productId: phone.id, serialNumber: "XIA-SN-0001", location: "Showcase-A" },
      { productId: phone.id, serialNumber: "XIA-SN-0002", location: "Showcase-A" },
    ],
  });

  console.log("Seed complete. Login with admin@hiruwa.lk / admin123 or sales@hiruwa.lk / sales123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
