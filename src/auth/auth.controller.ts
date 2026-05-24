import { Body, Controller, Patch, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { RCreatedUser } from 'src/domain/user/responses/created-user.response';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';
import { AuthCredentialsDTO } from './dto/auth-credentials.dto';
import { type Request, type Response } from 'express';
import { JWTUserPayload, TokensPayload } from './payloads/auth.payload';
import { env } from 'src/common/config/env/env';
import { Public } from 'src/common/decorators/public-route.decorator';
import { AuthUtilsService } from 'src/auth/auth.utils.service';
import { VerifyEmailDTO } from './dto/verify-email.dto';
import { ApiSuccessResponse } from 'src/common/api-response/success.response';
import { ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponseDecorator } from 'src/common/decorators/api-response.decorators';
import { cookieExtractor } from 'src/utils/cookies.utils';
import { RequestMetadata } from 'src/utils/request-metadata.utils';
@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authUtilsService: AuthUtilsService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  /**
   * Inject authentication tokens into HTTP-only cookies
   * @param res
   * @param tokens
   */
  private setTokensOnCookies(res: Response, tokens: TokensPayload) {
    const isProduction = env.NODE_ENV === 'production';
    // Set the refresh token as an HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
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
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction, // Set to true if using HTTPS
      sameSite: 'strict', // Adjust based on your needs (e.g., 'Lax' or 'None')
      maxAge: +(env.JWT_ACCESS_TOKEN_EXP as string).slice(0, -1) * 1000 * 60, // 15 minutes
    });
  }

  /**
   * Sign up a new user
   * @param signUpDTO
   * @returns
   */
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

  /**
   * Sign in a user
   * @param authCredentials
   * @param res
   * @returns
   */

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiSuccessResponseDecorator(
    200,
    'User signed in successfully',
    JWTUserPayload,
  )
  @Public()
  @Post('/sign-in')
  async signIn(
    @Body() authCredentials: AuthCredentialsDTO,
    @Req() req: Request & { metadata: RequestMetadata },
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<JWTUserPayload>> {
    console.log({
      ip: req.ip,
      headers: req.headers,
      remoteAddress: req.socket.remoteAddress,
    });
    const meta = req.metadata;
    const data = await this.authService.signIn(authCredentials, meta);
    this.setTokensOnCookies(res, data.token);
    return {
      message: this.ycI18nService.t('messages.account.login'),
      data: data.user,
    };
  }

  /**
   * Verify a user's email address
   * @param verifyEmailDTO
   * @returns
   */
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

  /**
   *
   * @param res
   * @returns
   */
  @ApiOperation({ summary: 'Refresh authentication tokens' })
  @ApiSuccessResponseDecorator(
    200,
    'Tokens refreshed successfully',
    JWTUserPayload,
  )
  @Public()
  @Post('/refresh-tokens')
  async refreshTokens(
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiSuccessResponse<JWTUserPayload>> {
    const refreshToken = cookieExtractor(res.req, 'refreshToken');
    if (!refreshToken) {
      return {
        message: this.ycI18nService.t('errors.invalid_token'),
      };
    }
    const { user, token } = await this.authService.refreshTokens(refreshToken);
    this.setTokensOnCookies(res, token);
    return {
      message: this.ycI18nService.t('messages.success'),
      data: user,
    };
  }
}
