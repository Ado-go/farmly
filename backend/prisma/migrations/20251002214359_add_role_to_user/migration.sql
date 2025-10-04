-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'FARMER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'CUSTOMER';
