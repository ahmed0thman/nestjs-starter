import { Injectable } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/domain/user/user.service';
import { SignUpDTO } from './dto/sign-up.dto';
import { CreatedUserDTO } from 'src/domain/user/dto/created-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly userService: UserService,
  ) {}

  async signUp(signUpDto: SignUpDTO): Promise<CreatedUserDTO> {
    const user = await this.userService.createUser(signUpDto);
    const fullName = `${user.firstName} ${user.lastName}`;
    await this.mailService.sendWelcomeEmail(user.email, fullName);
    return user;
  }

  async testMail() {
    await this.mailService.testConnection();
  }
}
