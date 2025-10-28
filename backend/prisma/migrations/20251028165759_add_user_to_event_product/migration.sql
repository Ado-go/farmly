/*
  Warnings:

  - A unique constraint covering the columns `[eventId,productId]` on the table `EventProduct` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `EventProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventProduct" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EventProduct_eventId_productId_key" ON "EventProduct"("eventId", "productId");

-- AddForeignKey
ALTER TABLE "EventProduct" ADD CONSTRAINT "EventProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
