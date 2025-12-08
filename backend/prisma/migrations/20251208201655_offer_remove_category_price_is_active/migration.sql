/*
  Warnings:

  - You are about to drop the column `category` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Offer` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Offer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "category",
DROP COLUMN "isActive",
DROP COLUMN "price";
