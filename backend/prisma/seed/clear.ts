import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Order is important, there are dependencies between tables
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("All farms, products and users were deleted ✅");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
