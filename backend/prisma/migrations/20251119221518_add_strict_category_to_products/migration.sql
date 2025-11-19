/*
  Warnings:

  - Changed the type of `category` on the `Offer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('Fruits', 'Vegetables', 'Meat', 'Dairy', 'Bakery', 'Drinks', 'Other');

-- AlterTable
ALTER TABLE "Offer" DROP COLUMN "category",
ADD COLUMN     "category" "ProductCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "category" "ProductCategory" NOT NULL;
