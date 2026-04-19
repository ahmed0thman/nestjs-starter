-- CreateEnum
CREATE TYPE "verification_secret_status" AS ENUM ('fresh', 'used', 'expired');
commit;

-- AlterTable
ALTER TABLE "EmailHistory" ALTER COLUMN "emailProvider" SET DEFAULT 'smtp',
ALTER COLUMN "emailStatus" SET DEFAULT 'pending';

-- AlterTable
ALTER TABLE "authSecurity" ADD COLUMN     "verificationSecretStatues" "verification_secret_status" DEFAULT 'fresh';
