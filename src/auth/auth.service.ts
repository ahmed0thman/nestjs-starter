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
  IUserPayload,
  ITokensPayload,
  IAuthUser,
} from './interfaces/auth.interface';
import { AuthUtilsService } from '../common/services/auth.utils.service';
import { AppLoggerService } from 'src/common/modules/logger/logger.service';
import { VerifyEmailDTO } from './dto/verify-email.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly ycI18nService: YcI18nService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly logger: AppLoggerService,
  ) {}

  private async signInToken(
    userPayload: IUserPayload,
  ): Promise<ITokensPayload> {
    const accessToken = await this.jwtService.signAsync(userPayload);
    const refreshToken = await this.jwtService.signAsync(userPayload, {
      expiresIn: env.JWT_REFRESH_TOKEN_EXP as undefined,
      jwtid: this.authUtilsService.genereateSecureJti(),
    });

    return { accessToken, refreshToken };
  }

  async signUp(signUpDto: SignUpDTO) {
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

  async signIn(authCredentials: AuthCredentialsDTO): Promise<IAuthUser> {
    const { email, password } = authCredentials;
    const user = await this.userService.validateUser(email, password);

    const userPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      status: user.status,
    } satisfies IUserPayload;
    const { accessToken, refreshToken } = await this.signInToken(userPayload);

    return { user: userPayload, token: { accessToken, refreshToken } };
  }

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
