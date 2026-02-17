-- AlterEnum
ALTER TYPE "SubscriptionType" ADD VALUE 'AMBASSADOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3);
