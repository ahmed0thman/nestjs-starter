/*
  Warnings:

  - You are about to drop the column `GeoCity` on the `LoginHistory` table. All the data in the column will be lost.
  - You are about to drop the column `GeoLatitude` on the `LoginHistory` table. All the data in the column will be lost.
  - You are about to drop the column `GeoLongitude` on the `LoginHistory` table. All the data in the column will be lost.
  - You are about to drop the column `device_id` on the `LoginHistory` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "LoginHistory_device_id_idx";

-- AlterTable
ALTER TABLE "LoginHistory" DROP COLUMN "GeoCity",
DROP COLUMN "GeoLatitude",
DROP COLUMN "GeoLongitude",
DROP COLUMN "device_id",
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "geoCity" TEXT,
ADD COLUMN     "geoLatitude" DOUBLE PRECISION,
ADD COLUMN     "geoLongitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "LoginHistory_deviceId_idx" ON "LoginHistory"("deviceId");
