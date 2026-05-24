import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserService } from 'src/domain/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { AuthCredentialsDTO } from './dto/auth-credentials.dto';
import { SignUpDTO } from './dto/sign-up.dto';
// import AppError from 'src/common/errors/app.error';
import { JwtService } from '@nestjs/jwt';
import { env } from 'src/common/config/env/env';
import AppError from 'src/common/errors/app.error';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { userValidatedSelect } from 'src/domain/user/payloads/user.payloads';
import { RCreatedUser } from 'src/domain/user/responses/created-user.response';
import { RUserFound } from 'src/domain/user/responses/user-found.response';
import { RUserValidated } from 'src/domain/user/responses/user-validated.response';
import { Prisma } from 'src/generated/prisma/client';
import { userStatus } from 'src/generated/prisma/enums';
import { RequestMetadata } from 'src/utils/request-metadata.utils';
import { AuthUtilsService } from './auth.utils.service';
import { VerifyEmailDTO } from './dto/verify-email.dto';
import { LoginHistoryService } from './login-history.service';
import {
  AuthUserPayload,
  JWTUserPayload,
  TokensPayload,
} from './payloads/auth.payload';
import { JwtPayload } from './payloads/jwt.payload';
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly ycI18nService: YcI18nService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   *
   * @param user
   * @returns
   */
  private async buildAuthUserPayload(
    user: RUserFound,
  ): Promise<AuthUserPayload> {
    const jwtUserPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role, // TODO: change later when we have roles implemented
      status: user.status as userStatus,
    } satisfies JWTUserPayload;
    const { accessToken, refreshToken } =
      await this.signInToken(jwtUserPayload);

    return { user: jwtUserPayload, token: { accessToken, refreshToken } };
  }

  /**
   * Generate authentication tokens for a user
   * @param jwtUserPayload
   * @returns
   */
  private async signInToken(
    jwtUserPayload: JWTUserPayload,
  ): Promise<TokensPayload> {
    const accessToken = await this.jwtService.signAsync(jwtUserPayload);
    const refreshToken = await this.jwtService.signAsync(jwtUserPayload, {
      expiresIn: env.JWT_REFRESH_TOKEN_EXP,
      jwtid: this.authUtilsService.genereateSecureJti(),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify if the provided plain password matches the hashed password
   * @param hashedPassword
   * @param plainPassword
   * @returns
   */
  private async verifyPassword(
    hashedPassword: string,
    plainPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(hashedPassword, plainPassword);
  }

  /**
   * handle failed login attempts by incrementing the failed attempts count and setting lockout status if necessary, also mark as suspicious if it exceeds certain threshold to indicate potential brute force attack
   * @param authSecurity
   * @param user
   * @param email
   */
  private async handleFailedLoginAttempts(
    authSecurity: RUserValidated['authSecurities'],
    user: RUserValidated,
    email: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prismaService;
    // check if the number of failed attempts has exceeded the threshold and if so, mark the user as locked for a certain period of time
    if (authSecurity.failedLoginAttempts >= env.MaxFailedLoginAttempts - 1) {
      // check if the last failed login attempt exceeds the lockout duration threshold, if so, set failed attempts count to 1, otherwise, lock the account
      if (
        authSecurity.lastFailedLogin &&
        new Date().getTime() - authSecurity.lastFailedLogin.getTime() >
          env.LockOutDurationMinutes * 60000
      ) {
        await prismaClient.authSecurity.update({
          where: { userId: user.id },
          data: {
            failedLoginAttempts: 1,
            lastFailedLogin: new Date(),
            lockoutUntil: null,
          },
        });
        this.logger.warn(
          `User ${user.id} with email ${email} has exceeded max failed login attempts but last failed attempt was outside lockout duration, resetting failed attempts count to 1`,
          'AuthService-SignIn',
        );
        throw AppError.unauthorized(
          this.ycI18nService.t('errors.invalid_credentials'),
        );
      } else {
        const lockoutUntil = new Date(
          Date.now() + env.LockOutDurationMinutes * 60000,
        );
        await prismaClient.authSecurity.update({
          where: { userId: user.id },
          data: {
            lockoutUntil,
          },
        });
        this.logger.warn(
          `User ${user.id} with email ${email} has been locked out until ${lockoutUntil.toISOString()} due to too many failed login attempts`,
          'AuthService-SignIn',
        );
        throw AppError.unauthorized(
          this.ycI18nService.t('errors.account_lockedout_until', {
            minutes: env.LockOutDurationMinutes,
          }),
        );
      }
    }
    await prismaClient.authSecurity.update({
      where: { userId: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLogin: new Date(),
      },
    });
  }

  private async createJwtSessionForUser(
    user: RUserFound,
    loginHistoryId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prismaClient = tx || this.prismaService;
    const { user: jwtUserPayload, token } =
      await this.buildAuthUserPayload(user);

    // create a JWT session in the DB with the jti
    // 1. decode the refresh token to get the jti
    const decodedRefreshToken: JwtPayload = await this.jwtService.decode(
      token.refreshToken,
      { json: true },
    );
    const jti = decodedRefreshToken.jti;
    //2. save the jti in the database with the user id and expiration time
    await prismaClient.jwtSession.create({
      data: {
        loginHistoryId,
        jti,
        userId: user.id,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });
    return { user: jwtUserPayload, token };
  }

  /**
   * atomic transaction to handle the entire sign in process including login history creation, user validation, failed login attempts handling, token generation, and jwt session creation to ensure data consistency and integrity, also
   * @param email
   * @param loginHistoryId
   * @param password
   * @returns
   */
  private async processSignInTransaction(
    email: string,
    loginHistoryId: string,
    password: string,
  ) {
    // to track the failure reason for proper error handling after the transaction';
    const result = await this.prismaService.$transaction(
      async (tx) => {
        // find user by email and select the fields needed for validation and token generation
        const user = (await tx.user.findUnique({
          where: { email },
          select: userValidatedSelect,
        })) as RUserValidated | null;

        // if user not found or incorrect password, use fake hash to prevent timing attacks
        if (!user) {
          await this.loginHistoryService.updateLoginHistoryAsFailed(
            loginHistoryId,
            'User not found',
            false,
            tx,
          );
          return { success: false, code: 'user_not_found' };
        }
        // if user found, update the login history with the user id for better tracking and analytics
        await this.loginHistoryService.updateLoginHistoryWithUserId(
          loginHistoryId,
          user.id,
          tx,
        );
        // get auth security details for the user to check for lockout status and failed login attempts
        const authSecurity = user.authSecurities;

        // check if locked out and if so, prevent login and inform user of lockout status and remaining lockout duration
        if (
          authSecurity.lockoutUntil &&
          authSecurity.lockoutUntil > new Date()
        ) {
          const remainingLockoutMinutes = Math.ceil(
            (authSecurity.lockoutUntil.getTime() - new Date().getTime()) /
              60000,
          );
          this.logger.warn(
            `Locked out login attempt for user ${user.id} with email ${email}. Remaining lockout duration: ${remainingLockoutMinutes} minutes`,
            'AuthService-SignIn',
          );
          return { success: false, code: 'account_lockedout_until' };
        }

        // if locked out but lockout duration has passed, reset lockout status and failed login attempts
        if (
          authSecurity.lockoutUntil &&
          authSecurity.lockoutUntil <= new Date()
        ) {
          // TODO: we can optimize this by having a scheduled job that runs every minute to reset lockout status for all users whose lockout duration has passed instead of checking this on every login attempt which can be costly if we have a large number of users
          await tx.authSecurity.update({
            where: { userId: user.id },
            data: {
              failedLoginAttempts: 0,
              lockoutUntil: null,
            },
          });
        }

        const isPasswordValid = await this.verifyPassword(
          user.password,
          password,
        );
        if (!isPasswordValid) {
          await this.loginHistoryService.updateLoginHistoryAsFailed(
            loginHistoryId,
            'Invalid password',
            false,
            tx,
          );

          await this.handleFailedLoginAttempts(authSecurity, user, email, tx);
          return { success: false, code: 'invalid_credentials' };
        }

        // if user is found but not verified, throw an error
        if (!user.verified) {
          await this.loginHistoryService.updateLoginHistoryAsFailed(
            loginHistoryId,
            'Account not verified',
            false,
            tx,
          );
          await this.handleFailedLoginAttempts(authSecurity, user, email, tx);
          return { success: false, code: 'account_not_verified' };
        }

        // if user is not active, throw an error
        if (user.status !== 'ACTIVE') {
          await this.loginHistoryService.updateLoginHistoryAsFailed(
            loginHistoryId,
            'User not active',
            false,
            tx,
          );
          await this.handleFailedLoginAttempts(authSecurity, user, email, tx);
          return { success: false, code: 'account_not_active' };
        }

        // if all checks pass, reset failed login attempts and lockout status
        await tx.authSecurity.update({
          where: { userId: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null,
            lastLogin: new Date(),
          },
        });

        // then update the login history as successful
        await this.loginHistoryService.updateLoginHistoryAsSuccess(
          loginHistoryId,
          tx,
        );

        // generate tokens and JWT payload
        const jwtSessionData = await this.createJwtSessionForUser(
          user,
          loginHistoryId,
          tx,
        );

        return { success: true, data: jwtSessionData };
      },
      { isolationLevel: 'Serializable' },
    );

    if (!result.success) {
      switch (result.code) {
        case 'user_not_found':
          await argon2.verify(env.FAKE_HASHED_PASSWORD, password);
          throw AppError.unauthorized(
            this.ycI18nService.t('errors.invalid_credentials'),
          );
        case 'account_lockedout_until':
          throw AppError.unauthorized(
            this.ycI18nService.t('errors.account_lockedout_until', {
              args: { minutes: env.LockOutDurationMinutes },
            }),
          );
        case 'account_not_verified':
          throw AppError.unauthorized(
            this.ycI18nService.t('errors.account_not_verified', {
              args: { email: this.authUtilsService.secrtizeEmail(email) },
            }),
          );
        case 'account_not_active':
          throw AppError.unauthorized(
            this.ycI18nService.t('messages.account.deactivated'),
          );
        default:
          await argon2.verify(env.FAKE_HASHED_PASSWORD, password);
          throw AppError.unauthorized(
            this.ycI18nService.t('errors.invalid_credentials'),
          );
      }
    }
    return result.data as AuthUserPayload;
  }

  /**
   * Sign up a new user
   * @param signUpDto
   * @returns
   */
  async signUp(signUpDto: SignUpDTO): Promise<RCreatedUser> {
    const { user, verificationSecret, emailHistoryId } =
      await this.userService.createUser(signUpDto);
    const fullName = `${user.firstName} ${user.lastName}`;
    try {
      this.logger.log(
        `Sending verification email to ${this.authUtilsService.secrtizeEmail(user.email)}`,
        'AuthService-signUp',
      ); // log the email being sent without exposing the full email
      await this.mailService.sendVerificationEmail(
        user.email,
        user.id,
        fullName,
        verificationSecret,
      );
      this.logger.log(
        `Verification email sent to ${this.authUtilsService.secrtizeEmail(user.email)}`,
        'AuthService-signUp',
      );

      await this.userService.updateEmailHistoryStatus(emailHistoryId, 'sent');
    } catch (error) {
      // TODO: handle email failuer using kafka
      // for now we will just log the error and move on
      this.logger.error(
        'Failed to send verification email',
        String(error),
        'AuthService-signUp',
      );
      await this.userService.updateEmailHistoryStatus(emailHistoryId, 'failed');
    }
    return user;
  }

  /**
   * Sign in a user
   * @param authCredentials
   * @returns
   */
  async signIn(
    authCredentials: AuthCredentialsDTO,
    requestMeta: RequestMetadata,
  ): Promise<AuthUserPayload> {
    const { email, password } = authCredentials;
    // TODO: check rate limit in Redis for ip address + device + user agent and block if exceeds certain threshold to prevent brute force attacks
    // create initial loginHistory record for this IP

    const loginHistoryId = await this.loginHistoryService.createLoginHistory(
      requestMeta,
      null,
      false,
    );
    // handle failure attempt from unknown Suspicious source
    if (!email || !password) {
      await this.loginHistoryService.updateLoginHistoryAsFailed(
        loginHistoryId,
        'Missing email or password in login attempt and this shouldnt happen due to validation pipe, this indicates a potential attack from an unknown source',
        true,
      );
      // use a fake hash verification to mitigate timing attacks
      await argon2.verify(env.FAKE_HASHED_PASSWORD, env.FAKE_PASSWORD);
      throw AppError.badRequest(
        this.ycI18nService.t('errors.invalid_credentials'),
      );
    }

    // ==== EVERYTHING BELOW IS ATOMIC SERIALIZABLE TRANSACTION ====

    const transactionResult = await this.processSignInTransaction(
      email,
      loginHistoryId,
      password,
    );

    return transactionResult;
  }

  /**
   * Refresh user tokens
   * @param refreshToken
   * @returns
   */
  async refreshTokens(refreshToken: string): Promise<AuthUserPayload> {
    // 1. verify the refresh token
    const payload: JwtPayload = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: env.JWT_SECRET,
      },
    );

    // TODO: fetch user from redis cache
    // find the user by id from token payload
    const user = await this.userService.findUserById(payload.sub);

    // if user not active for any reason then throw an error to prevent token refresh
    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden(
        this.ycI18nService.t('messages.account.deactivated'),
      );
    }

    // TODO: remove throw from the transaction and return transaction result instead
    const transactionResult = await this.prismaService.$transaction(
      async (tx) => {
        // TODO: check if the jti is blacklisted in redis, if yes then invalidate all tokens for this user and force re-login
        // TODO: handle token reuse detection by checking if the old jti is used again, if yes then invalidate all sessions for this user and force re-login
        // 2. check if the jti is valid and not blacklisted in the database
        const jwtSession = await tx.jwtSession.findUnique({
          where: { jti: payload.jti },
          select: { isValid: true, expiresAt: true, loginHistoryId: true },
        });

        // 3. if not found or not valid then invalidate the session and force re-login
        if (!jwtSession || !jwtSession.isValid) {
          //  TODO: invalidate all sessions for this user in the database and force re-login
          throw AppError.unauthorized(
            this.ycI18nService.t('errors.invalid_token'),
          );
        }

        // 4. if valid but expired then mark the session as invalid and force re-login
        if (jwtSession.expiresAt < new Date()) {
          await tx.jwtSession.update({
            where: { jti: payload.jti },
            data: { isValid: false },
          });
          throw AppError.unauthorized(
            this.ycI18nService.t('errors.token_expired'),
          );
        }
        // TODO: set old refresh token as blacklisted in redis and with same expiration

        // 5. if all checks pass then generate new jwtSession with the new jti and expiration time and update the current session to be invalid
        await tx.jwtSession.update({
          where: { jti: payload.jti },
          data: { isValid: false },
        });

        const jwtSessionData = await this.createJwtSessionForUser(
          user,
          jwtSession.loginHistoryId,
          tx,
        );
        //  TODO: add new jti to redis with expiration time same as the refresh token
        // TODO: add new access token to redis and set expiration time same as the access token for quick invalidation, blacklist the old accessTokens in redis until they expire
        return jwtSessionData;
      },
      { isolationLevel: 'Serializable' },
    );

    return transactionResult;
  }

  /**
   * Verify user's email address
   * @param verifyEmailDTO
   */
  async verifyEmail(verifyEmailDTO: VerifyEmailDTO): Promise<void> {
    const { emailHistoryId, user } =
      await this.userService.verifyEmail(verifyEmailDTO);

    // send verification success email
    try {
      this.logger.log(
        `Sending welcome email to ${this.authUtilsService.secrtizeEmail(user.email)}`,
        'AuthService-verifyEmail',
      ); // log the email being sent without exposing the full email
      await this.mailService.sendWelcomeEmail(user.email, user.firstName);
      this.logger.log(
        `Welcome email sent to ${this.authUtilsService.secrtizeEmail(user.email)}`,
        'AuthService-verifyEmail',
      );

      // update email history status to sent
      await this.userService.updateEmailHistoryStatus(emailHistoryId, 'sent');
    } catch (error) {
      this.logger.error(
        'Failed to send welcome email',
        String(error),
        'AuthService-verifyEmail',
      );
      // update email history status to failed
      await this.userService.updateEmailHistoryStatus(emailHistoryId, 'failed');
    }
  }
}
