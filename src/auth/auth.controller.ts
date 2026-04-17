import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { CreatedUserDTO } from 'src/domain/user/dto/created-user.dto';
import { IResponse } from 'src/common/interceptors/response-transformer.interceptor';
import { YcI18nService } from 'src/common/modules/yc-i18n/yc-i18n.service';

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
        args: { email: user.email },
      }),
      data: user,
    };
  }

  @Get('/test-mail')
  async testMail() {
    await this.authService.testMail();
  }
}
