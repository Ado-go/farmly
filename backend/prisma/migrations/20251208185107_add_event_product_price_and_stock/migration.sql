/*
  Warnings:

  - Added the required column `price` to the `EventProduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventProduct" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;
