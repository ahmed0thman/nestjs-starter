/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_loginHistoryId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "authSecurity" ADD COLUMN     "lastVerificationEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "verificationSecret" TEXT;

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "JwtSession" (
    "id" TEXT NOT NULL DEFAULT uuidv7(),
    "userId" TEXT NOT NULL,
    "loginHistoryId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "JwtSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JwtSession_jti_key" ON "JwtSession"("jti");

-- CreateIndex
CREATE INDEX "JwtSession_userId_loginHistoryId_idx" ON "JwtSession"("userId", "loginHistoryId");

-- CreateIndex
CREATE INDEX "JwtSession_jti_idx" ON "JwtSession"("jti");

-- AddForeignKey
ALTER TABLE "JwtSession" ADD CONSTRAINT "JwtSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JwtSession" ADD CONSTRAINT "JwtSession_loginHistoryId_fkey" FOREIGN KEY ("loginHistoryId") REFERENCES "LoginHistory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
