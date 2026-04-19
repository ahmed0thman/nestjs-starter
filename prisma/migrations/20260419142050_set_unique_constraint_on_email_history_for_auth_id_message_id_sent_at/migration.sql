/*
  Warnings:

  - A unique constraint covering the columns `[authId,messageId,sentAt]` on the table `EmailHistory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EmailHistory_authId_messageId_sentAt_key" ON "EmailHistory"("authId", "messageId", "sentAt");
