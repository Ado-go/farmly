-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "farmerId" INTEGER;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
