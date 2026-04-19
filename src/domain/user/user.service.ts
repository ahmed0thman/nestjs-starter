import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/common/services/prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import AppError from 'src/common/errors/app.error';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { env } from 'src/common/config/env/env';
import { AuthUtilsService } from 'src/common/services/auth.utils.service';
import { email_status, email_type } from 'src/generated/prisma/enums';
import { VerifyEmailDTO } from 'src/auth/dto/verify-email.dto';
import { AppConfig } from 'src/common/config/app.config';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ycI18nService: YcI18nService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly logger: AppLoggerService,
  ) {}

  private createRandomInitialUserName(
    firstname: string,
    lastname?: string,
  ): string {
    // generate timestamp prefix in ms to ensure uniqueness in base36 to make it shorter
    const timestampPrefix = Date.now().toString(36); // length will be 8 characters
    // generate random 4 letter prefix
    // const prefix = Math.random().toString(36).substring(2, 6);
    // generate random 4 letter suffix
    const suffix = Math.random().toString(36).substring(2, 6);
    // generate random separator from [_,-,:,$,%,.,=,~]
    const separators = ['_', '-', ':', '$', '%', '.', '=', '~'];
    const separatorPrefix =
      separators[Math.floor(Math.random() * separators.length)];
    const separatorSuffix =
      separators[Math.floor(Math.random() * separators.length)];
    // combine them to create the username
    return `${timestampPrefix}${separatorPrefix}${firstname}${lastname ? separatorSuffix + lastname : ''}${separatorSuffix}${suffix}`;
  }

  private async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  async findUserById(id: string) {
    return await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        status: true,
        verified: true,
        authSecurities: {
          select: {
            lastPasswordChange: true,
          },
        },
      },
    });
  }

  async validateUser(email: string, password: string) {
    if (!email)
      throw AppError.badRequest(
        this.ycI18nService.t('errors.invalid_credentials'),
      );
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        password: true,
        role: true,
        status: true,
        verified: true,
        authSecurities: {
          select: {
            id: true,
            failedLoginAttempts: true,
            lastFailedLogin: true,
            lockoutUntil: true,
            lastPasswordChange: true,
            mfaEnabled: true,
            mfaMethod: true,
          },
        },
      },
    });

    // if user not found or incorrect password, use fake hash to prevent timing attacks
    if (!user || !(await this.verifyPassword(user.password, password))) {
      await argon2.verify(env.FAKE_HASHED_PASSWORD, password);
      throw AppError.unauthorized(
        this.ycI18nService.t('errors.invalid_credentials'),
      );
    }

    // if user is found but not verified, throw an error
    if (!user.verified) {
      throw AppError.unauthorized(
        this.ycI18nService.t('errors.account_not_verified'),
      );
    }

    // if user is found but not active, throw an error
    if (user.status !== 'ACTIVE') {
      throw AppError.unauthorized(
        this.ycI18nService.t('messages.account.account_locked'),
      );
    }

    // TODO: implement login history and failed login attempts tracking for account lockout and security monitoring

    return user;
  }

  // return selected fields id, email, firstName, lastName, username
  async createUser(createUserDto: CreateUserDTO) {
    const { email, password, firstName, lastName, providerId } = createUserDto;
    const username = this.createRandomInitialUserName(firstName, lastName);
    const verificationSecret =
      this.authUtilsService.generateEmailVerificationCode();
    const hashedVerificationSecret =
      this.authUtilsService.hashToken(verificationSecret);
    const currentDate = new Date(); // use constant currentDate to ensure the same value is used for both the authSecurity and emailHistory records
    const [user, emailHistoryId] = await this.prismaService.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: await this.hashPassword(password),
            firstName,
            lastName,
            username,
            providerId,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        });
        await tx.authSecurity.create({
          data: {
            userId: user.id,
            sentVerificationEmailAttempts: 1,
            lastVerificationEmailSentAt: currentDate, // current timestamp
            verificationSecret: hashedVerificationSecret,
          },
        });
        const emailHistory = await tx.emailHistory.create({
          data: {
            authId: user.id,
            emailTo: user.email,
            emailType: email_type.verification,
            emailStatus: email_status.pending,
            subject: 'Verify your email address',
            messageId: `verify-${user.id}`, // generate a unique message ID
            sentAt: currentDate, // current timestamp
          },
          select: {
            id: true,
          },
        });
        return [user, emailHistory.id] as const;
      },
    );
    return { user, verificationSecret, emailHistoryId };
  }

  // update email history status to sent or failed
  async updateEmailHistoryStatus(emailHistoryId: string, status: email_status) {
    await this.prismaService.emailHistory.update({
      where: { id: emailHistoryId },
      data: {
        emailStatus: status,
      },
    });
  }

  async verifyEmail(verifyEmailDTO: VerifyEmailDTO) {
    const { userId, secret } = verifyEmailDTO;
    const hashedSecret = this.authUtilsService.hashToken(secret);

    // find the auth security record for the user and the provided secret
    const authSecurity = await this.prismaService.authSecurity.findUnique({
      where: { userId, verificationSecret: hashedSecret },
      select: {
        verificationSecretStatues: true,
        lastVerificationEmailSentAt: true,
      },
    });

    // if no record found or the secret is not fresh, throw an error
    if (!authSecurity || authSecurity.verificationSecretStatues !== 'fresh') {
      throw AppError.badRequest(
        this.ycI18nService.t('errors.invalid_verification_token'),
      );
    }

    // if the secret is fresh but the last sent email was more than the expiration time, mark the secret as expired and throw an error
    const currentTime = new Date().getTime();
    const lastSentTime = new Date(
      authSecurity.lastVerificationEmailSentAt as Date,
    ).getTime();
    if (
      authSecurity.lastVerificationEmailSentAt &&
      // check if the last sent time is older than the expiration time
      lastSentTime < currentTime - AppConfig.emailValidationSecretExpiration
    ) {
      this.logger.error(
        `Verification attempt with expired secret for user ${userId} \n Last sent at: ${lastSentTime} \n Current time: ${currentTime} `,
        '',
        'AuthService-verifyEmail',
      );
      await this.prismaService.authSecurity.update({
        where: { userId },
        data: {
          verificationSecretStatues: 'expired',
        },
      });
      throw AppError.badRequest(
        this.ycI18nService.t('errors.invalid_verification_token'),
      );
    }

    const [emailHistoryId, user] = await this.prismaService.$transaction(
      async (tx) => {
        // if the secret is valid, mark the user as verified and update the secret status to used
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            verified: true,
            status: 'ACTIVE', // activate the user upon successful verification
          },
          select: { email: true, firstName: true },
        });
        await tx.authSecurity.update({
          where: { userId },
          data: {
            verificationSecretStatues: 'used',
          },
        });
        // update the email history record for this verification email to sent
        const updatedEmailHistory = await tx.emailHistory.update({
          where: {
            emailType: email_type.verification,
            authId_messageId_sentAt: {
              authId: userId,
              sentAt: authSecurity.lastVerificationEmailSentAt as Date,
              messageId: `verify-${userId}`,
            },
          },
          data: {
            emailStatus: email_status.clicked, // mark the email as clicked since the user clicked the link in the email to verify
          },
          select: {
            emailTo: true,
          },
        });

        // insert successful verification email history record that will be sent to the user after successful verification
        const welcomeEmailHistory = await tx.emailHistory.create({
          data: {
            authId: userId,
            emailTo: updatedEmailHistory.emailTo,
            emailType: email_type.notification,
            emailStatus: email_status.pending,
            subject: 'Welcome to your new AI-native workspace',
            messageId: `welcome-${userId}}`, // generate a unique message ID
            sentAt: new Date(), // current timestamp
          },
        });

        return [welcomeEmailHistory.id, user] as const;
      },
    );

    return { emailHistoryId, user };
  }
}
