import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ All data were deleted.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
