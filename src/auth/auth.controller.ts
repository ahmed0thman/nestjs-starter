import { Body, Controller, Patch, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { RCreatedUser } from 'src/domain/user/responses/created-user.response';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { AuthCredentialsDTO } from './dto/auth-credentials.dto';
import { type Response } from 'express';
import { IUserPayload } from './interfaces/auth.interface';
import { env } from 'src/common/config/env/env';
import { Public } from 'src/common/decorators/public-route.decorator';
import { AuthUtilsService } from 'src/common/services/auth.utils.service';
import { VerifyEmailDTO } from './dto/verify-email.dto';
import { ApiSuccessResponse } from 'src/common/api-response/success.response';
import { ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponseDecorator } from 'src/common/decorators/api-response.decorators';
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiSuccessResponseDecorator(201, 'User created successfully', RCreatedUser)
  @Public()
  @Post('/sign-up')
  async signUp(
    @Body() signUpDTO: SignUpDTO,
  ): Promise<ApiSuccessResponse<RCreatedUser>> {
    const user = await this.authService.signUp(signUpDTO);
    return {
      message: this.ycI18nService.t('messages.account.verify_email', {
        args: { email: this.authUtilsService.secrtizeEmail(user.email) },
      }),
      data: user,
    };
  }

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiSuccessResponseDecorator(200, 'User signed in successfully', IUserPayload)
  @Public()
  @Post('/sign-in')
  async signIn(
    @Body() authCredentials: AuthCredentialsDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<IUserPayload>> {
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

  // Verify email
  @ApiOperation({ summary: 'Verify email address' })
  @ApiSuccessResponseDecorator(200, 'Email verified successfully')
  @Public()
  @Patch('verify-email')
  async verifyEmail(
    @Body() verifyEmailDTO: VerifyEmailDTO,
  ): Promise<ApiSuccessResponse> {
    await this.authService.verifyEmail(verifyEmailDTO);
    return {
      message: this.ycI18nService.t('messages.account.verified'),
    };
  }

  // Verify email
  // @Public()
  // @Get('verify-email')
  // async verifyEmail(
  //   @Query('userId') userId: string,
  //   @Query('secret') secret: string,
  //   @Res() res: Response,
  // ) {
  //   res.send(await this.authService.verifyEmail(userId, secret));
  // }
}
