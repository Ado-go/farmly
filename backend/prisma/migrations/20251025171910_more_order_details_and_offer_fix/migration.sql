/*
  Warnings:

  - You are about to drop the column `userId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `productId` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryCity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryCountry` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryPostalCode` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryRegion` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryStreet` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER');

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "productId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "userId",
ADD COLUMN     "buyerId" INTEGER NOT NULL,
ADD COLUMN     "deliveryCity" TEXT NOT NULL,
ADD COLUMN     "deliveryCountry" TEXT NOT NULL,
ADD COLUMN     "deliveryPostalCode" TEXT NOT NULL,
ADD COLUMN     "deliveryRegion" TEXT NOT NULL,
ADD COLUMN     "deliveryStreet" TEXT NOT NULL,
ADD COLUMN     "isDelivered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL,
ADD COLUMN     "sellerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
