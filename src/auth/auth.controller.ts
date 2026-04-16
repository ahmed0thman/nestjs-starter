import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { CreatedUserDTO } from 'src/domain/user/dto/created-user.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  async signUp(@Body() signUpDTO: SignUpDTO): Promise<CreatedUserDTO> {
    return this.authService.signUp(signUpDTO);
  }

  @Get('/test-mail')
  async testMail() {
    await this.authService.testMail();
  }
}
