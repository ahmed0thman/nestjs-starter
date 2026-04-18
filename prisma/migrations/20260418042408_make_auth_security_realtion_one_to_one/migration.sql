/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `authSecurity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "authSecurity_userId_key" ON "authSecurity"("userId");
