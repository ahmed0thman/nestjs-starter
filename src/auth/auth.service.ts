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
@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  secrtizeEmail(email: string) {
    const [localPart, domain] = email.split('@');
    const hiddenLocalPart =
      localPart[0] +
      '***' +
      localPart.slice(localPart.length - 2, localPart.length);
    return `${hiddenLocalPart}@${domain}`;
  }

  private async signInToken(
    userPayload: IUserPayload,
  ): Promise<ITokensPayload> {
    const accessToken = await this.jwtService.signAsync(userPayload);
    const refreshToken = await this.jwtService.signAsync(userPayload, {
      expiresIn: env.JWT_REFRESH_TOKEN_EXP as undefined,
      jwtid: crypto.randomUUID(), // Generate a unique identifier for the refresh token
    });

    return { accessToken, refreshToken };
  }

  async signUp(signUpDto: SignUpDTO) {
    const user = await this.userService.createUser(signUpDto);
    const fullName = `${user.firstName} ${user.lastName}`;
    await this.mailService.sendWelcomeEmail(user.email, fullName);
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
}
