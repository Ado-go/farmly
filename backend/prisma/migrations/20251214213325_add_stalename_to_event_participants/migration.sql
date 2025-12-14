-- AlterTable
ALTER TABLE "EventParticipant" ADD COLUMN     "stallName" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "stallName" TEXT;
