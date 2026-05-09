/*
  Warnings:

  - You are about to drop the column `attemptNumber` on the `LoginHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LoginHistory" DROP COLUMN "attemptNumber",
ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "isSecure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "os" TEXT;
