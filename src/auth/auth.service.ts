import { Injectable } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/domain/user/user.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { AuthCredentialsDTO } from './dto/auth-credentials.dto';
// import AppError from 'src/common/errors/app.error';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { JwtService } from '@nestjs/jwt';
import { env } from 'src/common/config/env/env';
import {
  JWTUserPayload,
  TokensPayload,
  AuthUserPayload,
} from './payloads/auth.payload';
import { AuthUtilsService } from '../common/services/auth.utils.service';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { VerifyEmailDTO } from './dto/verify-email.dto';
import { RCreatedUser } from 'src/domain/user/responses/created-user.response';
import { userStatus } from 'src/generated/prisma/enums';
import { JwtPayload } from './payloads/jwt.payload';
import { RUserFound } from 'src/domain/user/responses/user-found.response';
import AppError from 'src/common/errors/app.error';
import { PrismaService } from 'src/common/services/prisma.service';
import { RequestMetadata } from 'src/utils/request-metadata.utils';
@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly ycI18nService: YcI18nService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly logger: AppLoggerService,
    private readonly prismaService: PrismaService,
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
      expiresIn: env.JWT_REFRESH_TOKEN_EXP as undefined,
      jwtid: this.authUtilsService.genereateSecureJti(),
    });

    return { accessToken, refreshToken };
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
    const user = await this.userService.validateUser(email, password);

    const { user: jwtUserPayload, token } =
      await this.buildAuthUserPayload(user);
    // TODO: implement login history and failed login attempts tracking for account lockout and security monitoring
    // create a login history
    console.log({ requestMeta });
    const loginHistory = await this.prismaService.loginHistory.create({
      data: {
        userId: user.id,
        action: 'login',
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        // device: requestMeta.device,
        deviceId: requestMeta.deviceId,
        geoCountry: requestMeta.geoCountry,
        geoCity: requestMeta.geoCity,
        geoLatitude: Number(requestMeta.geoLatitude),
        geoLongitude: Number(requestMeta.geoLongitude),
        success: true,
        // isSecure: requestMeta.isSecure,
      },
      select: {
        id: true,
      },
    });

    // create a JWt session in the DB with the jti
    // decode the refresh token to get the jti
    const decodedRefreshToken: JwtPayload = await this.jwtService.decode(
      token.refreshToken,
      { json: true },
    );
    const jti = decodedRefreshToken.jti;
    // save the jti in the database with the user id and expiration time
    await this.prismaService.jwtSession.create({
      data: {
        loginHistoryId: loginHistory.id,
        jti,
        userId: user.id,
        expiresAt: new Date(decodedRefreshToken.exp * 1000),
      },
    });
    return { user: jwtUserPayload, token };
  }

  /**
   * Refresh user tokens
   * @param refreshToken
   * @returns
   */
  async refreshTokens(refreshToken: string): Promise<AuthUserPayload> {
    const payload: JwtPayload = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: env.JWT_SECRET,
      },
    );
    // TODO: invalidate old refresh in the database
    // TODO: set old refresh token as blacklisted in redis and with same expiration
    // TODO: handle token reuse detection and refresh token rotation

    // TODO: check if the jti is blacklisted in redis, if yes then invalidate all tokens for this user and force re-login

    // TODO: add new session in the database with new jti
    //  TODO: add new jti to redis with expiration time same as the refresh token
    const user = await this.userService.findUserById(payload.sub);
    if (user.status !== 'ACTIVE') {
      throw AppError.forbidden(
        this.ycI18nService.t('messages.account.deactivated'),
      );
    }
    return await this.buildAuthUserPayload(user);
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
