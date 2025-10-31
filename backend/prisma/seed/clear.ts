import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing database...");

  await prisma.review.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.eventProduct.deleteMany({});
  await prisma.event.deleteMany({});

  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  await prisma.farmProduct.deleteMany({});
  await prisma.farmImage.deleteMany({});
  await prisma.farm.deleteMany({});

  await prisma.productImage.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.product.deleteMany({});

  await prisma.user.deleteMany({});

  console.log("✅ All data were successfully deleted.");
}

main()
  .catch((e) => {
    console.error("❌ Error clearing data:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
