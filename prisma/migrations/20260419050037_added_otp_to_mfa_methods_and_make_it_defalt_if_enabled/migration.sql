-- AlterEnum
ALTER TYPE "mfaMethod" ADD VALUE 'otp';

-- Commit the enum change before altering the table
COMMIT;

-- AlterTable
ALTER TABLE "authSecurity" ALTER COLUMN "mfaMethod" SET DEFAULT 'otp';
