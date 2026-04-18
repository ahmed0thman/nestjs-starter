-- AlterTable
ALTER TABLE "authSecurity" ADD COLUMN     "sentMfaSecretAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentVerificationEmailAttempts" INTEGER NOT NULL DEFAULT 0;

Alter table "authSecurity" ADD CONSTRAINT "sentMfaSecretAttempts" CHECK ("sentMfaSecretAttempts" >= 0 AND "sentMfaSecretAttempts" <= 3);
Alter table "authSecurity" ADD CONSTRAINT "sentVerificationEmailAttempts" CHECK ("sentVerificationEmailAttempts" >= 0 AND "sentVerificationEmailAttempts" <= 3);
Alter table "authSecurity" ADD CONSTRAINT 
"failedLoginAttempts" CHECK ("failedLoginAttempts" >= 0 AND "failedLoginAttempts" <= 5);
