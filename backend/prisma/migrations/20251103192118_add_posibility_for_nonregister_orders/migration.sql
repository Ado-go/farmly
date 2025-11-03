-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "anonymousEmail" TEXT,
ALTER COLUMN "buyerId" DROP NOT NULL;
