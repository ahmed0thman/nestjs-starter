-- CreateEnum
CREATE TYPE "email_type" AS ENUM ('verification', 'password_reset', 'notification');

-- CreateEnum
CREATE TYPE "email_provider" AS ENUM ('sendgrid', 'mailgun', 'ses', 'smtp');

-- CreateEnum
CREATE TYPE "email_status" AS ENUM ('sent', 'failed', 'pending', 'bounced', 'delivered', 'opened', 'clicked');

-- CreateTable
CREATE TABLE "EmailHistory" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "emailTo" TEXT NOT NULL,
    "emailType" "email_type" NOT NULL,
    "subject" TEXT NOT NULL,
    "emailProvider" "email_provider",
    "messageId" TEXT NOT NULL,
    "emailStatus" "email_status" NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailHistory_authId_idx" ON "EmailHistory"("authId");

-- CreateIndex
CREATE INDEX "EmailHistory_emailTo_idx" ON "EmailHistory"("emailTo");

-- CreateIndex
CREATE INDEX "EmailHistory_sentAt_idx" ON "EmailHistory"("sentAt");

-- CreateIndex
CREATE INDEX "EmailHistory_messageId_idx" ON "EmailHistory"("messageId");

-- AddForeignKey
ALTER TABLE "EmailHistory" ADD CONSTRAINT "EmailHistory_authId_fkey" FOREIGN KEY ("authId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
