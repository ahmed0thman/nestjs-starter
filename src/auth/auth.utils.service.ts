import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthUtilsService {
  constructor() {}
  /**
   * Obfuscate email for logging and error messages to avoid exposing user emails in logs
   * @param email
   * @returns
   */
  secrtizeEmail(email: string) {
    const [localPart, domain] = email.split('@');
    const hiddenLocalPart =
      localPart[0] +
      '***' +
      localPart.slice(localPart.length - 2, localPart.length);
    return `${hiddenLocalPart}@${domain}`;
  }

  /**
   * Generate a secure JTI (JWT ID) using UUID v7
   * @returns
   */
  genereateSecureJti(): string {
    // generate uuid v7
    return uuidv7();
  }

  /**
   * Generate a secure email verification 6-digit code
   * @returns
   */
  generateEmailVerificationCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6); // Generates a 6-character hexadecimal code
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
