import { Inject, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthUtilsService } from 'src/auth/auth.utils.service';
import { VerifyEmailDTO } from 'src/auth/dto/verify-email.dto';
import { AppConfig } from 'src/common/config/app.config';
import AppError from 'src/common/errors/app.error';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { email_status, email_type } from 'src/generated/prisma/enums';
import { CreateUserDTO } from './dto/create-user.dto';
import { userValidatedSelect } from './payloads/user.payloads';
import { RCreatedUser } from './responses/created-user.response';
import { RUserFound } from './responses/user-found.response';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ycI18nService: YcI18nService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly logger: AppLoggerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

  /**
   * Hash a plain password
   * @param password
   * @returns
   */
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  /**
   * Find a user by their ID
   * @param id
   * @returns
   */
  async findUserById(id: string): Promise<RUserFound> {
    // check cache first
    const cachedUser = await this.cacheManager.get<RUserFound>(`user:${id}`);
    // if cache hit, return the cached user
    if (cachedUser) {
      this.logger.log(
        `User with id ${id} found in cache`,
        'UserService-findUserById',
      );
      return cachedUser;
    }

    // if cache miss, fetch from database, cache it, and return the user
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: userValidatedSelect,
    });
    // if user not found, throw an error without caching the result
    if (!user)
      throw AppError.notFound(this.ycI18nService.t('errors.user_not_found'));

    this.logger.log(
      `User with id ${id} fetched from database and cached`,
      'UserService-findUserById',
    );
    await this.cacheManager.set(`user:${id}`, user, 5 * 60000); // cache for 5 minutes
    return user as RUserFound;
  }

  /**
   * Create a new user
   * @param createUserDto
   * @returns
   */
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
        const user = (await tx.user.create({
          data: {
            email,
            password: await this.hashPassword(password),
            firstName,
            lastName,
            username,
            providerId,
            roleId: 1, // TODO: change later when we have roles implemented
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        })) as RCreatedUser;
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

  /**
   * Update the status of an email history record
   * @param emailHistoryId
   * @param status
   * @returns
   */
  async updateEmailHistoryStatus(emailHistoryId: string, status: email_status) {
    await this.prismaService.emailHistory.update({
      where: { id: emailHistoryId },
      data: {
        emailStatus: status,
      },
    });
  }

  /**
   * Verify a user's email address
   * @param verifyEmailDTO
   * @returns
   */
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
