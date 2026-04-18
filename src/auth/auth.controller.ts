import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { CreatedUserDTO } from 'src/domain/user/dto/created-user.dto';
import { IResponse } from 'src/common/interceptors/response-transformer.interceptor';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { AuthCredentialsDTO } from './dto/auth-credentials.dto';
import { type Response } from 'express';
import { IUserPayload } from './interfaces/auth.interface';
import { env } from 'src/common/config/env/env';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  @Post('/sign-up')
  async signUp(
    @Body() signUpDTO: SignUpDTO,
  ): Promise<IResponse<CreatedUserDTO>> {
    const user = await this.authService.signUp(signUpDTO);
    return {
      message: this.ycI18nService.t('messages.account.verify_email', {
        args: { email: this.authService.secrtizeEmail(user.email) },
      }),
      data: user,
    };
  }

  @Post('/sign-in')
  async signIn(
    @Body() authCredentials: AuthCredentialsDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IResponse<IUserPayload>> {
    const data = await this.authService.signIn(authCredentials);
    const isProduction = env.NODE_ENV === 'production';
    // Set the refresh token as an HTTP-only cookie
    res.cookie('refreshToken', data.token.refreshToken, {
      httpOnly: true,
      secure: isProduction, // Set to true if using HTTPS
      sameSite: 'strict', // Adjust based on your needs (e.g., 'Lax' or 'None')
      maxAge:
        +(env.JWT_REFRESH_TOKEN_EXP as string).slice(0, -1) *
        24 *
        60 *
        60 *
        1000, // 7 days
    });
    // Set the acces token in cookies for 15 minutes
    res.cookie('accessToken', data.token.accessToken, {
      httpOnly: true,
      secure: isProduction, // Set to true if using HTTPS
      sameSite: 'strict', // Adjust based on your needs (e.g., 'Lax' or 'None')
      maxAge: +(env.JWT_ACCESS_TOKEN_EXP as string).slice(0, -1) * 1000, // Adjust based on your needs
    });
    return {
      message: this.ycI18nService.t('messages.account.login'),
      data: data.user,
    };
  }
}
