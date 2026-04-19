import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthUtilsService {
  constructor() {}
  // Obfuscate email for logging and error messages to avoid exposing user emails in logs
  secrtizeEmail(email: string) {
    const [localPart, domain] = email.split('@');
    const hiddenLocalPart =
      localPart[0] +
      '***' +
      localPart.slice(localPart.length - 2, localPart.length);
    return `${hiddenLocalPart}@${domain}`;
  }

  // Generate a secure JTI (JWT ID) using UUID v7
  genereateSecureJti(): string {
    // generate uuid v7
    return uuidv7();
  }

  //   Generate a secure email verification 6-digit code
  generateEmailVerificationCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6); // Generates a 6-character hexadecimal code
  }

  //   generate hashed tokens for (refresh jti, email verification code, password reset, OTP secrets, etc.) not using argon2 since we don't need to verify them, we just need to compare the hashes, so we can use a faster hashing algorithm like SHA-256
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
