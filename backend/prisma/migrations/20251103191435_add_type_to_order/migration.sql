-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('STANDARD', 'PREORDER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'STANDARD';
